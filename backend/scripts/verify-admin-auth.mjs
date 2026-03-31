/**
 * Diagnóstico: qué ve Prisma del usuario admin y si bcrypt acepta una contraseña.
 * Uso (desde la carpeta backend): node scripts/verify-admin-auth.mjs
 * En Railway (shell del servicio API, root /app): igual, con DATABASE_URL ya inyectada.
 */
import '../src/loadEnv.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const candidates = ['Admin123', 'admin123'];

try {
  const u = await prisma.user.findUnique({
    where: { username: 'admin' },
    select: {
      id: true,
      username: true,
      status: true,
      passwordHash: true,
    },
  });

  if (!u) {
    console.log('RESULTADO: No existe fila User con username = "admin" en esta base (DATABASE_URL actual).');
    process.exit(1);
  }

  const h = u.passwordHash || '';
  console.log('Usuario:', u.username, '| status:', u.status, '| id:', u.id);
  console.log('password_hash longitud:', h.length);
  console.log('password_hash inicio:', JSON.stringify(h.slice(0, 30)) + (h.length > 30 ? '...' : ''));

  const looksBcrypt = /^\$2[aby]?\$\d{2}\$/.test(h);
  if (!looksBcrypt) {
    console.log(
      '\nPROBLEMA: El valor no parece un hash bcrypt ($2a$, $2b$, etc.). Sigue en texto plano o se cortó al pegar el UPDATE.'
    );
  }

  for (const p of candidates) {
    const ok = h ? await bcrypt.compare(p, h) : false;
    console.log(`bcrypt.compare("${p}", hash):`, ok);
  }

  console.log(
    '\nSi todo es false pero el hash es bcrypt válido: la contraseña que usás en el navegador no es ninguna de las probadas.'
  );
  console.log(
    'Si "No existe fila": el login pega a OTRO backend o otra DATABASE_URL que la consola SQL donde editaste.'
  );
} finally {
  await prisma.$disconnect();
}

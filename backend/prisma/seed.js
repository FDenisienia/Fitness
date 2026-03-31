import '../src/loadEnv.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedExerciseCatalog } from './seedExerciseCatalog.js';

const prisma = new PrismaClient();
const SALT = 10;

async function main() {
  const hash = (p) => bcrypt.hashSync(p, SALT);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@fitcoach.com',
      passwordHash: hash('Admin123'),
      name: 'Admin',
      lastName: 'Sistema',
      role: 'admin',
      status: 'active',
    },
  });

  const coachUser = await prisma.user.upsert({
    where: { username: 'coach' },
    update: {},
    create: {
      username: 'coach',
      email: 'coach@fitcoach.com',
      passwordHash: hash('Coach123'),
      name: 'Carlos',
      lastName: 'González',
      role: 'coach',
      status: 'active',
    },
  });

  await prisma.user.update({
    where: { id: coachUser.id },
    data: { createdById: adminUser.id },
  });

  const coach = await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      userId: coachUser.id,
      specialty: 'Entrenamiento funcional',
      subscriptionPlan: 'pro',
      subscriptionStatus: 'activa',
    },
  });

  const client1User = await prisma.user.upsert({
    where: { username: 'cliente1' },
    update: {},
    create: {
      username: 'cliente1',
      email: 'cliente1@email.com',
      passwordHash: hash('Cliente123'),
      name: 'Juan',
      lastName: 'Pérez',
      role: 'cliente',
      status: 'active',
    },
  });

  const client2User = await prisma.user.upsert({
    where: { username: 'cliente2' },
    update: {},
    create: {
      username: 'cliente2',
      email: 'cliente2@email.com',
      passwordHash: hash('Cliente123'),
      name: 'Ana',
      lastName: 'Martínez',
      role: 'cliente',
      status: 'active',
    },
  });

  const client1 = await prisma.client.upsert({
    where: { userId: client1User.id },
    update: {},
    create: {
      userId: client1User.id,
      coachId: coach.id,
      age: 28,
      objective: 'hipertrofia',
      level: 'intermedio',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { userId: client2User.id },
    update: {},
    create: {
      userId: client2User.id,
      coachId: coach.id,
      age: 35,
      objective: 'pérdida de peso',
      level: 'principiante',
    },
  });

  await prisma.user.updateMany({
    where: { id: { in: [client1User.id, client2User.id] } },
    data: { assignedCoachId: coach.id },
  });

  await seedExerciseCatalog(prisma);

  const ex1 = await prisma.exerciseLibrary.findFirst({ where: { name: 'Sentadilla trasera con barra', scope: 'global' } });
  const ex2 = await prisma.exerciseLibrary.findFirst({ where: { name: 'Press de banca con barra', scope: 'global' } });
  const ex3 = await prisma.exerciseLibrary.findFirst({ where: { name: 'Peso muerto rumano con barra', scope: 'global' } });
  const ex4 = await prisma.exerciseLibrary.findFirst({ where: { name: 'Flexiones', scope: 'global' } });
  if (!ex1 || !ex2 || !ex3 || !ex4) {
    throw new Error('Seed: faltan ejercicios base del catálogo (sentadilla, press plano, RDL, flexiones).');
  }

  let routine1 = await prisma.routine.findFirst({ where: { name: 'Fuerza Base', coachId: coach.id } });
  if (!routine1) routine1 = await prisma.routine.create({
    data: {
      coachId: coach.id,
      name: 'Fuerza Base',
      description: 'Rutina de fuerza enfocada en los principales grupos musculares.',
      objective: 'hipertrofia',
      level: 'intermedio',
      frequencyPerWeek: 4,
      durationMinutes: 60,
      daysCount: 4,
      stimulus: 'fuerza',
      status: 'activa',
      recommendations: 'Descansar bien entre sesiones.',
      routineExercises: {
        create: [
          { exerciseId: ex1.id, sets: 4, reps: '8', rest: '90 seg', orderIndex: 0, notes: 'Calentar bien antes' },
          { exerciseId: ex2.id, sets: 4, reps: '10', rest: '90 seg', orderIndex: 1 },
          { exerciseId: ex3.id, sets: 3, reps: '12', rest: '60 seg', orderIndex: 2, notes: 'Sentir estiramiento' },
        ],
      },
    },
  });

  let routine2 = await prisma.routine.findFirst({ where: { name: 'Full Body Principiante', coachId: coach.id } });
  if (!routine2) routine2 = await prisma.routine.create({
    data: {
      coachId: coach.id,
      name: 'Full Body Principiante',
      description: 'Rutina completa para quienes empiezan.',
      objective: 'resistencia',
      level: 'principiante',
      frequencyPerWeek: 3,
      durationMinutes: 45,
      daysCount: 3,
      stimulus: 'mixto',
      status: 'activa',
      routineExercises: {
        create: [
          { exerciseId: ex1.id, customName: 'Sentadilla con peso corporal', sets: 3, reps: '12', rest: '60 seg', orderIndex: 0 },
          { exerciseId: ex4.id, sets: 3, reps: '10', rest: '45 seg', orderIndex: 1, notes: 'Modificar con rodillas si es necesario' },
        ],
      },
    },
  });

  const cr1 = await prisma.clientRoutine.findFirst({ where: { clientId: client1.id, routineId: routine1.id } });
  if (!cr1) await prisma.clientRoutine.create({ data: { clientId: client1.id, routineId: routine1.id, assignedById: coach.id, active: true } });
  const cr2 = await prisma.clientRoutine.findFirst({ where: { clientId: client1.id, routineId: routine2.id } });
  if (!cr2) await prisma.clientRoutine.create({ data: { clientId: client1.id, routineId: routine2.id, assignedById: coach.id, active: true } });
  const cr3 = await prisma.clientRoutine.findFirst({ where: { clientId: client2.id, routineId: routine2.id } });
  if (!cr3) await prisma.clientRoutine.create({ data: { clientId: client2.id, routineId: routine2.id, assignedById: coach.id, active: true } });

  await prisma.weightLog.createMany({
    data: [
      { clientId: client1.id, weight: 82, notes: 'Control inicial' },
      { clientId: client1.id, weight: 81.5, notes: 'Buen progreso' },
      { clientId: client1.id, weight: 81 },
      { clientId: client2.id, weight: 72, notes: 'Inicio plan' },
      { clientId: client2.id, weight: 70.5, notes: 'Muy bien' },
    ],
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  await prisma.plannedWorkout.createMany({
    data: [
      { clientId: client1.id, routineId: routine1.id, date: today, completed: true, rpe: 8, notes: 'Día A' },
      { clientId: client1.id, routineId: routine1.id, date: tomorrow, completed: false, notes: 'Día B' },
      { clientId: client2.id, routineId: routine2.id, date: today, completed: true, rpe: 7 },
    ],
  });

  console.log('Seed completado: admin, coach, 2 clientes, ejercicios, rutinas, asignaciones, peso, workouts');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

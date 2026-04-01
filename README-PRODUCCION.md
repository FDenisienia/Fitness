# Despliegue en producción (paso a paso)

Guía para dejar funcionando **backend (API + MySQL/Prisma)** y **frontend (Vite/React)** en producción. El proyecto usa **Prisma 6** con **MySQL**; el backend conviene hostearlo en un servicio tipo **Railway** y el frontend en **Netlify**, **Vercel** o similar.

---

## 1. Base de datos MySQL

1. Crea una base **MySQL 8** (por ejemplo el plugin **MySQL** en Railway, o un servicio externo).
2. Anota la **URL de conexión** en formato Prisma, por ejemplo:
   ```text
   mysql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD
   ```
3. En MySQL no hace falta el parámetro `?schema=public` (es propio de Postgres). Una URL válida se parece a:
   ```text
   mysql://root:xxxx@containers-us-west-xxx.railway.app:6789/railway
   ```

---

## 2. Backend (API) — Railway u otro host Node

### 2.1 Configura el servicio

1. Conecta el repositorio y crea un servicio que ejecute **Node**.
2. En **Settings → Root Directory** pon: **`backend`**  
   Así `npm install` instala `prisma` y `@prisma/client` en el lugar correcto (evita el error `prisma: not found`).

### 2.2 Variables de entorno

Defínelas en el panel del servicio (no subas `.env` con secretos al repo). Referencia según `backend/.env.example`:

| Variable        | Descripción |
|----------------|-------------|
| `DATABASE_URL` | URL MySQL del paso 1 (obligatoria para migraciones y arranque). |
| `JWT_SECRET`   | Cadena larga y aleatoria en producción (obligatoria). |
| `NODE_ENV`     | `production` |
| `CLIENT_URL`   | URL **pública** del frontend (ej. `https://tu-app.netlify.app`). |
| `CORS_ORIGINS` | Opcional: URLs extra separadas por coma si hay más orígenes. |
| `JWT_EXPIRES_IN` | Opcional (por defecto suele usarse `7d`). |
| `CONTACT_MAIL_TO` | Opcional; por defecto `athlento.app@gmail.com` (destino del formulario de contacto de la landing). |
| `RESEND_API_KEY` / `CONTACT_RESEND_FROM` | **Recomendado en Railway:** envío del formulario vía [Resend](https://resend.com) (HTTPS). La API key va en `RESEND_API_KEY`; `CONTACT_RESEND_FROM` es un remitente verificado en Resend (ej. `contacto@tudominio.com`). Si ambas están definidas, el backend usa Resend y **no** intenta SMTP. |
| `CONTACT_SMTP_USER` / `CONTACT_SMTP_PASS` | Alternativa por SMTP (p. ej. Gmail + [contraseña de aplicación](https://support.google.com/accounts/answer/185833)). En planes gratuitos de varios hosts el **SMTP saliente suele estar bloqueado**; por eso conviene Resend arriba. Ver `backend/.env.example`. |

**Nota:** En muchos hosts, `PORT` lo inyecta la plataforma; si no, define `PORT` (p. ej. `3001`) según lo que espere tu proxy.

### 2.3 Build y arranque

- **Build command** (ejemplo):
  ```bash
  npm ci && npx prisma generate
  ```
- **Start command**:
  ```bash
  npm start
  ```

### 2.4 Migraciones (primera vez y tras cada cambio de schema)

Ejecuta **una vez** (o como **Release Command** / job tras cada deploy):

```bash
npm ci
npx prisma migrate deploy
```

- Usa siempre la **CLI de Prisma 6** del proyecto (`npm run db:migrate` desde `backend` o el comando anterior), no Prisma 7 global, para evitar errores de esquema.
- Si entras por shell al contenedor, asegúrate de estar en la carpeta donde está `package.json` del backend y de que exista `node_modules/.bin/prisma` (si no, falta `npm ci` o el **Root Directory** no es `backend`).

### 2.5 Datos iniciales (opcional)

Solo si necesitas volcar datos de prueba o catálogo en ese entorno:

```bash
npm run db:seed
# o solo catálogo de ejercicios:
npm run db:seed:catalog
```

En producción suele evitarse el seed completo salvo el primer alta controlada.

### 2.6 URL pública de la API

Copia la URL HTTPS que te da el host (ej. `https://xxx.up.railway.app`). El frontend debe apuntar a **`…/api`** (Express monta las rutas bajo `/api`).

---

## 3. Frontend (Netlify / Vercel / etc.)

1. **Root / Base directory:** raíz del repo (donde está `package.json` del frontend con Vite).
2. **Build command:** `npm ci && npm run build`
3. **Publish directory:** `dist`
4. **Variable de entorno** (obligatoria en producción para que el cliente llame a tu API):

   ```text
   VITE_API_URL=https://TU-BACKEND-PUBLICO/api
   ```

   Sustituye por la URL real del backend (con `https`, **sin** barra final antes de `/api`).

5. Tras el build, CORS en el backend debe permitir el origen del frontend (`CLIENT_URL` y/o `CORS_ORIGINS`).

---

## 4. Comprobar que todo funciona

1. Abre el frontend en el navegador; revisa en **DevTools → Network** que las peticiones van a `VITE_API_URL` y devuelven 2xx en login o rutas públicas.
2. Si ves errores CORS, revisa `CLIENT_URL` y `CORS_ORIGINS` en el backend.
3. Si el backend falla al arrancar por la base de datos, revisa `DATABASE_URL` y que `npx prisma migrate deploy` se haya ejecutado contra esa misma base.

---

## 5. Desarrollo local (referencia rápida)

- MySQL local con Docker, desde la raíz del repo: `docker compose up -d`
- En `backend`, copia `env.local.example` a `.env.local` y ajusta `DATABASE_URL` si hace falta.
- Comandos útiles en `backend`: `npm run db:migrate:dev`, `npm run db:seed:dev`, `npm run dev`

---

## 6. Problemas frecuentes

| Síntoma | Qué revisar |
|--------|-------------|
| `P1012` / `url` no soportada en `schema.prisma` | Estás usando **Prisma 7** contra un proyecto en **Prisma 6**. Ejecuta migraciones desde la carpeta `backend` con la dependencia del proyecto (`npm run db:migrate`), no `npx prisma` suelto actualizado a v7. |
| `prisma: not found` en el servidor | **Root Directory** del servicio no es `backend`, o no se ejecutó `npm ci` en esa app. |
| Login / API 401 o red incorrecta | `VITE_API_URL` mal (falta `/api` o HTTPS), o JWT/CORS mal configurados. |
| **500** en `/api/routines` (u otras rutas que lean tablas nuevas) | La base no tiene las migraciones aplicadas. Ejecuta `npx prisma migrate deploy` contra `DATABASE_URL` (el script `npm start` del backend ya lo hace antes de arrancar; si el error persiste, revisa logs del deploy y que `DATABASE_URL` apunte a la misma BD). |

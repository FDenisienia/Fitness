# FitCoach Pro

Aplicación full-stack para gestión de entrenamientos, coaches, clientes y rutinas.

## Estructura del proyecto

```
App-Nico/
├── src/                 # Frontend React + Vite
│   ├── api/             # Cliente HTTP y servicios API
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── ...
├── backend/             # API Node.js + Express
│   ├── prisma/          # Schema y migraciones MySQL
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── package.json
└── package.json
```

## Requisitos

- Node.js 18+
- MySQL 8+
- npm o pnpm

## Configuración

### 1. Base de datos MySQL

Crear una base de datos:

```sql
CREATE DATABASE fitcoach CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://USUARIO:PASSWORD@localhost:3306/fitcoach"
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura
CLIENT_URL=http://localhost:5173
```

Instalar dependencias y migrar:

```bash
npm install
npx prisma db push
npm run db:seed
```

Iniciar el backend:

```bash
npm run dev
```

### 3. Frontend

```bash
# En la raíz del proyecto
cp .env.example .env
```

Editar `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Instalar e iniciar:

```bash
npm install
npm run dev
```

## Scripts

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Frontend en desarrollo (Vite) |
| `cd backend && npm run dev` | Backend en desarrollo |
| `cd backend && npm run db:push` | Aplicar schema a MySQL |
| `cd backend && npm run db:seed` | Cargar datos de prueba |
| `cd backend && npm run db:studio` | Abrir Prisma Studio |

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | ` /api/auth/login` | Login |
| POST | ` /api/auth/register` | Registro |
| GET | ` /api/auth/me` | Perfil actual (requiere token) |
| GET | ` /api/coaches` | Listar coaches (admin) |
| GET | ` /api/clients` | Listar clientes (coach) |
| GET | ` /api/routines` | Listar rutinas |
| GET | ` /api/exercises` | Biblioteca de ejercicios |
| GET | ` /api/weight-logs/client/:id` | Historial de peso |
| GET | ` /api/planned-workouts/client/:id` | Workouts planificados |

## Deploy

### Frontend en Netlify

1. Conectar repositorio
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variables de entorno: `VITE_API_URL=https://tu-api.railway.app/api`

### Backend en Railway

1. Crear proyecto desde `backend/`
2. Añadir MySQL (plugin o servicio)
3. Variables de entorno:
   - `DATABASE_URL` (Railway la genera si usas MySQL)
   - `JWT_SECRET`
   - `CLIENT_URL` = URL de Netlify
   - `PORT` = 3001 (o el que asigne Railway)

4. Scripts:

```json
"start": "prisma migrate deploy && node src/server.js"
```

### CORS

En producción, configurar `CLIENT_URL` en el backend con la URL exacta del frontend en Netlify.

## Usuarios de prueba (seed)

| Email | Password | Rol |
|-------|----------|-----|
| admin@fitcoach.com | admin123 | admin |
| coach@fitcoach.com | coach123 | coach |
| cliente1@email.com | cliente123 | cliente |
| cliente2@email.com | cliente123 | cliente |

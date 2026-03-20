# Guía de despliegue - Athlento

Guía completa para conectar el proyecto a GitHub, desplegar en Netlify (frontend) y Railway (backend + MySQL), y crear las tablas de la base de datos.

---

## 1. Conectar el proyecto a GitHub

### 1.1 Inicializar Git (si aún no está inicializado)

```bash
cd c:\Users\fedel\OneDrive\Escritorio\App-Nico
git init
```

### 1.2 Crear archivo `.gitignore`

Asegúrate de tener un `.gitignore` que excluya:

```
# Dependencias
node_modules/
backend/node_modules/

# Variables de entorno (nunca subir credenciales)
.env
.env.local
.env.*.local
backend/.env

# Build
dist/
build/

# Logs y caché
*.log
.cache/

# IDE
.idea/
.vscode/
*.swp
*.swo
```

### 1.3 Crear repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Clic en **New repository**
3. Nombre: `App-Nico` (o el que prefieras)
4. **No** marques "Initialize with README" si ya tienes código local
5. Clic en **Create repository**

### 1.4 Subir el código

```bash
cd c:\Users\fedel\OneDrive\Escritorio\App-Nico

# Añadir todos los archivos
git add .

# Primer commit
git commit -m "Initial commit - Athlento full-stack"

# Añadir el remoto (reemplaza TU_USUARIO y TU_REPO con tus datos)
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git

# Subir a la rama main
git branch -M main
git push -u origin main
```

---

## 2. Crear tablas de datos (Prisma + MySQL)

### 2.1 Base de datos local (desarrollo)

Si usas MySQL local:

```bash
cd backend

# Crear archivo .env con tu conexión
# DATABASE_URL="mysql://usuario:contraseña@localhost:3306/fitcoach"

# Crear tablas en la base de datos
npx prisma db push

# Ejecutar seed (datos iniciales: admin, coach, clientes, ejercicios, rutinas)
npm run db:seed
```

### 2.2 Modelos de Prisma (resumen de tablas)

El proyecto usa estas tablas (definidas en `backend/prisma/schema.prisma`):

| Tabla | Descripción |
|-------|-------------|
| `User` | Usuarios (admin, coach, cliente) |
| `Coach` | Perfil de coaches |
| `Client` | Perfil de clientes |
| `ExerciseLibrary` | Biblioteca de ejercicios |
| `Routine` | Rutinas de entrenamiento |
| `RoutineExercise` | Ejercicios dentro de cada rutina |
| `ClientRoutine` | Asignación rutina-cliente |
| `PlannedWorkout` | Entrenamientos planificados por fecha |
| `WeightLog` | Registro de peso corporal |
| `ProgressLog` | Progreso por ejercicio |
| `Conversation` | Chat coach-cliente |
| `ChatMessage` | Mensajes del chat |
| `AdminCoachConversation` | Chat admin-coach |
| `AdminCoachChatMessage` | Mensajes admin-coach |

---

## 3. Desplegar en Railway (Backend + MySQL)

### 3.1 Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub

### 3.2 Crear proyecto y base de datos MySQL

1. **New Project** → **Deploy from GitHub repo**
2. Conecta tu cuenta de GitHub y selecciona el repositorio `App-Nico`
3. Añade **MySQL**:
   - Clic en **+ New** → **Database** → **MySQL**
   - Railway creará la base de datos y te dará la variable `DATABASE_URL`

4. Añade el **servicio del backend**:
   - **+ New** → **GitHub Repo** → selecciona `App-Nico`
   - En **Settings** del servicio:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Watch Paths**: `backend/**`

### 3.3 Variables de entorno en Railway

En el servicio del backend, ve a **Variables** y añade:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | (copiar de la variable que genera MySQL en Railway) |
| `PORT` | `3001` (Railway asigna uno automático, pero puedes usar este) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Genera uno seguro: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://tu-app.netlify.app` (la URL de Netlify, la pondrás después) |
| `CORS_ORIGINS` | `https://tu-app.netlify.app` |

### 3.4 Crear tablas en MySQL de Railway

Railway te da una consola. O usa el CLI:

```bash
# Instalar Railway CLI (opcional)
npm i -g @railway/cli

# Login
railway login

# Enlazar al proyecto
railway link

# Ejecutar migraciones desde tu máquina (con DATABASE_URL de Railway)
cd backend
# Pega la DATABASE_URL de Railway en .env temporalmente
npx prisma db push
npm run db:seed
```

**Alternativa**: Añade un script de post-deploy. En Railway, en **Settings** → **Deploy** puedes configurar un comando que se ejecute tras el build. O ejecuta el seed manualmente la primera vez conectándote a la DB.

### 3.5 Obtener la URL del backend

En Railway, en el servicio del backend:
- **Settings** → **Networking** → **Generate Domain**
- Copia la URL (ej: `https://app-nico-backend-production.up.railway.app`)

La API estará en: `https://TU-DOMINIO.up.railway.app/api`

---

## 4. Desplegar en Netlify (Frontend)

### 4.1 Crear cuenta en Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Inicia sesión con GitHub

### 4.2 Conectar el repositorio

1. **Add new site** → **Import an existing project**
2. Conecta GitHub y selecciona el repositorio `App-Nico`
3. Configuración del build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: (dejar vacío, el frontend está en la raíz)

### 4.3 Variables de entorno en Netlify

En **Site settings** → **Environment variables** → **Add variable**:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://TU-DOMINIO.up.railway.app/api` |

(Usa la URL de tu backend en Railway)

### 4.4 Redirecciones (SPA)

El archivo `netlify.toml` ya incluye la redirección para React Router:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4.5 Deploy

Netlify hará el deploy automáticamente. Obtendrás una URL como:
`https://random-name-123.netlify.app`

Puedes cambiar el nombre en **Domain settings** → **Options** → **Edit site name**.

---

## 5. Configuración final (CORS y URLs)

### 5.1 Actualizar CORS en Railway

Cuando tengas la URL final de Netlify, vuelve a Railway → Variables del backend y actualiza:

- `CLIENT_URL`: `https://tu-sitio.netlify.app`
- `CORS_ORIGINS`: `https://tu-sitio.netlify.app`

### 5.2 Verificar VITE_API_URL en Netlify

Asegúrate de que `VITE_API_URL` en Netlify apunte correctamente al backend de Railway.

---

## 6. Resumen de URLs

| Servicio | URL |
|----------|-----|
| Frontend (Netlify) | `https://tu-sitio.netlify.app` |
| Backend API (Railway) | `https://tu-backend.up.railway.app/api` |
| Base de datos | MySQL en Railway (solo accesible desde el backend) |

---

## 7. Credenciales de prueba (tras el seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@fitcoach.com` | `admin123` |
| Coach | `coach@fitcoach.com` | `coach123` |
| Cliente | `cliente1@email.com` | `cliente123` |

---

## 8. Comandos útiles

```bash
# Backend - desarrollo local
cd backend && npm run dev

# Backend - crear tablas
cd backend && npx prisma db push

# Backend - seed
cd backend && npm run db:seed

# Backend - Prisma Studio (ver datos)
cd backend && npx prisma studio

# Frontend - desarrollo local
npm run dev

# Frontend - build
npm run build
```

---

## 9. Solución de problemas

### Error: "DATABASE_URL not found"
- Verifica que las variables de entorno estén configuradas en Railway
- En local, crea `backend/.env` con `DATABASE_URL`

### Error: CORS en producción
- Añade la URL de Netlify a `CLIENT_URL` y `CORS_ORIGINS` en Railway

### Las tablas no existen
- Ejecuta `npx prisma db push` con la `DATABASE_URL` de Railway
- Ejecuta `npm run db:seed` para datos iniciales

### El frontend no conecta con el backend
- Verifica `VITE_API_URL` en Netlify
- Las variables `VITE_*` se inyectan en tiempo de build; si las cambias, haz un nuevo deploy

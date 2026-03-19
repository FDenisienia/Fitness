# Railway – Guía paso a paso exacta

Conecta el backend de FitCoach Pro a Railway con MySQL.

---

## Paso 1: Entrar a Railway

1. Abre **https://railway.app**
2. Haz clic en **Login**
3. Elige **Login with GitHub** y autoriza Railway

---

## Paso 2: Crear un proyecto nuevo

1. Haz clic en **New Project**
2. Elige **Deploy from GitHub repo**
3. Si no está conectado GitHub, haz clic en **Configure GitHub App** y autoriza
4. Busca y selecciona el repositorio **Fitness** (o el nombre de tu repo)
5. Haz clic en **Deploy now**

Railway creará un primer servicio con el repo. Ese será el backend.

---

## Paso 3: Añadir MySQL

1. En el panel del proyecto, haz clic en **+ New**
2. Elige **Database**
3. Selecciona **MySQL**
4. Espera a que se cree la base de datos (unos segundos)

---

## Paso 4: Vincular MySQL al backend

1. Haz clic en el **servicio del backend** (el que tiene el icono de GitHub)
2. Ve a la pestaña **Variables**
3. Haz clic en **+ New Variable** → **Add Variable Reference**
4. Busca el servicio **MySQL**
5. Selecciona la variable **DATABASE_URL**
6. Railway la añadirá automáticamente al backend

---

## Paso 5: Configurar el servicio backend

1. Con el servicio del backend seleccionado, ve a **Settings**
2. Configura:

| Opción | Valor |
|--------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npm start` |
| **Watch Paths** | `backend/**` |

3. Guarda los cambios si hace falta

---

## Paso 6: Añadir el resto de variables de entorno

En **Variables** del servicio backend, añade:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Una clave larga y aleatoria (ej: `miClaveSecreta123SuperSegura456`) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://tu-sitio.netlify.app` (o `http://localhost:5173` si aún no tienes Netlify) |
| `CORS_ORIGINS` | `https://tu-sitio.netlify.app` (o `http://localhost:5173`) |

**Nota:** No añadas `PORT`. Railway lo define automáticamente.

---

## Paso 7: Generar dominio público

1. En el servicio del backend, ve a **Settings**
2. Baja hasta **Networking**
3. Haz clic en **Generate Domain**
4. Copia la URL que aparece (ej: `https://fitness-production-xxxx.up.railway.app`)

La API estará en: **`https://TU-DOMINIO.up.railway.app/api`**

---

## Paso 8: Crear las tablas en MySQL

Tienes dos opciones:

### Opción A: Con Railway CLI (recomendado)

1. Instala el CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Inicia sesión:
   ```bash
   railway login
   ```

3. Entra al proyecto:
   ```bash
   cd c:\Users\fedel\OneDrive\Escritorio\App-Nico
   railway link
   ```
   - Elige tu proyecto
   - Elige el servicio del **backend**

4. Ejecuta Prisma con las variables de Railway:
   ```bash
   cd backend
   railway run npx prisma db push
   railway run npm run db:seed
   ```

### Opción B: Sin CLI (copiando DATABASE_URL)

1. En Railway, entra al servicio **MySQL**
2. Ve a **Variables** o **Connect**
3. Copia el valor de **DATABASE_URL** (o **MYSQL_URL** si aparece así)
4. En tu PC, crea o edita `backend/.env`:
   ```
   DATABASE_URL="mysql://root:PASSWORD@HOST:PORT/railway"
   ```
   (pega el valor exacto que te dio Railway)

5. En la terminal:
   ```bash
   cd c:\Users\fedel\OneDrive\Escritorio\App-Nico\backend
   npx prisma db push
   npm run db:seed
   ```

---

## Paso 9: Comprobar que funciona

1. Abre en el navegador:
   ```
   https://TU-DOMINIO.up.railway.app/api/health
   ```
   Deberías ver algo como: `{"success":true,"message":"FitCoach API OK"}`

2. Prueba el login:
   ```
   POST https://TU-DOMINIO.up.railway.app/api/auth/login
   Body: {"email":"admin@fitcoach.com","password":"admin123"}
   ```

---

## Paso 10: Conectar el frontend (Netlify)

Cuando tengas el frontend en Netlify:

1. En Netlify → **Site settings** → **Environment variables**
2. Añade: `VITE_API_URL` = `https://TU-DOMINIO.up.railway.app/api`

3. En Railway → Variables del backend, actualiza:
   - `CLIENT_URL` = URL de tu sitio en Netlify
   - `CORS_ORIGINS` = URL de tu sitio en Netlify

4. Haz un nuevo deploy en Netlify para que tome la variable.

---

## Resumen de URLs

| Qué | URL |
|-----|-----|
| API (Railway) | `https://TU-DOMINIO.up.railway.app/api` |
| Health check | `https://TU-DOMINIO.up.railway.app/api/health` |
| Login | `https://TU-DOMINIO.up.railway.app/api/auth/login` |

---

## Errores frecuentes

**"Application failed to respond"**
- Revisa que **Root Directory** sea `backend`
- Revisa que **Start Command** sea `npm start`
- Mira los logs en Railway → **Deployments** → último deploy → **View Logs**

**"DATABASE_URL not found"**
- Asegúrate de haber vinculado la variable de MySQL al backend (Paso 4)
- Si usas referencia, no hace falta escribirla a mano

**"Prisma Client not generated"**
- Añade `npx prisma generate` al **Build Command**
- Build completo: `npm install && npx prisma generate`

**CORS en producción**
- Añade la URL exacta de Netlify a `CLIENT_URL` y `CORS_ORIGINS`
- Sin `http://` o `https://` correcto, el navegador bloqueará las peticiones

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// 1) .env = Railway / valores compartidos (JWT, CORS, etc.)
dotenv.config();

// 2) .env.local = solo tu máquina (MySQL local). Sobrescribe .env cuando el archivo existe.
// No subir .env.local a git; en deploy (Railway) no suele existir ese archivo.
const envLocal = join(process.cwd(), '.env.local');
if (existsSync(envLocal)) {
  dotenv.config({ path: envLocal, override: true });
}

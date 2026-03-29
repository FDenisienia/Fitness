import { config } from './config/index.js';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Necesario cuando la API está detrás de un proxy (Docker, Railway, etc.)
// para que express-rate-limit use correctamente X-Forwarded-For
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (config.corsOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

// Limitación solo en producción (Railway suele tener NODE_ENV=production).
// En local evita 429 en login y muchas peticiones al cargar la app.
if (process.env.NODE_ENV === 'production') {
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { success: false, error: 'Demasiadas peticiones' },
    })
  );
}

app.use('/api', routes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Athlento API running on port ${config.port}`);
});

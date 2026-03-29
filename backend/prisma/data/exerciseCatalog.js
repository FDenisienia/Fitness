import pecho from './catalog/pecho.js';
import espalda from './catalog/espalda.js';
import hombros from './catalog/hombros.js';
import brazos from './catalog/brazos.js';
import inferior from './catalog/inferior.js';
import piernas from './catalog/piernas.js';
import core from './catalog/core.js';
import cardio from './catalog/cardio.js';
import hiit from './catalog/hiit.js';
import movilidad from './catalog/movilidad.js';
import deportes from './catalog/deportes.js';

/**
 * Catálogo global de ejercicios para seed.
 * Futuro: añadir tags/dificultad en esquema Prisma y mapear desde aquí.
 */
export const EXERCISE_CATALOG = [
  ...pecho,
  ...espalda,
  ...hombros,
  ...brazos,
  ...inferior,
  ...piernas,
  ...core,
  ...cardio,
  ...hiit,
  ...movilidad,
  ...deportes,
];

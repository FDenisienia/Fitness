import '../src/loadEnv.js';
import { PrismaClient } from '@prisma/client';
import { seedExerciseCatalog } from './seedExerciseCatalog.js';

const prisma = new PrismaClient();

seedExerciseCatalog(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

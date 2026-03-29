import { EXERCISE_CATALOG } from './data/exerciseCatalog.js';

function normalizeName(name) {
  return (name || '').trim();
}

/**
 * Inserta ejercicios globales sin duplicar por nombre (misma cadena exacta).
 * @returns {{ created: number, skipped: number }}
 */
export async function seedExerciseCatalog(prisma) {
  let created = 0;
  let skipped = 0;

  for (const ex of EXERCISE_CATALOG) {
    const name = normalizeName(ex.name);
    if (!name) continue;

    const exists = await prisma.exerciseLibrary.findFirst({
      where: {
        name,
        scope: 'global',
        status: 'active',
      },
    });
    if (exists) {
      skipped += 1;
      continue;
    }

    await prisma.exerciseLibrary.create({
      data: {
        name,
        description: ex.description ?? null,
        instructions: ex.instructions ?? null,
        muscleGroup: ex.muscleGroup ?? null,
        equipment: ex.equipment ?? null,
        caloriasPorRep: ex.caloriasPorRep != null ? Number(ex.caloriasPorRep) : null,
        caloriasPorMin: ex.caloriasPorMin != null ? Number(ex.caloriasPorMin) : null,
        videoUrl: ex.videoUrl ?? null,
        scope: 'global',
        status: 'active',
        createdById: null,
      },
    });
    created += 1;
  }

  console.log(`Catálogo de ejercicios: ${created} nuevos, ${skipped} ya existían (omitidos).`);
  return { created, skipped };
}

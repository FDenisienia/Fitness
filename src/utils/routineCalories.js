// Calcula calorías estimadas por ejercicio y por rutina
// caloriasPorRep: calorías por repetición | caloriasPorMin: calorías por minuto
export function calcExerciseCalories(ex, libraryEx = null) {
  const calRep = ex.caloriasPorRep ?? libraryEx?.caloriasPorRep;
  const calMin = ex.caloriasPorMin ?? libraryEx?.caloriasPorMin;
  const sets = parseInt(ex.sets, 10) || 0;
  const reps = ex.reps ? (typeof ex.reps === 'string' ? parseInt(ex.reps, 10) : ex.reps) : 0;
  const time = ex.time ? (typeof ex.time === 'string' ? parseInt(ex.time, 10) : ex.time) : 0;

  if (calRep && reps > 0) {
    return Math.round(sets * reps * calRep);
  }
  if (calMin && time > 0) {
    return Math.round((time / 60) * calMin);
  }
  return 0;
}

export function calcRoutineCalories(routine, exerciseLibrary = []) {
  if (!routine?.exercises?.length) return { total: 0, byExercise: [] };
  const byExercise = routine.exercises.map(ex => {
    const libEx = ((ex.exerciseId || ex.libraryExerciseId) && exerciseLibrary.find(e => e.id === (ex.exerciseId || ex.libraryExerciseId)))
      || exerciseLibrary.find(e => e.name === ex.name);
    const kcal = calcExerciseCalories(ex, libEx);
    return { name: ex.name, kcal };
  });
  const total = byExercise.reduce((a, e) => a + e.kcal, 0);
  return { total, byExercise };
}

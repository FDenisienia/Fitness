/**
 * Orden de ejercicios relativo a cada sesión (bloque). La lista plana se guarda
 * como bloques en orden numérico (1, 2, 3…) y dentro de cada bloque por `order`.
 */

export function getExerciseSessionIndex(ex) {
  return ex.sessionIndex != null && ex.sessionIndex !== ''
    ? Math.max(1, parseInt(String(ex.sessionIndex), 10) || 1)
    : 1;
}

/**
 * Agrupa por sesión en el orden en que aparecen en el array, luego aplana por índice de sesión ascendente.
 * Asigna `order` 0..n-1 dentro de cada sesión y normaliza `sessionIndex`.
 */
export function normalizeExercisesFlatOrder(exercises) {
  if (!exercises?.length) return [];
  const bySession = new Map();
  for (const ex of exercises) {
    const si = getExerciseSessionIndex(ex);
    if (!bySession.has(si)) bySession.set(si, []);
    bySession.get(si).push(ex);
  }
  const keys = [...bySession.keys()].sort((a, b) => a - b);
  const out = [];
  for (const k of keys) {
    bySession.get(k).forEach((ex, idx) => {
      out.push({ ...ex, sessionIndex: k, order: idx });
    });
  }
  return out;
}

/**
 * Reemplaza el orden de los ejercicios de una sesión manteniendo el resto de bloques.
 */
export function replaceSessionOrder(exercises, sessionIndex, reorderedForSession) {
  const s = sessionIndex;
  const filtered = exercises.filter((ex) => getExerciseSessionIndex(ex) !== s);
  const keys = [...new Set([...filtered.map(getExerciseSessionIndex), s])].sort((a, b) => a - b);
  const byS = new Map();
  for (const ex of filtered) {
    const k = getExerciseSessionIndex(ex);
    if (!byS.has(k)) byS.set(k, []);
    byS.get(k).push(ex);
  }
  byS.set(s, reorderedForSession);
  return keys.flatMap((k) => byS.get(k) || []);
}

export function moveExerciseInSession(exercises, sessionIndex, exerciseId, direction) {
  const inSession = exercises.filter((ex) => getExerciseSessionIndex(ex) === sessionIndex);
  const idx = inSession.findIndex((ex) => ex.id === exerciseId);
  if (idx < 0) return exercises;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= inSession.length) return exercises;
  const reordered = [...inSession];
  const [removed] = reordered.splice(idx, 1);
  reordered.splice(newIdx, 0, removed);
  return replaceSessionOrder(exercises, sessionIndex, reordered);
}

export function exercisesForSession(exercises, sessionIndex) {
  return exercises.filter((ex) => getExerciseSessionIndex(ex) === sessionIndex);
}

/**
 * Sesiones/bloques de rutina: nombres por índice (1-based), alineado con sessionIndex de ejercicios.
 */

export function getSessionIndicesFromExercises(exercises) {
  const set = new Set();
  for (const ex of exercises || []) {
    const si =
      ex.sessionIndex != null && ex.sessionIndex !== ''
        ? Math.max(1, parseInt(String(ex.sessionIndex), 10) || 1)
        : 1;
    set.add(si);
  }
  return [...set].sort((a, b) => a - b);
}

/** Siguiente índice de bloque (p. ej. si existen 1 y 2 → 3). */
export function getNextSessionIndex(exercises) {
  const indices = getSessionIndicesFromExercises(exercises);
  if (!indices.length) return 1;
  return Math.max(...indices) + 1;
}

/** Índice del último bloque usado (para añadir ejercicios al bloque activo final). */
export function getLastSessionIndex(exercises) {
  const indices = getSessionIndicesFromExercises(exercises);
  if (!indices.length) return 1;
  return Math.max(...indices);
}

/**
 * @param {number} sessionIndex
 * @param {Record<string, string>|null|undefined} sessionNames
 */
export function getSessionDisplayName(sessionIndex, sessionNames) {
  const key = String(sessionIndex);
  const raw = sessionNames?.[key] ?? sessionNames?.[sessionIndex];
  if (raw != null && String(raw).trim()) return String(raw).trim();
  return `Sesión ${sessionIndex}`;
}

/**
 * Asegura una entrada por cada índice usado en ejercicios (para inputs del formulario).
 * @param {Record<string, string>|null|undefined} sessionNames
 * @param {object[]} exercises
 */
export function mergeSessionNameKeys(sessionNames, exercises) {
  const indices = getSessionIndicesFromExercises(exercises);
  const next = { ...(sessionNames || {}) };
  for (const n of indices) {
    const k = String(n);
    if (next[k] === undefined) next[k] = '';
  }
  return next;
}

/**
 * @param {Record<string, string>|null|undefined} sessionNames
 * @param {object[]} exercises
 */
export function buildSessionNamesPayload(sessionNames, exercises) {
  const indices = getSessionIndicesFromExercises(exercises);
  const out = {};
  for (const n of indices) {
    const k = String(n);
    const raw = sessionNames?.[k] ?? sessionNames?.[n];
    out[k] = raw != null ? String(raw).trim() : '';
  }
  return out;
}

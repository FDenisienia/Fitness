/**
 * Preferencias locales por conversación (archivo, estado, notas).
 * Preparado para migrar a backend sin cambiar la UI.
 */

const PREFIX = 'athlento.chat.prefs';

function key(userId, variant) {
  return `${PREFIX}.${variant}.${userId || 'anon'}`;
}

export const CHAT_STATUS = {
  OPEN: 'open',
  PENDING: 'pending',
  RESPONDED: 'responded',
};

export function loadConvPrefs(userId, variant) {
  try {
    const raw = localStorage.getItem(key(userId, variant));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function saveConvPrefs(userId, variant, prefs) {
  try {
    localStorage.setItem(key(userId, variant), JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

export function getConvEntry(prefs, convKey) {
  return prefs[convKey] || {};
}

export function setConvEntry(userId, variant, convKey, partial) {
  const prefs = loadConvPrefs(userId, variant);
  const prev = prefs[convKey] || {};
  prefs[convKey] = { ...prev, ...partial };
  saveConvPrefs(userId, variant, prefs);
  return prefs;
}

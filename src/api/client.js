/**
 * La API monta todas las rutas bajo /api (ver backend server.js).
 * Si VITE_API_URL es p. ej. http://localhost:3001 sin /api, las peticiones dan 404.
 * En desarrollo sin variable, usamos /api y el proxy de Vite (vite.config.js).
 */
function normalizeApiBase(raw) {
  const trimmed = raw == null ? '' : String(raw).trim();
  if (trimmed === '') {
    if (import.meta.env.DEV) return '/api';
    return 'http://localhost:3001/api';
  }
  let base = trimmed.replace(/\/+$/, '');
  if (!/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  return base;
}

const API_URL = normalizeApiBase(import.meta.env.VITE_API_URL);

function getToken() {
  return sessionStorage.getItem('fitcoach_token') || localStorage.getItem('fitcoach_token');
}

async function request(endpoint, options = {}) {
  const { timeoutMs = 0, ...fetchOptions } = options;
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = { ...fetchOptions, headers };
  if (timeoutMs > 0 && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(timeoutMs);
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    const name = e?.name || '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new Error(
        'La petición tardó demasiado. Si era el contacto, el servidor puede estar bloqueando el envío por SMTP o la API no responde.'
      );
    }
    throw e;
  }
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, reqOpts) => request(path, { method: 'GET', ...reqOpts }),
  post: (path, body, reqOpts) =>
    request(path, { method: 'POST', body: JSON.stringify(body), ...reqOpts }),
  put: (path, body, reqOpts) =>
    request(path, { method: 'PUT', body: JSON.stringify(body), ...reqOpts }),
  patch: (path, body, reqOpts) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body), ...reqOpts }),
  delete: (path, reqOpts) => request(path, { method: 'DELETE', ...reqOpts }),
};


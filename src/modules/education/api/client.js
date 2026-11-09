import { EDUCATION_API_URL } from '../../../shared/config.js';

const TOKEN_KEY = 'edu_token';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const safeStorage = (storage) => ({
  get: (k) => {
    try { return storage.getItem(k); } catch { return null; }
  },
  set: (k, v) => {
    try { v === null ? storage.removeItem(k) : storage.setItem(k, v); } catch { return undefined; }
    return undefined;
  },
});

const local = safeStorage(window.localStorage);

export const tokenStore = { get: () => local.get(TOKEN_KEY), set: (t) => local.set(TOKEN_KEY, t || null) };

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

function headers(clientId, json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) h.Authorization = `Bearer ${token}`;
  if (clientId) h['X-Client-Id'] = clientId;
  return h;
}

async function parse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && tokenStore.get()) onUnauthorized();
    throw new ApiError(res.status, data.error || 'Error inesperado', data.details);
  }
  return data;
}

async function request(method, path, { body, clientId, form } = {}) {
  let res;
  try {
    res = await fetch(`${EDUCATION_API_URL}${path}`, {
      method,
      headers: headers(clientId, !form),
      body: form || (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }
  return parse(res);
}

async function download(path, clientId, fallbackName = 'documento.pdf') {
  const res = await fetch(`${EDUCATION_API_URL}${path}`, { headers: headers(clientId, false) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || 'No se pudo descargar');
  }
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || fallbackName;
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function blobUrl(path, clientId) {
  const res = await fetch(`${EDUCATION_API_URL}${path}`, { headers: headers(clientId, false) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || 'No se pudo abrir el archivo');
  }
  return URL.createObjectURL(await res.blob());
}

export function createApi(clientId = null) {
  return {
    clientId,
    get: (p) => request('GET', p, { clientId }),
    post: (p, body = {}) => request('POST', p, { body, clientId }),
    put: (p, body) => request('PUT', p, { body, clientId }),
    patch: (p, body) => request('PATCH', p, { body, clientId }),
    del: (p, body) => request('DELETE', p, { body, clientId }),
    upload: (p, form, method = 'POST') => request(method, p, { form, clientId }),
    download: (p, name) => download(p, clientId, name),
    blobUrl: (p) => blobUrl(p, clientId),
  };
}

export const api = createApi();

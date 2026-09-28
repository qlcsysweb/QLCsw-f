import axios from 'axios';

// URL del backend configurable por entorno (frontend/.env → VITE_API_URL).
// Si no está definida, cae de vuelta a '/api' relativo (útil solo cuando
// algo delante del frontend —como el proxy de `vite dev`— reenvía esa ruta).
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Frontend (Vercel) y backend (Render) viven en dominios distintos, así que
// la cookie de sesión es de "terceros" desde el punto de vista del
// navegador: Chrome, Safari y Firefox la bloquean por defecto (aunque el
// backend la envíe con Secure/SameSite=None correctos), y el login parece
// funcionar pero toda petición siguiente devuelve 401 "Sesión no
// encontrada". Por eso el token también viaja en el cuerpo JSON de
// login/registro y se reenvía a mano como header Authorization: Bearer —
// eso nunca depende de la política de cookies del navegador. La cookie se
// mantiene además como respaldo para cuando sí coincide el dominio.
const TOKEN_STORAGE_KEY = 'qlc_auth_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage puede no estar disponible (modo privado estricto); la
    // sesión sigue intentando funcionar vía cookie en ese caso.
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AUDITORÍA SINCRONIZACIÓN GLOBAL — hasta ahora solo el chequeo inicial
// (AuthContext.refresh(), una sola vez al montar) reaccionaba a un 401
// limpiando la sesión. Si el token expiraba MIENTRAS la pestaña seguía
// abierta, cada sondeo en segundo plano (usePolling) recibía 401
// silenciosamente para siempre y el usuario se quedaba viendo datos
// obsoletos sin que nada lo mandara de vuelta al login. AuthContext
// registra aquí el mismo "limpiar sesión" para que CUALQUIER 401, venga de
// donde venga, lo dispare — nunca en 403 (permisos insuficientes con
// sesión válida) ni en otros códigos, para no cerrar sesión por un error de
// servidor/red ni por un simple "no autorizado para esto".
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Ocurrió un error. Intenta nuevamente.';
    const wrapped = new Error(message);
    // Se exponen además de `.message` (ya usado en toda la app) para que
    // quien lo necesite pueda diferenciar el tipo de error sin parsear texto
    // — p. ej. 404 (no existe / no es tuyo) vs 410 (existe pero desactivada).
    wrapped.status = error.response?.status;
    wrapped.details = error.response?.data?.details;
    if (wrapped.status === 401) onUnauthorized?.();
    return Promise.reject(wrapped);
  }
);

export default api;

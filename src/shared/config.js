const trimSlashes = (value) => String(value || '').replace(/^\/+|\/+$/g, '');

// VITE_API_URL es solo el origen del backend; cada módulo agrega su propia ruta.
// Se tolera un valor terminado en /api o /trad/api para no duplicar el prefijo.
export const normalizeApiOrigin = (value) =>
  String(value || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/(?:\/trad)?\/api$/, '');

const API_ORIGIN = normalizeApiOrigin(import.meta.env.VITE_API_URL);

export const TRADING_BASE_PATH = `/${trimSlashes(import.meta.env.VITE_TRADING_BASE_PATH || '/trad')}`;
export const EDUCATION_API_URL = `${API_ORIGIN}/api`;
export const TRADING_API_URL = `${API_ORIGIN}${TRADING_BASE_PATH}/api`;

export const isTradingPath = (pathname) => pathname === TRADING_BASE_PATH || pathname.startsWith(`${TRADING_BASE_PATH}/`);

export const tradingPath = (path = '/') => (path.startsWith(TRADING_BASE_PATH + '/') || path === TRADING_BASE_PATH ? path : `${TRADING_BASE_PATH}${path}`);

export const stripTradingBase = (pathname) => (isTradingPath(pathname) ? pathname.slice(TRADING_BASE_PATH.length) || '/' : pathname);

export const tradingPublicUrl = () => `${window.location.origin}${TRADING_BASE_PATH}/`;

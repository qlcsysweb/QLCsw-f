const trimSlashes = (value) => String(value || '').replace(/^\/+|\/+$/g, '');

const API_ORIGIN = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const TRADING_BASE_PATH = `/${trimSlashes(import.meta.env.VITE_TRADING_BASE_PATH || '/trad')}`;
export const EDUCATION_API_URL = `${API_ORIGIN}/api`;
export const TRADING_API_URL = `${API_ORIGIN}${TRADING_BASE_PATH}/api`;

export const isTradingPath = (pathname) => pathname === TRADING_BASE_PATH || pathname.startsWith(`${TRADING_BASE_PATH}/`);

export const tradingPath = (path = '/') => (path.startsWith(TRADING_BASE_PATH + '/') || path === TRADING_BASE_PATH ? path : `${TRADING_BASE_PATH}${path}`);

export const stripTradingBase = (pathname) => (isTradingPath(pathname) ? pathname.slice(TRADING_BASE_PATH.length) || '/' : pathname);

export const tradingPublicUrl = () => `${window.location.origin}${TRADING_BASE_PATH}/`;

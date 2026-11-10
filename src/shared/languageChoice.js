import { TRADING_BASE_PATH } from './config.js';

// El selector de idioma aparece en cada visita: cada vez que se abre el sitio en una pestaña
// o ventana nueva. Dentro de la misma visita (sessionStorage) no se repite al pasar entre
// educación y trading. El idioma elegido se guarda para usarlo en ambas plataformas.
const PROMPT_SESSION_KEY = 'site_language_chosen';
const EDUCATION_LANGUAGE_KEY = 'edu_lang';
const TRADING_LANGUAGE_COOKIE = 'trad_language';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function languagePromptPending() {
  try {
    return sessionStorage.getItem(PROMPT_SESSION_KEY) !== '1';
  } catch {
    return false;
  }
}

export function rememberLanguageChoice(code) {
  try {
    sessionStorage.setItem(PROMPT_SESSION_KEY, '1');
  } catch {
    // Sin sessionStorage el selector vuelve a salir en la siguiente página; no bloquea nada.
  }
  try {
    localStorage.setItem(EDUCATION_LANGUAGE_KEY, code);
  } catch {
    // Sin localStorage la elección sigue valiendo para la página actual.
  }
  document.cookie = `${TRADING_LANGUAGE_COOKIE}=${code}; Max-Age=${COOKIE_MAX_AGE}; Path=${TRADING_BASE_PATH}; SameSite=Lax`;
}

import { TRADING_BASE_PATH } from './config.js';

// Preferencia del visitante, no de sesión: elegir el idioma en una plataforma
// evita que la otra vuelva a preguntarlo el mismo día.
const PROMPT_DATE_KEY = 'site_language_prompt_date';
const EDUCATION_LANGUAGE_KEY = 'edu_lang';
const TRADING_LANGUAGE_COOKIE = 'trad_language';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

const today = () => new Date().toISOString().slice(0, 10);

export function languagePromptPending() {
  try {
    return localStorage.getItem(PROMPT_DATE_KEY) !== today();
  } catch {
    return false;
  }
}

export function rememberLanguageChoice(code) {
  try {
    localStorage.setItem(PROMPT_DATE_KEY, today());
    localStorage.setItem(EDUCATION_LANGUAGE_KEY, code);
  } catch {
    // Sin localStorage la elección sigue valiendo para la página actual.
  }
  document.cookie = `${TRADING_LANGUAGE_COOKIE}=${code}; Max-Age=${COOKIE_MAX_AGE}; Path=${TRADING_BASE_PATH}; SameSite=Lax`;
}

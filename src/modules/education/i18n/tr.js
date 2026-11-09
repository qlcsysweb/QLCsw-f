import { PAGES_EN } from './locales/pages.en.js';
import { ACADEMY_EN } from './locales/academy.en.js';

const EN = { ...ACADEMY_EN, ...PAGES_EN };

let current = 'es';

export const setTrLang = (lang) => {
  current = lang === 'en' ? 'en' : 'es';
};

export const getLanguage = () => current;

export function tr(text, vars) {
  if (typeof text !== 'string') return text;
  const value = current === 'en' ? EN[text] ?? EN[text.trim()] ?? text : text;
  return vars ? value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : value;
}

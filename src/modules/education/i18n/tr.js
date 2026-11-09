import { PAGES_EN } from './locales/pages.en.js';
import { ACADEMY_EN } from './locales/academy.en.js';
import { PAGES_PT } from './locales/pages.pt.js';
import { ACADEMY_PT } from './locales/academy.pt.js';

const EN = { ...ACADEMY_EN, ...PAGES_EN };
// Lo que aún no tenga traducción al portugués se muestra en español.
const PT = { ...ACADEMY_PT, ...PAGES_PT };
const DICTS = { en: EN, pt: PT };

let current = 'es';

export const setTrLang = (lang) => {
  current = DICTS[lang] ? lang : 'es';
};

export const getLanguage = () => current;

export function tr(text, vars) {
  if (typeof text !== 'string') return text;
  const dict = DICTS[current];
  const value = dict ? dict[text] ?? dict[text.trim()] ?? text : text;
  return vars ? value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : value;
}

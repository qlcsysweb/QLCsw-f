import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { es } from './locales/es.js';
import { en } from './locales/en.js';
import { setFormatLocale } from '../utils/format.js';
import { applyLabels } from '../utils/labels.js';
import { setTrLang } from './tr.js';

export const LANGUAGES = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
];

const MESSAGES = { es, en };
const DEFAULT_LANG = 'es';
const STORAGE_KEY = 'edu_lang';
const PENDING_KEY = 'edu_lang_pending';

export const langChoice = {
  pending: () => {
    try { return localStorage.getItem(PENDING_KEY) === '1'; } catch { return false; }
  },
  mark: () => {
    try { localStorage.setItem(PENDING_KEY, '1'); } catch { return undefined; }
    return undefined;
  },
  clear: () => {
    try { localStorage.removeItem(PENDING_KEY); } catch { return undefined; }
    return undefined;
  },
};

const lookup = (dict, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);

const interpolate = (value, vars) =>
  typeof value === 'string' && vars ? value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : value;

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (MESSAGES[saved]) return saved;
  } catch {
    return DEFAULT_LANG;
  }
  const browser = (navigator.language || '').slice(0, 2);
  return MESSAGES[browser] ? browser : DEFAULT_LANG;
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  setFormatLocale(lang);
  applyLabels(lang);
  setTrLang(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      return undefined;
    }
    return undefined;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (MESSAGES[code]) setLangState(code);
  }, []);

  const chooseLang = useCallback((code) => {
    if (!MESSAGES[code]) return;
    langChoice.mark();
    setLangState(code);
  }, []);

  const t = useCallback((key, vars) => {
    const value = lookup(MESSAGES[lang], key) ?? lookup(MESSAGES[DEFAULT_LANG], key) ?? key;
    return interpolate(value, vars);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, chooseLang, t, languages: LANGUAGES }), [lang, setLang, chooseLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

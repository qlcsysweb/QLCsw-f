import { createContext, useContext, useMemo, useState } from 'react';
import { getCookie, setCookie } from '../utils/cookies';
import translations from './translations';

const COOKIE_NAME = 'qlc_language';
const COOKIE_DAYS = 365;
const SUPPORTED = ['es', 'en'];

const LanguageContext = createContext(null);

function readInitialLanguage() {
  const fromCookie = getCookie(COOKIE_NAME);
  if (SUPPORTED.includes(fromCookie)) return fromCookie;
  return null; // null = todavía no eligió (dispara la pantalla de bienvenida)
}

function resolveValue(dict, key) {
  return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLanguage);

  const setLanguage = (lang) => {
    if (!SUPPORTED.includes(lang)) return;
    setCookie(COOKIE_NAME, lang, COOKIE_DAYS);
    setLanguageState(lang);
  };

  const t = useMemo(() => {
    const dict = translations[language || 'es'];
    return (key, fallback) => {
      const value = resolveValue(dict, key);
      if (value !== undefined) return value;
      return fallback !== undefined ? fallback : key;
    };
  }, [language]);

  const value = { language, setLanguage, t, hasChosenLanguage: !!language };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  return ctx;
}

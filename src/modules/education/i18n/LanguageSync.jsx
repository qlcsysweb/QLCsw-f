import { useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { langChoice, useI18n } from './I18nContext.jsx';

const syncedKey = (id) => `edu_lang_synced_${id}`;

const wasSynced = (id) => {
  try { return localStorage.getItem(syncedKey(id)) === '1'; } catch { return true; }
};

const markSynced = (id) => {
  try { localStorage.setItem(syncedKey(id), '1'); } catch { return undefined; }
  return undefined;
};

export function LanguageSync() {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  const saved = useRef({ id: null, language: null });

  useEffect(() => {
    if (!user) {
      saved.current = { id: null, language: null };
      return;
    }
    if (saved.current.id !== user.id) saved.current = { id: user.id, language: user.language || 'es' };
    const firstVisit = !wasSynced(user.id) && saved.current.language === 'es' && lang === 'en';
    if (langChoice.pending() || firstVisit) {
      langChoice.clear();
      markSynced(user.id);
      if (saved.current.language !== lang) {
        const previous = saved.current.language;
        saved.current.language = lang;
        api.put('/auth/language', { language: lang }).catch(() => {
          saved.current.language = previous;
          langChoice.mark();
        });
      }
      return;
    }
    markSynced(user.id);
    if (saved.current.language !== lang) setLang(saved.current.language);
  }, [user, lang, setLang]);

  return null;
}

import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedContentValue, getLocalizedModel, getLocalizedFaq, getLocalizedTrackRecord } from '../../i18n/bilingualContent';
import PUBLIC_CONTENT from '../../content/publicContent';

/*
 * Datos del sitio público — pensado para NO despertar NeonDB en cada visita:
 *  - Los TEXTOS (español e inglés) vienen del código (src/content/publicContent.js):
 *    cero peticiones.
 *  - Multimedia, modelos, FAQ y track record (lo que el admin sí actualiza)
 *    se piden UNA vez por visita y se comparten entre páginas públicas
 *    (inicio, privacidad, términos) durante unos minutos. Ya no hay sondeo
 *    cada 20 s. Además el backend los sirve desde caché en memoria.
 */
const SHARED_TTL_MS = 5 * 60 * 1000;
let shared = null; // { promise, at }

function loadShared() {
  if (shared && Date.now() - shared.at < SHARED_TTL_MS) return shared.promise;
  const promise = Promise.all([api.get('/media'), api.get('/models'), api.get('/faq'), api.get('/track-record')]).then(
    ([mediaRes, modelsRes, faqRes, trackRes]) => ({
      media: mediaRes.data.media,
      models: modelsRes.data.models,
      faqs: faqRes.data.faqs,
      trackRecord: trackRes.data.trackRecord,
    })
  );
  shared = { promise, at: Date.now() };
  // Un fallo no se queda guardado: la siguiente página lo vuelve a intentar.
  promise.catch(() => {
    shared = null;
  });
  return promise;
}

export default function usePublicData() {
  const { language } = useLanguage();
  const [data, setData] = useState({ media: {}, models: [], faqs: [], trackRecord: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadShared()
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cada texto trae { value, valueEn }; se muestra solo el del idioma activo.
  const text = (section, key, fallback = '') => getLocalizedContentValue(PUBLIC_CONTENT?.[section]?.[key], language, fallback);

  // Multimedia publicada asignada a una sección — array vacío si el admin
  // no configuró nada (nunca se inserta contenido automáticamente).
  const sectionMedia = (location) => data.media?.[location] || [];

  const models = useMemo(() => (data.models || []).map((m) => getLocalizedModel(m, language)), [data.models, language]);
  const faqs = useMemo(() => (data.faqs || []).map((f) => getLocalizedFaq(f, language)), [data.faqs, language]);
  const trackRecord = useMemo(() => getLocalizedTrackRecord(data.trackRecord, language), [data.trackRecord, language]);

  return { content: PUBLIC_CONTENT, text, media: sectionMedia, models, faqs, trackRecord, loading };
}

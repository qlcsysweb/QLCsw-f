import { useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedContentValue, getLocalizedModel, getLocalizedFaq, getLocalizedTrackRecord } from '../../i18n/bilingualContent';
import PUBLIC_CONTENT from '../../content/publicContent';
import { FAQS, MODELS, TRACK_RECORD_TEXT } from '../../content/publicSiteData';
import { useSiteData } from '../../content/siteData';

/*
 * Datos del sitio público — 0 consultas al backend y a NeonDB:
 *  - TEXTOS en español e inglés (secciones, FAQ, modelo, Resultados) vienen
 *    del código (src/content/).
 *  - Cifras/enlace del perfil de Bitget, logos y multimedia (lo que el admin
 *    sí actualiza) vienen de site-data.json en el CDN de Cloudinary
 *    (src/content/siteData.js), con valores predefinidos de respaldo.
 */
export default function usePublicData() {
  const { language } = useLanguage();
  const site = useSiteData();

  // Cada texto trae { value, valueEn }; se muestra solo el del idioma activo.
  const text = (section, key, fallback = '') => getLocalizedContentValue(PUBLIC_CONTENT?.[section]?.[key], language, fallback);

  // Multimedia publicada asignada a una sección — array vacío si el admin
  // no configuró nada (nunca se inserta contenido automáticamente).
  const sectionMedia = (location) => site.sectionMedia?.[location] || [];

  const models = useMemo(() => MODELS.map((m) => getLocalizedModel(m, language)), [language]);
  const faqs = useMemo(() => FAQS.map((f) => getLocalizedFaq(f, language)), [language]);
  const trackRecord = useMemo(
    () => (site.trackRecord ? getLocalizedTrackRecord({ ...TRACK_RECORD_TEXT, ...site.trackRecord, isActive: true }, language) : null),
    [site.trackRecord, language]
  );

  return { content: PUBLIC_CONTENT, text, media: sectionMedia, models, faqs, trackRecord, loading: false };
}

import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedContentValue, getLocalizedModel, getLocalizedFaq, getLocalizedTrackRecord } from '../../i18n/bilingualContent';

export default function usePublicData() {
  const { language } = useLanguage();
  const [content, setContent] = useState({});
  const [media, setMediaState] = useState({});
  const [modelsRaw, setModels] = useState([]);
  const [faqsRaw, setFaqs] = useState([]);
  const [trackRecordRaw, setTrackRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/content'),
      api.get('/media'),
      api.get('/models'),
      api.get('/faq'),
      api.get('/track-record'),
    ])
      .then(([contentRes, mediaRes, modelsRes, faqRes, trackRes]) => {
        setContent(contentRes.data.content);
        setMediaState(mediaRes.data.media);
        setModels(modelsRes.data.models);
        setFaqs(faqRes.data.faqs);
        setTrackRecord(trackRes.data.trackRecord);
      })
      .finally(() => setLoading(false));
  }, []);

  // Cada texto CMS trae { value, valueEn }; se muestra solo el que corresponde
  // al idioma activo (nunca ambos a la vez).
  const text = (section, key, fallback = '') => getLocalizedContentValue(content?.[section]?.[key], language, fallback);

  // Multimedia publicada asignada a una sección — array vacío si el admin
  // no configuró nada (nunca se inserta contenido automáticamente).
  const sectionMedia = (location) => media?.[location] || [];

  const models = useMemo(() => modelsRaw.map((m) => getLocalizedModel(m, language)), [modelsRaw, language]);
  const faqs = useMemo(() => faqsRaw.map((f) => getLocalizedFaq(f, language)), [faqsRaw, language]);
  const trackRecord = useMemo(() => getLocalizedTrackRecord(trackRecordRaw, language), [trackRecordRaw, language]);

  return { content, text, media: sectionMedia, models, faqs, trackRecord, loading };
}

import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { pickBilingual } from '../../i18n/bilingualContent';

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
  const text = (section, key, fallback = '') => {
    const entry = content?.[section]?.[key];
    if (!entry) return fallback;
    return pickBilingual(entry.value, entry.valueEn, language) ?? fallback;
  };

  // Multimedia publicada asignada a una sección — array vacío si el admin
  // no configuró nada (nunca se inserta contenido automáticamente).
  const sectionMedia = (location) => media?.[location] || [];

  // Modelos/FAQ/TrackRecord: se resuelven los campos de texto bilingües al
  // idioma activo; los campos numéricos/ratios (percentage, objective,
  // platformName, profileLink, ranking) nunca se duplicaron y se exponen tal cual.
  const models = useMemo(
    () =>
      modelsRaw.map((m) => ({
        ...m,
        name: pickBilingual(m.name, m.nameEn, language),
        tagline: pickBilingual(m.tagline, m.taglineEn, language),
        description: pickBilingual(m.description, m.descriptionEn, language),
        conditions: pickBilingual(m.conditions, m.conditionsEn, language),
        period: pickBilingual(m.period, m.periodEn, language),
      })),
    [modelsRaw, language]
  );

  const faqs = useMemo(
    () =>
      faqsRaw.map((f) => ({
        ...f,
        question: pickBilingual(f.question, f.questionEn, language),
        answer: pickBilingual(f.answer, f.answerEn, language),
      })),
    [faqsRaw, language]
  );

  const trackRecord = useMemo(() => {
    if (!trackRecordRaw) return null;
    return {
      ...trackRecordRaw,
      title: pickBilingual(trackRecordRaw.title, trackRecordRaw.titleEn, language),
      description: pickBilingual(trackRecordRaw.description, trackRecordRaw.descriptionEn, language),
    };
  }, [trackRecordRaw, language]);

  return { content, text, media: sectionMedia, models, faqs, trackRecord, loading };
}

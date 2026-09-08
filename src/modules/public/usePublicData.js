import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function usePublicData() {
  const [content, setContent] = useState({});
  const [media, setMediaState] = useState({});
  const [models, setModels] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [trackRecord, setTrackRecord] = useState(null);
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

  const text = (section, key, fallback = '') => content?.[section]?.[key] ?? fallback;

  // Multimedia publicada asignada a una sección — array vacío si el admin
  // no configuró nada (nunca se inserta contenido automáticamente).
  const sectionMedia = (location) => media?.[location] || [];

  return { content, text, media: sectionMedia, models, faqs, trackRecord, loading };
}

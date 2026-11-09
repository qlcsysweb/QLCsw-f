import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { PUBLIC_SECTIONS } from './publicContent.js';

const OFFERS_KEY = 'edu_public_offers';
const OFFERS_TTL = 6 * 60 * 60 * 1000;

function readOffers() {
  try {
    const cached = JSON.parse(localStorage.getItem(OFFERS_KEY) || 'null');
    return cached?.offers ? cached : null;
  } catch {
    return null;
  }
}

function writeOffers(offers) {
  try {
    localStorage.setItem(OFFERS_KEY, JSON.stringify({ at: Date.now(), offers }));
  } catch {
    return undefined;
  }
  return undefined;
}

export function usePublicOffers() {
  const [offers, setOffers] = useState(() => readOffers()?.offers || []);

  useEffect(() => {
    const cached = readOffers();
    if (cached && Date.now() - cached.at < OFFERS_TTL) return undefined;
    let alive = true;
    api.get('/public/offers')
      .then((data) => {
        if (!alive || !Array.isArray(data?.offers)) return;
        writeOffers(data.offers);
        setOffers(data.offers);
      })
      .catch(() => null);
    return () => { alive = false; };
  }, []);

  return offers;
}

export function usePublicContent() {
  const offers = usePublicOffers();
  const { lang } = useI18n();
  return { sections: PUBLIC_SECTIONS[lang] || PUBLIC_SECTIONS.es, offers };
}

import { useEffect, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedContentValue } from '../i18n/bilingualContent';

/*
 * AVISO DE PRIVACIDAD y TÉRMINOS Y CONDICIONES — editables por el ADMIN desde
 * el CMS (sección "legal" de PublicContent: <doc>_title / <doc>_body, en
 * español e inglés). Un solo texto por documento, usado en TODOS los lugares:
 * páginas públicas /privacidad y /terminos y las pantallas de aceptación del
 * registro. Mientras el admin no lo edite, se usa el texto oficial que QLC
 * entregó (translations.js → registerLegal.*FullText).
 *
 * Formato del cuerpo: texto plano; una línea en blanco separa párrafos.
 */
export const LEGAL_SECTION = 'legal';

export const LEGAL_DOCS = {
  privacy: {
    titleKey: 'privacy_title',
    bodyKey: 'privacy_body',
    fallbackTitle: 'registerLegal.privacyTitle',
    fallbackBody: 'registerLegal.privacyFullText',
  },
  terms: {
    titleKey: 'terms_title',
    bodyKey: 'terms_body',
    fallbackTitle: 'registerLegal.termsTitle',
    fallbackBody: 'registerLegal.termsFullText',
  },
};

export function legalFallbackTitle(t, doc) {
  return t(LEGAL_DOCS[doc].fallbackTitle);
}

export function legalFallbackBody(t, doc) {
  const paragraphs = t(LEGAL_DOCS[doc].fallbackBody);
  return Array.isArray(paragraphs) ? paragraphs.join('\n\n') : '';
}

export function splitLegalParagraphs(body) {
  return String(body || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Párrafos del documento (los saltos de línea simples se respetan).
export function LegalText({ body }) {
  return splitLegalParagraphs(body).map((p, i) => (
    <p key={i} style={{ whiteSpace: 'pre-line' }}>
      {p}
    </p>
  ));
}

// Título + cuerpo vigentes de un documento, a partir de una función `text`
// del CMS (usePublicData o la vista previa del editor).
export function resolveLegalDoc(text, t, doc) {
  const d = LEGAL_DOCS[doc];
  return {
    title: text(LEGAL_SECTION, d.titleKey, legalFallbackTitle(t, doc)) || legalFallbackTitle(t, doc),
    body: text(LEGAL_SECTION, d.bodyKey, legalFallbackBody(t, doc)) || legalFallbackBody(t, doc),
  };
}

// Para pantallas fuera de la web pública (modales del registro): lee el
// contenido una vez; mientras carga (o si falla) muestra el texto oficial.
export function useLegalDoc(doc) {
  const { t, language } = useLanguage();
  const [legal, setLegal] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api
      .get('/content')
      .then(({ data }) => {
        if (!cancelled) setLegal(data.content?.[LEGAL_SECTION] || {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const text = (section, key, fallback) => getLocalizedContentValue(legal?.[key], language, fallback);
  return resolveLegalDoc(text, t, doc);
}

// Página pública completa de un documento legal (también la usa la vista
// previa del editor del CMS).
export function LegalDocumentView({ text, t, doc }) {
  const { title, body } = resolveLegalDoc(text, t, doc);
  return (
    <section className="section">
      <div className="container legal-content">
        <div className="kicker">LEGAL</div>
        <h2>{title}</h2>
        <LegalText body={body} />
      </div>
    </section>
  );
}

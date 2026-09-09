// Resuelve un campo bilingüe administrable desde el CMS: "es" es el valor
// base (español, siempre presente) y "en" es la traducción opcional.
// Si el idioma activo es inglés pero la traducción todavía no existe, se
// usa el español como respaldo (nunca se deja el campo vacío en público).
export function pickBilingual(es, en, language) {
  if (language === 'en' && en) return en;
  return es;
}

// true si el campo bilingüe tiene texto en español pero aún no tiene
// traducción al inglés — usado solo en el Admin para marcar "Pendiente de traducción".
export function isTranslationPending(es, en) {
  return !!(es && es.trim()) && !(en && en.trim());
}

/*
 * Helpers centralizados de localización — evitan repetir
 * `language === 'es' ? x.campo : x.campoEn` en cada componente. Cada uno
 * recibe la entidad cruda (tal como la devuelve la API, con ambos idiomas)
 * y devuelve una copia con los campos de texto ya resueltos al idioma
 * activo. Los campos numéricos/códigos/nombres propios (percentage,
 * objective, platformName, profileLink, ranking, key, id, etc.) se
 * conservan sin cambios porque nunca se duplican en NeonDB.
 */

// PublicContent: entry = { value, valueEn } (una fila de `text(section,key)`).
export function getLocalizedContentValue(entry, language, fallback = '') {
  if (!entry) return fallback;
  return pickBilingual(entry.value, entry.valueEn, language) ?? fallback;
}

export function getLocalizedModel(model, language) {
  if (!model) return model;
  return {
    ...model,
    name: pickBilingual(model.name, model.nameEn, language),
    tagline: pickBilingual(model.tagline, model.taglineEn, language),
    description: pickBilingual(model.description, model.descriptionEn, language),
    conditions: pickBilingual(model.conditions, model.conditionsEn, language),
    period: pickBilingual(model.period, model.periodEn, language),
  };
}

export function getLocalizedFaq(faq, language) {
  if (!faq) return faq;
  return {
    ...faq,
    question: pickBilingual(faq.question, faq.questionEn, language),
    answer: pickBilingual(faq.answer, faq.answerEn, language),
  };
}

export function getLocalizedTrackRecord(trackRecord, language) {
  if (!trackRecord) return trackRecord;
  return {
    ...trackRecord,
    title: pickBilingual(trackRecord.title, trackRecord.titleEn, language),
    description: pickBilingual(trackRecord.description, trackRecord.descriptionEn, language),
  };
}

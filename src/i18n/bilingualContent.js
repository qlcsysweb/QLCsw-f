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

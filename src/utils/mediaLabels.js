// Ubicaciones válidas para multimedia del sitio público — debe reflejar
// exactamente el enum del backend (mediaController.js LOCATIONS). Los
// nombres se traducen según el idioma personal de quien esté viendo el panel.
const LOCATION_VALUES = [
  'logo',
  'hero',
  'modelo',
  'como_funciona',
  'tecnologia',
  'microposiciones',
  'modelos',
  'resultados',
  'seguridad',
  'sobre_qlc',
  'faq',
  'contacto',
  'footer',
];

export function getMediaLocations(t) {
  return LOCATION_VALUES.map((value) => ({ value, label: t(`mediaLocations.${value}`) }));
}

export function locationLabel(t, value) {
  return t(`mediaLocations.${value}`, value);
}

export function mediaTypeLabel(t, type) {
  return type === 'VIDEO' ? t('mediaType.video') : t('mediaType.image');
}

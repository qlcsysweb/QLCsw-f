// Ubicaciones válidas para multimedia del sitio público — debe reflejar
// exactamente el enum del backend (mediaController.js LOCATIONS).
export const MEDIA_LOCATIONS = [
  { value: 'logo', label: 'Logo (marca QLC)' },
  { value: 'hero', label: 'Hero' },
  { value: 'modelo', label: 'Modelo' },
  { value: 'como_funciona', label: 'Cómo funciona' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'microposiciones', label: 'Microposiciones' },
  { value: 'modelos', label: 'Modelos' },
  { value: 'resultados', label: 'Resultados / Track Record' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'sobre_qlc', label: 'Sobre QLC' },
  { value: 'faq', label: 'FAQ' },
  { value: 'contacto', label: 'Contacto' },
  { value: 'footer', label: 'Footer' },
];

export function locationLabel(value) {
  return MEDIA_LOCATIONS.find((l) => l.value === value)?.label || value;
}

export function mediaTypeLabel(type) {
  return type === 'VIDEO' ? 'Video' : 'Imagen';
}

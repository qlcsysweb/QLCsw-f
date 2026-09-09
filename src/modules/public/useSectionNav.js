import { useNavigate } from 'react-router-dom';

// Secciones públicas: id = ancla real en el DOM (PublicHomePage nunca cambia,
// todas las secciones siguen siempre montadas); path = ruta limpia que las
// expone individualmente vía React Router (ver App.jsx) sin duplicar contenido
// ni volver a depender de hashes (#) en ningún enlace interno del sitio.
export const SECTIONS = [
  { id: 'modelo', path: '/modelo', labelKey: 'nav.modelo' },
  { id: 'como-funciona', path: '/como-funciona', labelKey: 'nav.comoFunciona' },
  { id: 'tecnologia', path: '/tecnologia', labelKey: 'nav.tecnologia' },
  { id: 'microposiciones', path: '/microposiciones', labelKey: 'nav.microposiciones' },
  { id: 'modelos', path: '/modelos', labelKey: 'nav.modelos' },
  { id: 'resultados', path: '/resultados', labelKey: 'nav.resultados' },
  { id: 'seguridad', path: '/seguridad', labelKey: 'nav.seguridad' },
  { id: 'sobre-qlc', path: '/sobre-qlc', labelKey: 'nav.sobreQlc' },
  { id: 'faq', path: '/faq', labelKey: 'nav.faq' },
];

export const PATH_TO_ID = SECTIONS.reduce((acc, s) => ({ ...acc, [s.path]: s.id }), {});

// Navega a la ruta limpia de una sección y desplaza suavemente hasta ella —
// reemplaza cualquier <a href="#seccion">. PublicHomePage siempre tiene las
// 9 secciones montadas, así que nunca ocurre una recarga real de página.
export default function useSectionNav() {
  const navigate = useNavigate();
  return (path, id) => (e) => {
    e.preventDefault();
    navigate(path);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

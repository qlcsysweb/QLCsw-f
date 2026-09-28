import { useNavigate } from 'react-router-dom';

// Secciones públicas: id = identificador de la vista; path = ruta limpia que
// la expone individualmente vía React Router (ver App.jsx). La página pública
// ya NO es una página larga: PublicHomePage monta SOLO la sección activa y la
// cambia con un fundido (fade out → cambio → fade in), sin desplazar nada.
export const SECTIONS = [
  { id: 'modelo', path: '/modelo', labelKey: 'nav.modelo' },
  { id: 'como-funciona', path: '/como-funciona', labelKey: 'nav.comoFunciona' },
  { id: 'tecnologia', path: '/tecnologia', labelKey: 'nav.tecnologia' },
  { id: 'microposiciones', path: '/microposiciones', labelKey: 'nav.microposiciones' },
  { id: 'el-problema', path: '/el-problema', labelKey: 'nav.elProblema' },
  { id: 'modelos', path: '/modelos', labelKey: 'nav.modelos' },
  { id: 'resultados', path: '/resultados', labelKey: 'nav.resultados' },
  { id: 'seguridad', path: '/seguridad', labelKey: 'nav.seguridad' },
  { id: 'sobre-qlc', path: '/sobre-qlc', labelKey: 'nav.sobreQlc' },
  { id: 'faq', path: '/faq', labelKey: 'nav.faq' },
];

// Vistas adicionales que no son un enlace del navbar pero sí pantallas propias.
export const HOME_ID = 'inicio';
export const CONTACT_ID = 'contacto';
export const CONTACT_PATH = '/contacto';

export const PATH_TO_ID = SECTIONS.reduce((acc, s) => ({ ...acc, [s.path]: s.id }), {
  '/': HOME_ID,
  [CONTACT_PATH]: CONTACT_ID,
});

const VIEW_IDS = new Set(Object.values(PATH_TO_ID));
// Anclas antiguas (#registro-form, #inicio-hero) que apuntan a una vista.
const HASH_ALIASES = { 'registro-form': CONTACT_ID, 'inicio-hero': HOME_ID };

// Resuelve qué vista mostrar a partir de la URL. Se aceptan rutas limpias
// (/faq) y también enlaces directos con hash (/#faq) — el hash solo elige la
// vista, nunca provoca un desplazamiento por el documento.
export function resolveViewId(pathname, hash = '') {
  const fromHash = decodeURIComponent(hash.replace(/^#/, ''));
  if (fromHash && (pathname === '/' || !PATH_TO_ID[pathname])) {
    if (VIEW_IDS.has(fromHash)) return fromHash;
    if (HASH_ALIASES[fromHash]) return HASH_ALIASES[fromHash];
  }
  return PATH_TO_ID[pathname] || HOME_ID;
}

// Cambia de vista navegando a su ruta limpia (el historial del navegador
// conserva atrás/adelante). Sin scroll: PublicHomePage hace el fundido.
export default function useSectionNav() {
  const navigate = useNavigate();
  return (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };
}

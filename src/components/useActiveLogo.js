import { useLanguage } from '../i18n/LanguageContext';
import { useSiteData } from '../content/siteData';

// Logo activo configurado desde Admin → Contenido del sitio → Multimedia,
// POR IDIOMA: "Logo — Español" y "Logo — Inglés", cada uno con imagen y/o
// video. Se usa el del idioma activo (video si hay; si no, la imagen); si
// el inglés no tiene ninguno, se usa el español. Sin nada configurado, el
// consumidor usa su PNG estático por defecto.
// Viene de site-data.json en el CDN de Cloudinary — ya no consulta el backend.
export default function useActiveLogo() {
  const { language } = useLanguage();
  const site = useSiteData();
  const pick = (slot) => (slot ? slot.video || slot.image || null : null);
  const asset = (language === 'en' ? pick(site.logos?.en) : null) || pick(site.logos?.es);
  return { asset, loaded: true };
}

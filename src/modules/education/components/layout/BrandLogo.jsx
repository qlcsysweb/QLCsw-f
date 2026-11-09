import { useI18n } from '../../i18n/I18nContext.jsx';

export const LOGOS = {
  es: '/brand/qlc-logo-es.mp4',
  en: '/brand/qlc-logo-en.mp4',
};

export function BrandLogo({ alt = '', className = '', width, height }) {
  const { lang } = useI18n();
  const src = LOGOS[lang] || LOGOS.es;
  return (
    <video
      key={src}
      className={`brand-logo ${className}`}
      src={src}
      width={width}
      height={height}
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      preload="auto"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    />
  );
}

import useActiveLogo from './useActiveLogo';
import defaultLogo from '../assets/images/qlc-logo.png';

/*
 * Logo de QLC en cualquier punto de la plataforma (Hero, Login, barra de
 * navegación pública, sidebar de Admin/Cliente). Si el administrador
 * configuró un VIDEO como logo activo (Admin → Multimedia), se reproduce
 * ese video exactamente como un GIF: autoplay, muted, loop, sin controles,
 * sin interacción. Si configuró una IMAGEN, se usa esa imagen. Si no hay
 * nada configurado, se usa el PNG estático original — comportamiento
 * idéntico al actual, sin ningún cambio visual.
 *
 * Siempre se envuelve en el mismo contenedor (.qlc-logo-box) para que el
 * CSS de cada punto de uso (tamaño/posición) no tenga que distinguir entre
 * <img> y <video>. `animated` activa el barrido sutil ya existente
 * (.qlc-logo-anim) sobre el logo estático — se omite en los usos pequeños
 * de navegación para no saturar de movimiento la interfaz.
 */
export default function QlcLogo({ className = '', animated = false, alt = 'Quantum Liquidity Capital' }) {
  const { asset, loaded } = useActiveLogo();
  const isVideo = loaded && asset?.type === 'VIDEO';
  const src = isVideo || (loaded && asset?.type === 'IMAGE') ? asset.url : defaultLogo;

  const wrapperClass = [className, 'qlc-logo-box', animated && !isVideo ? 'qlc-logo-anim' : '']
    .filter(Boolean)
    .join(' ');
  const style = animated && !isVideo ? { '--logo-src': `url(${src})` } : undefined;

  return (
    <div className={wrapperClass} style={style}>
      {isVideo ? (
        <video
          className="qlc-logo-media"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controls={false}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={alt}
        />
      ) : (
        <img className="qlc-logo-media" src={src} alt={alt} />
      )}
    </div>
  );
}

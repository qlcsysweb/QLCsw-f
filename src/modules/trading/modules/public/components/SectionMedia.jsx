/*
 * Renderiza la multimedia (imágenes/video) que el administrador publicó y
 * asignó a una sección concreta (Admin → Contenido del sitio → Multimedia).
 * Si no hay nada asignado, no renderiza nada — nunca se inserta contenido
 * automáticamente. Los videos decorativos se comportan como una animación
 * integrada: autoplay, muted, loop, playsInline, sin controles.
 */
export default function SectionMedia({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`qlc-section-media ${className}`}>
      {items.map((item) =>
        item.type === 'VIDEO' ? (
          <video
            key={item.id}
            className="qlc-section-media-item"
            src={item.url}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            controls={false}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={item.title || 'Video QLC'}
          />
        ) : (
          <img
            key={item.id}
            className="qlc-section-media-item"
            src={item.url}
            alt={item.title || 'QLC'}
          />
        )
      )}
    </div>
  );
}

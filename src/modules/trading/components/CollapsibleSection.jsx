import { useId, useState } from 'react';

// Sección/tabla que puede minimizarse sin perder información: al cerrarse
// deja visible el título y un resumen corto (`summary`), nunca oculta datos
// por completo. Pensado para bloques largos que tienen más contenido debajo
// — no usarlo cuando una pantalla es una sola tabla sin nada más alrededor.
export default function CollapsibleSection({
  title,
  summary = null,
  defaultOpen = true,
  badge = null,
  children,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={`qlc-collapsible ${className}`}>
      <div className="qlc-collapsible-header">
        <button
          type="button"
          className="qlc-collapsible-toggle"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`qlc-collapsible-chevron${open ? ' open' : ''}`} aria-hidden="true">
            ▾
          </span>
          <span className="qlc-collapsible-title">{title}</span>
        </button>
        {badge && <span className="qlc-collapsible-badge">{badge}</span>}
      </div>

      {!open && summary && <div className="qlc-collapsible-summary">{summary}</div>}

      <div id={contentId} className={`qlc-collapsible-body${open ? ' open' : ''}`}>
        <div className="qlc-collapsible-body-inner">{children}</div>
      </div>
    </div>
  );
}

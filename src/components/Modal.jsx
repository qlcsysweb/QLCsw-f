import { useEffect } from 'react';
import './Modal.css';

// `closeOnOverlayClick`/`closeOnEscape` son opcionales (por defecto false)
// para no cambiar el comportamiento de los modales existentes (varios son
// formularios donde cerrar sin querer perdería lo que el admin escribió) —
// el visor de documentos (DocumentViewerModal) es el primero en activarlos.
export default function Modal({ title, subtitle, onClose, children, width = 560, closeOnOverlayClick = false, closeOnEscape = false }) {
  useEffect(() => {
    if (!closeOnEscape) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeOnEscape, onClose]);

  return (
    <div className="qlc-modal-overlay" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div
        className="qlc-modal-panel"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="qlc-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="qlc-modal-subtitle">{subtitle}</p>}
          </div>
          <button className="qlc-modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="qlc-modal-body">{children}</div>
      </div>
    </div>
  );
}

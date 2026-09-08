import './Modal.css';

export default function Modal({ title, subtitle, onClose, children, width = 560 }) {
  return (
    <div className="qlc-modal-overlay" onClick={onClose}>
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

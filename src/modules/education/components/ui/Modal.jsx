import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { tr } from '../../i18n/tr.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useFocusTrap(open, ref, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const node = ref.current;
    (node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE) || node)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current?.();
      }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const [first, last] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      previous?.focus?.();
    };
  }, [open, ref]);
}

export function Modal({ open, title, onClose, children, footer, wide, className = '' }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const titleId = useId();
  useFocusTrap(open, ref, onClose);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={`modal ${wide ? 'modal-wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="modal-head">
          <h3 id={titleId}>{tr(title)}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('app.close')}>×</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, title, message, details, confirmLabel, danger, loading, onConfirm, onClose, children }) {
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      title={title || t('app.confirm.title')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('app.confirm.cancel')}</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{tr(confirmLabel) || t('app.confirm.confirm')}</Button>
        </>
      }
    >
      <p className="muted">{tr(message)}</p>
      {details?.length > 0 && (
        <table className="diff-table">
          <thead><tr><th>{t('app.confirm.field')}</th><th>{t('app.confirm.before')}</th><th>{t('app.confirm.after')}</th></tr></thead>
          <tbody>
            {details.map((d) => (
              <tr key={d.field}><td>{tr(d.field)}</td><td>{d.from}</td><td><b>{d.to}</b></td></tr>
            ))}
          </tbody>
        </table>
      )}
      {children}
    </Modal>
  );
}

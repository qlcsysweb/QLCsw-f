import { useState } from 'react';
import Modal from './Modal';

/*
 * Modal de confirmación para acciones destructivas o irreversibles
 * (eliminar, rechazar, desactivar, desconectar). Nunca ejecutar estas
 * acciones con un solo click accidental.
 *
 * Con twoStep=true exige DOS pasos independientes antes de ejecutar:
 * 1) "¿Seguro que deseas...?" → Cancelar / Continuar
 * 2) "Confirmación final — esta acción no se puede deshacer" → Volver / Eliminar definitivamente
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  twoStep = false,
  onConfirm,
  onClose,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (twoStep && step === 1) {
    return (
      <Modal title={title} onClose={onClose} width={440}>
        <p style={{ color: 'var(--qlc-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>{message}</p>
        <div className="qlc-form-actions">
          <button className="qlc-btn ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button className="qlc-btn ghost" onClick={() => setStep(2)}>
            Continuar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={twoStep ? 'Confirmación final' : title} onClose={onClose} width={440}>
      {twoStep && (
        <p style={{ color: 'var(--qlc-gold)', fontSize: 13, fontWeight: 600, marginTop: 0 }}>
          Esta acción no se puede deshacer.
        </p>
      )}
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
        {twoStep ? `¿Deseas ${confirmLabel.toLowerCase()} definitivamente este elemento?` : message}
      </p>
      {error && <div className="qlc-field-error">{error}</div>}
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={twoStep ? () => setStep(1) : onClose} disabled={loading}>
          {twoStep ? 'Volver' : cancelLabel}
        </button>
        <button className={`qlc-btn ${danger ? 'danger' : 'primary'}`} onClick={handleConfirm} disabled={loading}>
          {loading ? 'Procesando…' : twoStep ? `${confirmLabel} definitivamente` : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

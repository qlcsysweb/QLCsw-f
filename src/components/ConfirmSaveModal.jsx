import { useState } from 'react';
import Modal from './Modal';

export default function ConfirmSaveModal({ onCancel, onConfirm, message = 'Se actualizará esta información en el sistema.' }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="¿Guardar cambios?" onClose={onCancel} width={420}>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, marginTop: 0 }}>{message}</p>
      {error && <div className="qlc-field-error">{error}</div>}
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button className="qlc-btn primary" onClick={confirm} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}

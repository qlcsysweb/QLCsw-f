import { useState } from 'react';
import Modal from './Modal';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';

export default function ConfirmSaveModal({ onCancel, onConfirm, message }) {
  const { t, language } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resolvedMessage = message || t('modals.saveChangesDefault');

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setSaving(false);
    }
  };

  return (
    <Modal title={t('modals.saveChangesTitle')} onClose={onCancel} width={420}>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, marginTop: 0 }}>{resolvedMessage}</p>
      {error && <div className="qlc-field-error">{error}</div>}
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={onCancel} disabled={saving}>
          {t('modals.cancel')}
        </button>
        <button className="qlc-btn primary" onClick={confirm} disabled={saving}>
          {saving ? t('modals.saving') : t('modals.saveChanges')}
        </button>
      </div>
    </Modal>
  );
}

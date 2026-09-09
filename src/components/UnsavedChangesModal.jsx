import Modal from './Modal';
import { useLanguage } from '../i18n/LanguageContext';

export default function UnsavedChangesModal({ onKeepEditing, onDiscard }) {
  const { t } = useLanguage();
  return (
    <Modal title={t('modals.unsavedTitle')} onClose={onKeepEditing} width={420}>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, marginTop: 0 }}>{t('modals.unsavedMessage')}</p>
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={onDiscard}>
          {t('modals.discard')}
        </button>
        <button className="qlc-btn primary" onClick={onKeepEditing}>
          {t('modals.keepEditing')}
        </button>
      </div>
    </Modal>
  );
}

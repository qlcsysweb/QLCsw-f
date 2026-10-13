import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import Modal from './Modal';

export const ACCOUNT_NOTICE_KEY = 'qlc_account_notice';

// Aviso que se muestra UNA vez en la página pública después de que el cliente
// solicita eliminar su cuenta (ver AccountDeletionSection). No afirma que los
// datos ya se borraron: solo que la solicitud quedó registrada.
export default function AccountNotice() {
  const { t } = useLanguage();
  const [notice, setNotice] = useState(() => {
    try {
      const value = sessionStorage.getItem(ACCOUNT_NOTICE_KEY);
      if (value) sessionStorage.removeItem(ACCOUNT_NOTICE_KEY);
      return value;
    } catch {
      return null;
    }
  });

  if (notice !== 'deletion-requested') return null;
  return (
    <Modal title={t('accountDeletion.doneTitle')} onClose={() => setNotice(null)} width={480} closeOnEscape>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>{t('accountDeletion.doneMessage')}</p>
      <div className="qlc-form-actions">
        <button type="button" className="qlc-btn primary" onClick={() => setNotice(null)}>
          {t('accountDeletion.doneOk')}
        </button>
      </div>
    </Modal>
  );
}

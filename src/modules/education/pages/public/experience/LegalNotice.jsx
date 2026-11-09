import { Modal } from '../../../components/ui/Modal.jsx';
import { LegalLinks } from '../legal/LegalPage.jsx';
import { useI18n } from '../../../i18n/I18nContext.jsx';

export function LegalNotice({ open, onClose }) {
  const { t } = useI18n();
  return (
    <Modal open={open} title={t('public.notice.title')} onClose={onClose}>
      <div className="stack legal-text">
        <p>{t('public.notice.p1')}</p>
        <p>{t('public.notice.p2')}</p>
        <p className="small"><LegalLinks /></p>
        <p className="small">{t('public.notice.copyright')}</p>
      </div>
    </Modal>
  );
}

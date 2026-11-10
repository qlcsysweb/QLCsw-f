import { tradingPublicUrl } from '../../../../../shared/config.js';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal.jsx';
import { useI18n } from '../../../i18n/I18nContext.jsx';

export const QLC_COPYTRADING_URL = import.meta.env.VITE_QLC_URL || tradingPublicUrl();

export function CopytradingFilter({ open, onClose }) {
  const { t } = useI18n();
  const [answer, setAnswer] = useState(null);
  const { pathname } = useLocation();
  const close = () => {
    setAnswer(null);
    onClose();
  };
  return (
    <Modal open={open} title={t('public.copy.title')} onClose={close}>
      {answer === null && (
        <div className="stack">
          <p>{t('public.copy.question')}</p>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setAnswer('no')}>{t('public.copy.no')}</button>
            <button type="button" className="btn-primary" onClick={() => setAnswer('yes')}>{t('public.copy.yes')}</button>
          </div>
        </div>
      )}
      {answer === 'yes' && (
        <div className="stack">
          <p>{t('public.copy.yesText')}</p>
          <p>{t('public.copy.yesNext')}</p>
          <div className="form-actions">
            {pathname !== '/trading-academy' && <Link className="btn-secondary" to="/trading-academy" onClick={close}>{t('public.copy.toTrading')}</Link>}
            <a className="btn-primary" href={QLC_COPYTRADING_URL} onClick={close}>{t('public.copy.toQlc')}</a>
          </div>
        </div>
      )}
      {answer === 'no' && (
        <div className="stack">
          <p>{t('public.copy.noText')}</p>
          <p><b>{t('public.copy.noStrong')}</b>{t('public.copy.noRest')}</p>
          <Link className="btn-primary" to="/registro" onClick={close}>{t('public.copy.toEducation')}</Link>
        </div>
      )}
    </Modal>
  );
}

export function CopytradingButton({ className = 'pbtn pbtn-primary', children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      <CopytradingFilter open={open} onClose={() => setOpen(false)} />
    </>
  );
}

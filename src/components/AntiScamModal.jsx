import { useLanguage } from '../i18n/LanguageContext';
import './AntiScamModal.css';

// CORRECCIÓN 1 — aviso de seguridad/antiestafa. Aparece en CADA visita a la
// página pública (nunca limitado por la selección diaria de idioma). No se
// cierra al hacer clic fuera — solo con el botón explícito.
export default function AntiScamModal({ onClose }) {
  const { t } = useLanguage();
  return (
    <div className="qlc-scam-overlay" role="dialog" aria-modal="true" aria-label={t('antiScam.title')}>
      <div className="qlc-scam-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qlc-scam-notice-kicker">{t('antiScam.noticeKicker')}</div>
        <div className="qlc-scam-notice-title">{t('antiScam.noticeTitle')}</div>
        <p className="qlc-scam-notice-body">{t('antiScam.noticeBody1')}</p>
        <p className="qlc-scam-notice-body">{t('antiScam.noticeBody2')}</p>
        <p className="qlc-scam-notice-body">{t('antiScam.noticeBody3')}</p>
        <p className="qlc-scam-notice-body">{t('antiScam.noticeBody4')}</p>

        <div className="qlc-scam-divider" />

        <div className="qlc-scam-title">{t('antiScam.title')}</div>
        <p className="qlc-scam-body">{t('antiScam.body1')}</p>
        <p className="qlc-scam-body">{t('antiScam.body2')}</p>
        <div className="qlc-scam-tagline">{t('antiScam.tagline')}</div>
        <div className="qlc-scam-brand">{t('antiScam.brand')}</div>
        <button type="button" className="btn primary qlc-scam-btn" onClick={onClose}>
          {t('antiScam.continue')}
        </button>
      </div>
    </div>
  );
}

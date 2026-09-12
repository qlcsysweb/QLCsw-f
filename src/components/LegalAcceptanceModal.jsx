import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './AntiScamModal.css';
import './LegalAcceptanceModal.css';

// El contrato ya no forma parte del registro: se sustituye por estas dos
// pantallas de aceptación electrónica (Aviso de Privacidad y Términos y
// Condiciones), mostradas justo antes de finalizar el registro. Reutilizan
// a propósito el mismo overlay/panel que AntiScamModal para que se sienta
// como parte de la misma experiencia de QLC — solo con casillas y un
// bloque de texto legal desplegable ("leer más") que AntiScamModal no
// necesitaba.
export function PrivacyNoticeModal({ onAccept }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState(false);
  const fullText = t('registerLegal.privacyFullText');

  return (
    <div className="qlc-scam-overlay" role="dialog" aria-modal="true" aria-label={t('registerLegal.privacyTitle')}>
      <div className="qlc-scam-panel qlc-legal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qlc-scam-title">{t('registerLegal.privacyTitle')}</div>
        <p className="qlc-scam-body">{t('registerLegal.privacyIntro')}</p>

        <button type="button" className="qlc-legal-readmore" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('registerLegal.readLess') : t('registerLegal.privacyReadMore')}
        </button>

        {expanded && (
          <div className="qlc-legal-fulltext">
            {Array.isArray(fullText) && fullText.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          </div>
        )}

        <div className="qlc-scam-divider" />

        <label className="qlc-legal-checkbox">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>{t('registerLegal.privacyCheckbox')}</span>
        </label>

        <button
          type="button"
          className="btn primary qlc-scam-btn"
          disabled={!checked}
          onClick={() => onAccept()}
        >
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
}

export function TermsAndConditionsModal({ onAccept, onBack, loading }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [apiChecked, setApiChecked] = useState(false);
  const fullText = t('registerLegal.termsFullText');
  const canContinue = termsChecked && apiChecked;

  return (
    <div className="qlc-scam-overlay" role="dialog" aria-modal="true" aria-label={t('registerLegal.termsTitle')}>
      <div className="qlc-scam-panel qlc-legal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qlc-scam-title">{t('registerLegal.termsTitle')}</div>
        <p className="qlc-scam-body">{t('registerLegal.termsIntro')}</p>

        <button type="button" className="qlc-legal-readmore" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('registerLegal.readLess') : t('registerLegal.termsReadMore')}
        </button>

        {expanded && (
          <div className="qlc-legal-fulltext">
            {Array.isArray(fullText) && fullText.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          </div>
        )}

        <div className="qlc-scam-divider" />

        <label className="qlc-legal-checkbox">
          <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} />
          <span>{t('registerLegal.termsCheckbox')}</span>
        </label>
        <label className="qlc-legal-checkbox">
          <input type="checkbox" checked={apiChecked} onChange={(e) => setApiChecked(e.target.checked)} />
          <span>{t('registerLegal.apiCheckbox')}</span>
        </label>

        <button
          type="button"
          className="btn primary qlc-scam-btn"
          disabled={!canContinue || loading}
          onClick={() => onAccept()}
        >
          {loading ? t('common.processing') : t('registerLegal.termsAcceptButton')}
        </button>

        <button
          type="button"
          className="qlc-legal-readmore"
          style={{ display: 'block', marginTop: 14, marginBottom: 0, textAlign: 'center', width: '100%' }}
          onClick={onBack}
          disabled={loading}
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}

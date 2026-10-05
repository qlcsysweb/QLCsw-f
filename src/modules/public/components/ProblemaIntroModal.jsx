import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QlcLogo from '../../../components/QlcLogo';
import useFitToViewport from '../../../hooks/useFitToViewport';
import { useLanguage } from '../../../i18n/LanguageContext';

/*
 * ANUNCIO DE ENTRADA A "EL PROBLEMA": "QLC: un aliado estratégico para tu
 * cartera de inversión". Se muestra al entrar a la sección, antes de su
 * contenido (igual que la ventana de Tecnología). Se cierra con el botón, la
 * ✕, clic fuera o Esc, y siempre cabe completo en pantalla, sin scroll.
 */
export default function ProblemaIntroModal({ onClose }) {
  const { t } = useLanguage();
  const panelRef = useRef(null);

  useFitToViewport(panelRef);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="qlc-public qlc-ally-overlay" role="dialog" aria-modal="true" aria-label={t('problemaIntro.title')} onClick={onClose}>
      <div className="qlc-ally" ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="qlc-tech-intro-x" aria-label={t('common.close')} onClick={onClose}>
          ✕
        </button>
        <div className="qlc-ally-brand">
          <QlcLogo className="qlc-ally-logo" alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <h2 className="qlc-ally-title">{t('problemaIntro.title')}</h2>
        <p className="qlc-ally-text">{t('problemaIntro.body')}</p>

        <div className="qlc-ally-range">
          <span>{t('problemaIntro.rangeLabel')}</span>
          <strong>100 – 2,000 USD</strong>
        </div>

        <p className="qlc-ally-text">
          {t('problemaIntro.limitA')} <strong>{t('problemaIntro.limitBold')}</strong>
          {t('problemaIntro.limitB')}
        </p>
        <p className="qlc-ally-philosophy">{t('problemaIntro.philosophy')}</p>
        <p className="qlc-ally-disclaimer">{t('problemaIntro.disclaimer')}</p>

        <button type="button" className="btn primary qlc-ally-cta" onClick={onClose}>
          {t('problemaIntro.cta')}
        </button>
      </div>
    </div>,
    document.body
  );
}

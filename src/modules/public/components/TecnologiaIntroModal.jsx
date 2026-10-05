import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QlcLogo from '../../../components/QlcLogo';
import useFitToViewport from '../../../hooks/useFitToViewport';
import { useLanguage } from '../../../i18n/LanguageContext';
import { ChartIcon, ServerIcon, ShieldIcon, DevicesIcon, BoltIcon, LockIcon, MicroIcon, StrategyIcon, AnalysisIcon, AlgorithmsIcon, ApiIcon } from './TechIcons';

/*
 * MODAL DE ENTRADA A "TECNOLOGÍA": "De los datos a las oportunidades."
 * Se muestra al entrar a la sección, antes de su contenido. Se cierra con el
 * botón, la ✕, clic fuera o Esc.
 */
// Textos idénticos a la infografía aprobada por el cliente.
export default function TecnologiaIntroModal({ onClose }) {
  const { t } = useLanguage();
  const panelRef = useRef(null);

  useFitToViewport(panelRef);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const flow = [
    { Icon: ChartIcon, lines: [t('techIntro.flowData'), t('techIntro.flowIndicators'), t('techIntro.flowInstitutional'), t('techIntro.flowNews')] },
    { badge: t('techIntro.flowAi'), main: true, lines: [t('techIntro.flowAiLabel')] },
    { Icon: ServerIcon, lines: [t('techIntro.flowAlgoLabel')] },
    { Icon: ShieldIcon, lines: ['API'] },
    { Icon: DevicesIcon, lines: ['Bitget'] },
  ];
  const cards = [
    { Icon: StrategyIcon, title: t('techIntro.c1Title'), text: t('techIntro.c1Text') },
    { Icon: AnalysisIcon, title: t('techIntro.c2Title'), text: t('techIntro.c2Text') },
    { Icon: AlgorithmsIcon, title: t('techIntro.c3Title'), text: t('techIntro.c3Text') },
    { Icon: ApiIcon, title: t('techIntro.c4Title'), text: t('techIntro.c4Text') },
    { Icon: MicroIcon, title: t('techIntro.c5Title'), text: t('techIntro.c5Text') },
  ];
  const features = [
    { Icon: ShieldIcon, title: t('techIntro.f1Title'), text: t('techIntro.f1Text') },
    { Icon: BoltIcon, title: t('techIntro.f2Title'), text: t('techIntro.f2Text') },
    { Icon: LockIcon, title: t('techIntro.f3Title'), text: t('techIntro.f3Text') },
    { Icon: MicroIcon, title: t('techIntro.f4Title'), text: t('techIntro.f4Text') },
  ];

  return createPortal(
    <div className="qlc-public qlc-tech-intro-overlay" role="dialog" aria-modal="true" aria-label={t('techIntro.titleA')} onClick={onClose}>
      <div className="qlc-tech-intro" ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="qlc-tech-intro-x" aria-label={t('common.close')} onClick={onClose}>
          ✕
        </button>
        <div className="qlc-tech-intro-brand">
          <QlcLogo className="qlc-tech-intro-logo" alt="QLC" />
          <div>
            <strong>QLC</strong>
            <span>QUANTUM LIQUIDITY CAPITAL</span>
          </div>
        </div>
        <h2 className="qlc-tech-intro-title">
          {t('techIntro.titleA')} <span>{t('techIntro.titleB')}</span>
        </h2>
        <p className="qlc-tech-intro-sub">{t('techIntro.sub')}</p>
        <div className="qlc-tech-intro-rule" />
        <p className="qlc-tech-intro-desc">{t('techIntro.desc')}</p>

        <div className="qlc-tech-intro-flow" aria-hidden="true">
          {flow.map(({ Icon, lines = [], badge, main }, i) => (
            <div className={`qlc-tech-flow-node${main ? ' is-main' : ''}`} key={i}>
              <div className="qlc-tech-flow-icon">{badge ? <b className="qlc-tech-flow-badge">{badge}</b> : <Icon />}</div>
              {lines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          ))}
        </div>

        <ol className="qlc-tech-intro-cards">
          {cards.map(({ Icon, title, text: body }, i) => (
            <li className={`qlc-tech-intro-card${i === 1 ? ' is-main' : ''}`} key={i}>
              <span className="qlc-tech-intro-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="qlc-tech-intro-card-icon">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>

        <div className="qlc-tech-intro-features">
          {features.map(({ Icon, title, text: body }, i) => (
            <div className="qlc-tech-intro-feature" key={i}>
              <div className="qlc-tech-intro-feature-icon">
                <Icon />
              </div>
              <div>
                <strong>{title}</strong>
                {body && <span>{body}</span>}
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn primary qlc-tech-intro-cta" onClick={onClose}>
          {t('techIntro.cta')}
        </button>
      </div>
    </div>,
    document.body
  );
}

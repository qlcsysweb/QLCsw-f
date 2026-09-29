import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SectionMedia from './SectionMedia';
import TrackRecordHighlights from './TrackRecordHighlights';
import { useLanguage } from '../../../i18n/LanguageContext';

// Resultados: referencia externa en Bitget. Ya no se habla de "track record":
// el visitante consulta directamente en Bitget el ROI de 30 días y la tasa de
// éxito del perfil (valores administrables, nunca inventados).
export default function ResultadosSection({ trackRecord, text, media = () => [] }) {
  const { t } = useLanguage();
  const platformName = trackRecord?.platformName || 'Bitget';
  const profileLink = trackRecord?.profileLink;
  const [showWarning, setShowWarning] = useState(false);

  return (
    <section className="section" id="resultados">
      <div className="container section-intro resultados-grid">
        <div className="connection-copy">
          <div className="kicker">{t('nav.resultados')}</div>
          <h3 style={{ color: 'white' }}>{trackRecord?.title || 'Una referencia externa y verificable.'}</h3>
          <p>
            {text(
              'resultados',
              'lead_1',
              `No te pedimos que confíes ciegamente en nosotros. Te damos acceso a una referencia externa para que puedas consultar directamente en ${platformName} los indicadores de rendimiento del perfil.`
            )}
          </p>
          <p>
            {text(
              'resultados',
              'lead_2',
              'Este perfil de trading está conectado mediante API a nuestra infraestructura tecnológica.'
            )}
          </p>
          <p>
            {trackRecord?.description ||
              `Los indicadores de rendimiento pueden consultarse directamente en ${platformName}, incluyendo el ROI de 30 días y la tasa de éxito. Son datos históricos de carácter informativo y no constituyen una garantía de resultados futuros.`}
          </p>

          {profileLink ? (
            // El enlace NO se abre directo: primero se muestra la advertencia
            // (la app oficial de Bitget es necesaria para ver el perfil).
            <a
              href={profileLink}
              target="_blank"
              rel="noreferrer"
              className="btn primary resultados-cta"
              onClick={(e) => {
                e.preventDefault();
                setShowWarning(true);
              }}
            >
              {t('resultadosSection.checkProfile')} {platformName} →
            </a>
          ) : (
            <span className="btn secondary resultados-cta" style={{ opacity: 0.6, cursor: 'default' }}>
              {t('resultadosSection.linkComingSoon')}
            </span>
          )}
        </div>

        <div className="hero-card resultados-card">
          <TrackRecordHighlights trackRecord={trackRecord} className="hero-mini-2x2" />
          <p className="note">{t('resultadosSection.indicatorsNote')}</p>
        </div>
      </div>

      <div className="container">
        <SectionMedia items={media('resultados')} />
      </div>

      {showWarning && profileLink && (
        <BitgetProfileWarning
          platformName={platformName}
          onCancel={() => setShowWarning(false)}
          onContinue={() => {
            setShowWarning(false);
            window.open(profileLink, '_blank', 'noopener,noreferrer');
          }}
        />
      )}
    </section>
  );
}

/*
 * Advertencia previa al perfil de Bitget: el perfil puede no abrir si el
 * visitante no tiene instalada la app oficial. Se muestra SOLO después de
 * pulsar "Consultar perfil en Bitget"; el enlace se abre únicamente con
 * "Continuar a Bitget". Portal a <body> para que ninguna animación de la
 * sección afecte su posición fija.
 */
function BitgetProfileWarning({ platformName, onCancel, onContinue }) {
  const { t } = useLanguage();
  const continueRef = useRef(null);
  useEffect(() => {
    continueRef.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return createPortal(
    <div className="qlc-warn-overlay" onClick={onCancel}>
      <div
        className="qlc-warn-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="qlc-warn-title"
        aria-describedby="qlc-warn-body"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qlc-warn-head">
          <span className="qlc-warn-icon" aria-hidden="true">⚠</span>
          <h2 id="qlc-warn-title">{t('resultadosSection.warningTitle')}</h2>
        </div>
        <div id="qlc-warn-body">
          <p>{t('resultadosSection.warningBody1').replaceAll('{platform}', platformName)}</p>
          <p>{t('resultadosSection.warningBody2').replaceAll('{platform}', platformName)}</p>
        </div>
        <div className="qlc-warn-actions">
          <button type="button" className="qlc-btn ghost" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button ref={continueRef} type="button" className="qlc-btn qlc-warn-continue" onClick={onContinue}>
            {t('resultadosSection.warningContinue').replace('{platform}', platformName)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

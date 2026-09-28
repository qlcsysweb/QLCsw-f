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
            <a href={profileLink} target="_blank" rel="noreferrer" className="btn primary resultados-cta">
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
    </section>
  );
}

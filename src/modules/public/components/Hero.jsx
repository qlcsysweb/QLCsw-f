import QlcLogo from '../../../components/QlcLogo';
import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function Hero({ text, media = () => [], trackRecord }) {
  const { t } = useLanguage();
  return (
    <section className="hero" id="inicio-hero">
      <div className="container hero-grid">
        <div>
          <div className="eyebrow">
            <span className="dot"></span> {text('hero', 'eyebrow', 'Institutional Copytrading Infrastructure')}
          </div>
          <h1>
            {text('hero', 'title_line1', 'Copytrading Institucional.')}
            <br />
            <span className="gradient">{text('hero', 'title_line2', 'Accesible desde 20 USDT.')}</span>
          </h1>
          <p className="lead">
            {text(
              'hero',
              'lead',
              'QLC es un sistema de copytrading institucional que ejecuta nuestra estrategia directamente en la cuenta del cliente mediante tecnología propia y una conexión API autorizada.'
            )}
          </p>
          <div className="actions">
            <a className="btn primary" href="#como-funciona">
              {t('hero.howItWorks')}
            </a>
            <a className="btn secondary" href="#modelos">
              {t('hero.seeModels')}
            </a>
          </div>
          <div className="trust">
            <span>{t('hero.trustCapital')}</span>
            <span>·</span>
            <span>{t('hero.trustAccount')}</span>
            <span>·</span>
            <span>{t('hero.trustStrategy')}</span>
          </div>
        </div>

        <div className="hero-card">
          <QlcLogo className="hero-logo" animated />
          <div className="hero-mini">
            <div className="mini">
              <b>{text('hero', 'mini_platform_label', 'BITGET')}</b>
              <span>{text('hero', 'mini_platform_value', 'Elite Trader')}</span>
            </div>
            <div className="mini">
              <b>{trackRecord?.ranking || '#XXX'}</b>
              <span>{t('hero.currentRanking')}</span>
            </div>
            <div className="mini">
              <b>{t('hero.trackRecord')}</b>
              <span>{t('hero.publicData')}</span>
            </div>
            <div className="mini">
              <b>API</b>
              <span>{t('hero.algoExecution')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <SectionMedia items={media('hero')} />
      </div>
    </section>
  );
}

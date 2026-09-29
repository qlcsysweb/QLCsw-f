import QlcLogo from '../../../components/QlcLogo';
import SectionMedia from './SectionMedia';
import TrackRecordHighlights from './TrackRecordHighlights';
import { useLanguage } from '../../../i18n/LanguageContext';
import useSectionNav from '../useSectionNav';

// "Accesible desde 100 USDT." (texto del CMS) → el monto va en su propia
// línea ("Accesible desde" / "100 USDT.") para que nunca quede partido de
// forma incómoda entre palabras. Si el texto no termina en un monto USDT se
// muestra tal cual.
function HeroAmountLine({ value }) {
  const match = String(value).match(/^(.*?)\s*(\d[\d.,]*\s*USDT\.?)\s*$/i);
  if (!match || !match[1]) return <span className="gradient">{value}</span>;
  return (
    <>
      <span className="gradient">{match[1]}</span>
      <br />
      <span className="gradient hero-amount">{match[2]}</span>
    </>
  );
}

export default function Hero({ text, media = () => [], trackRecord }) {
  const { t } = useLanguage();
  const goToSection = useSectionNav();
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
            <HeroAmountLine value={text('hero', 'title_line2', 'Accesible desde 100 USDT.')} />
          </h1>
          <p className="lead">
            {text(
              'hero',
              'lead',
              'QLC es un sistema de copytrading institucional que ejecuta nuestra estrategia directamente en la cuenta del cliente mediante tecnología propia y una conexión API autorizada.'
            )}
          </p>
          <div className="actions">
            <a className="btn primary" href="/como-funciona" onClick={goToSection('/como-funciona')}>
              {t('hero.howItWorks')}
            </a>
            <a className="btn secondary" href="/modelos" onClick={goToSection('/modelos')}>
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
          <TrackRecordHighlights trackRecord={trackRecord} text={text} />
        </div>
      </div>

      <div className="container">
        <SectionMedia items={media('hero')} />
      </div>
    </section>
  );
}

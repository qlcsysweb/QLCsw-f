import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function MicroposicionesSection({ text, media = () => [] }) {
  const { t } = useLanguage();
  return (
    <section className="section" id="microposiciones">
      <div className="container">
        <div className="kicker">{t('microposicionesSection.kicker')}</div>
        <h2>
          {t('microposicionesSection.titleLine1')}
          <br />
          <span className="gradient">{t('microposicionesSection.titleLine2')}</span>
        </h2>
        <div className="micro-hero">
          <div>
            <div className="kicker">{t('microposicionesSection.designedKicker')}</div>
            <h3>
              {t('microposicionesSection.subtitleLine1')}
              <br />
              {t('microposicionesSection.subtitleLine2')}
            </h3>
            <p>
              {text(
                'microposiciones',
                'lead',
                'QLC adapta una arquitectura de copytrading institucional a cuentas individuales mediante una metodología basada en microposiciones y ejecución sistemática.'
              )}
            </p>
          </div>
          <div className="range">{text('microposiciones', 'range', '20–400 USDT')}</div>
        </div>

        <SectionMedia items={media('microposiciones')} />
      </div>
    </section>
  );
}

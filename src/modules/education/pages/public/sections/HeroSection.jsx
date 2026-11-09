import { BrandLogo } from '../../../components/layout/BrandLogo.jsx';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { MoreInfo, SectionCtas, SectionHead } from './SectionParts.jsx';

export function HeroSection({ section, go }) {
  const { t } = useI18n();

  return (
    <div className="ps-container ps-hero">
      <div className="hero-copy">
        <SectionHead section={section} as="h1" />
        {section.secondaryText && (
          <div className="hero-note reveal" style={{ '--r': 3 }}>
            <span className="hero-note-text">{section.secondaryText}</span>
            <MoreInfo title={t('public.heroIdea')}>
              <p className="muted">{section.secondaryText}</p>
            </MoreInfo>
          </div>
        )}
        <SectionCtas section={section} go={go} />
      </div>
      <div className="hero-visual reveal-visual">
        <div className="hero-card">
          <div className="hero-media">
            <BrandLogo alt="Quantum Liquidity Capital" />
            <span className="hero-glow" aria-hidden="true" />
          </div>
          {section.items?.length > 0 && (
            <div className="hero-mini">
              {section.items.slice(0, 3).map((it) => (
                <div key={it.title}>
                  <b>{it.title}</b>
                  <span>{it.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

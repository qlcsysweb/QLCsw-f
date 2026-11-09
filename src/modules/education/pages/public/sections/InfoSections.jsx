import { priceMoney } from '../../../utils/format.js';
import { responsiveImage } from '../../../utils/media.js';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { LegalLinks } from '../legal/LegalPage.jsx';
import { CtaButton, MoreInfo, SectionCtas, SectionHead } from './SectionParts.jsx';

const hasPrice = (offer) => offer?.price !== null && offer?.price !== undefined;
const priceLabel = (offer, t) => (hasPrice(offer) ? `${priceMoney(offer.price)} ${offer.currency}` : t('public.priceTbd'));

function SectionImage({ section }) {
  if (!section.image) return null;
  const img = responsiveImage(section.image.url, [360, 560, 840]);
  return (
    <div className="ps-image reveal-visual">
      <img {...img} sizes="(max-width: 820px) 60vw, 420px" alt={section.title} loading="lazy" decoding="async" />
    </div>
  );
}

export function LayersSection({ section, go }) {
  const { t } = useI18n();
  const layers = section.items || [];
  return (
    <div className="ps-container split">
      <div className="split-copy">
        <SectionHead section={section} />
        {section.secondaryText && <p className="ps-note reveal" style={{ '--r': 3 }}>{section.secondaryText}</p>}
        <SectionCtas section={section} go={go} />
      </div>
      <ol className="layers" aria-label={t('public.layers')}>
        {layers.map((l, i) => (
          <li key={l.title} className="layer reveal-card" style={{ '--c': i, '--w': `${100 - (layers.length - 1 - i) * 7}%` }}>
            <span className="layer-tag">{l.tag || String(i + 1).padStart(2, '0')}</span>
            <div>
              <b>{l.title}</b>
              <span>{l.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FeatureSection({ section, go }) {
  const { t } = useI18n();
  const items = section.items || [];
  return (
    <div className="ps-container features">
      <div className="features-head">
        <SectionHead section={section} compact />
        {section.secondaryText && <p className="ps-lead features-extra reveal" style={{ '--r': 3 }}>{section.secondaryText}</p>}
        <SectionCtas section={section} go={go} />
      </div>
      <div className="feature-grid">
        {items.map((f, i) => (
          <article key={f.title} className={`feature reveal-card ${i > 3 ? 'is-secondary' : ''}`} style={{ '--c': i }}>
            <span className="feature-index">{String(i + 1).padStart(2, '0')}</span>
            <b>{f.title}</b>
            <p>{f.text}</p>
          </article>
        ))}
      </div>
      {items.length > 4 && (
        <div className="features-more">
          <MoreInfo label={t('public.allFeatures')} title={section.title}>
            <ul className="modal-list">{items.map((f) => <li key={f.title}><b>{f.title}.</b> {f.text}</li>)}</ul>
          </MoreInfo>
        </div>
      )}
      <SectionImage section={section} />
    </div>
  );
}

const PUBLIC_PLANS = [
  ['TOOLS_ALL', { es: ['Herramientas', '30 días', 'Todas las herramientas financieras por 30 días o por 1 año. Se bloquean al terminar y se renuevan cuando quieras. No incluye la Masterclass.'], en: ['Tools', '30 days', 'All financial tools for 30 days or 1 year. They lock when the period ends and can be renewed anytime. Masterclass not included.'] }],
  ['FULL_ANNUAL', { es: ['Membresía anual', '1 año', 'Todas las herramientas y todos los módulos de la Masterclass durante 12 meses.'], en: ['Annual membership', '1 year', 'All tools and every Masterclass module for 12 months.'] }],
  ['DIAMOND_ANNUAL', { es: ['Membresía anual', '1 año', 'Todo lo de QLC Premium Access más 6 sesiones de orientación personalizada de 20 minutos.'], en: ['Annual membership', '1 year', 'Everything in QLC Premium Access plus 6 personal guidance sessions of 20 minutes.'] }],
];

export function AccessSection({ section, offers, go }) {
  const { t, lang } = useI18n();
  const find = (code) => offers.find((o) => o.code === code);
  const extra = [
    [find('MASTERCLASS_M1'), lang === 'es' ? 'Masterclass por módulo · 30 días, en orden' : 'Masterclass per module · 30 days, in order'],
    [find('CONSULTA'), lang === 'es' ? 'Consulta sobre ejercicios' : 'Exercise question'],
    [find('ORIENTACION'), lang === 'es' ? 'Orientación personalizada · 20 minutos' : 'Personal guidance · 20 minutes'],
  ].filter(([o]) => o);
  return (
    <div className="ps-container access">
      <SectionHead section={section} compact />
      <div className="access-grid access-grid-3">
        {PUBLIC_PLANS.map(([code, copy], i) => {
          const offer = find(code);
          if (!offer) return null;
          const [tag, period, text] = copy[lang === 'es' ? 'es' : 'en'];
          return (
            <article key={code} className={`access-card reveal-card ${code === 'DIAMOND_ANNUAL' ? 'is-featured' : ''}`} style={{ '--c': i }}>
              <span className="access-tag">{tag}</span>
              <h3>{offer.name}</h3>
              <p>{text}</p>
              <div className="access-prices">
                <div className="access-price">{priceLabel(offer, t)}<small> / {period}</small></div>
                {code === 'TOOLS_ALL' && find('TOOLS_ANNUAL') && <div className="access-price">{priceLabel(find('TOOLS_ANNUAL'), t)}<small> / {lang === 'es' ? '1 año' : '1 year'}</small></div>}
              </div>
              {offer.giftable !== false && <CtaButton label={lang === 'es' ? '🎁 Regalar' : '🎁 Give as a gift'} target="/app/acceso#regalar" go={go} variant="ghost" />}
            </article>
          );
        })}
      </div>
      {extra.length > 0 && (
        <ul className="access-extra">
          {extra.map(([o, label]) => <li key={o.code}><span>{label}</span><b>{priceLabel(o, t)}</b></li>)}
        </ul>
      )}
      <SectionCtas section={section} go={go} />
    </div>
  );
}

export function RoutesSection({ section, go }) {
  return (
    <div className="ps-container routes">
      <SectionHead section={section} compact />
      <div className="routes-grid">
        {(section.items || []).map((r, i) => (
          <article key={r.title} className={`access-card route-card reveal-card ${r.gold ? 'is-gold' : i === 0 ? 'is-featured' : ''}`} style={{ '--c': i }}>
            <span className="access-tag">{r.tag}</span>
            {r.label && <span className="route-label">{r.label}</span>}
            <h3>{r.title}</h3>
            <p>{r.text}</p>
            {r.list?.length > 0 && <ul className="access-list route-list">{r.list.map((item) => <li key={item}>{item}</li>)}</ul>}
            <CtaButton label={r.cta} target={r.target} go={go} variant={i === 0 ? 'primary' : 'ghost'} />
          </article>
        ))}
      </div>
    </div>
  );
}

export function ClosingSection({ section, go }) {
  return (
    <div className="ps-container closing">
      <div className="closing-panel">
        <SectionHead section={section} />
        <SectionCtas section={section} go={go} />
        {section.secondaryText && <p className="closing-note reveal" style={{ '--r': 5 }}>{section.secondaryText}</p>}
      </div>
      <footer className="closing-foot reveal" style={{ '--r': 6 }}>
        <span>© QLC · Quantum Liquidity Capital</span>
        {section.footer && <span>{section.footer}</span>}
        <LegalLinks />
      </footer>
    </div>
  );
}

export function QlcSection({ section, go }) {
  const { t } = useI18n();
  return (
    <div className="ps-container qlc">
      <div className="qlc-panel">
        <SectionHead section={section} />
        {section.secondaryText && <p className="ps-risk reveal" style={{ '--r': 3 }}>{section.secondaryText}</p>}
        <SectionCtas section={section} go={go} />
      </div>
      <div className="qlc-steps reveal-visual" aria-hidden="true">
        {t('public.qlcSteps').map((s, i) => (
          <div key={s} className="qlc-step" style={{ '--c': i }}><span>{String(i + 1).padStart(2, '0')}</span>{s}</div>
        ))}
      </div>
    </div>
  );
}

export function GenericSection({ section, go }) {
  return (
    <div className="ps-container split">
      <div className="split-copy">
        <SectionHead section={section} />
        <SectionCtas section={section} go={go} />
      </div>
      {section.items?.length > 0 ? (
        <div className="feature-grid compact">
          {section.items.map((f, i) => (
            <article key={f.title} className="feature reveal-card" style={{ '--c': i }}><b>{f.title}</b><p>{f.text}</p></article>
          ))}
        </div>
      ) : <SectionImage section={section} />}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { BRAND_FULL } from '../../../components/layout/Brand.jsx';
import { StagedShell, useStagedSections } from '../../../components/public/StagedShell.jsx';
import { LeadButton, LeadRequestProvider } from '../../../features/leads/LeadModal.jsx';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { CopytradingButton } from '../experience/CopytradingFilter.jsx';
import { LegalNotice } from '../experience/LegalNotice.jsx';
import { CtaButton, SectionHead } from '../sections/SectionParts.jsx';
import { TRADING_CONTENT } from './tradingContent.js';

const SLIDES = ['inicio', 'programa', 'modulos', 'perfil', 'metodo', 'copytrading', 'contacto'];

const FACT_ICONS = {
  calendar: <path d="M7 3v3m10-3v3M4 9h16M5 5.5h14A1.5 1.5 0 0 1 20.5 7v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Zm3 7h.01M12 12.5h.01M16 12.5h.01M8 16h.01M12 16h.01" />,
  wallet: <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5h13V8H6.5A2.5 2.5 0 0 1 4 5.5m12 8.5h1.5" />,
  users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0-1.5-5.6M21 20a5 5 0 0 0-4-4.9" />,
  video: <path d="M4 7h11a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 15 17H4a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4 7Zm12.5 4 5-3v8l-5-3" />,
  mail: <path d="M3.5 6.5h17v11h-17zm0 0 8.5 6.5 8.5-6.5" />,
};

const FactIcon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{FACT_ICONS[name]}</svg>
);

const LINE = 'M15 202 L45 190 L68 207 L94 166 L120 178 L145 146 L168 157 L195 118 L222 139 L248 100 L273 117 L300 84 L325 110 L350 70 L378 91 L402 62 L428 81 L453 43 L480 62 L505 37 L530 53 L560 22 L585 31';

const Eyebrow = ({ children, gold }) => <div className={`ta-eyebrow ${gold ? 'is-gold' : ''}`}>{children}</div>;

function QuantVisual({ visual }) {
  return (
    <div className="ta-visual" aria-hidden="true">
      <div className="ta-visual-head"><span>{visual.head}</span><span className="ta-status">{visual.status}</span></div>
      <svg className="ta-chart" viewBox="0 0 600 260">
        <defs>
          <linearGradient id="ta-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#00a8ff" stopOpacity=".28" /><stop offset="1" stopColor="#00a8ff" stopOpacity="0" /></linearGradient>
        </defs>
        <g stroke="rgba(199,204,210,.12)" strokeWidth="1"><path d="M15 35H585M15 80H585M15 125H585M15 170H585M15 215H585" /><path d="M80 15V240M180 15V240M280 15V240M380 15V240M480 15V240" /></g>
        <path d={`${LINE} L585 240 L15 240Z`} fill="url(#ta-area)" />
        <path className="ta-chart-line" d={LINE} fill="none" stroke="#5bd4ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
        <path d="M15 153H585" stroke="#c89b3c" strokeWidth="1.5" strokeDasharray="6 6" />
        <text x="20" y="145" fill="#c89b3c" fontSize="11">{visual.reference}</text>
        <circle cx="560" cy="22" r="5" fill="#f4f7fb" stroke="#00a8ff" strokeWidth="3" />
      </svg>
      <div className="ta-metrics">
        {visual.metrics.map(([b, s]) => <div key={b}><b>{b}</b><small>{s}</small></div>)}
      </div>
    </div>
  );
}

const SLIDE_RENDERERS = {
  inicio: ({ c, section, go }) => (
    <div className="ps-container ps-hero">
      <div className="hero-copy">
        <SectionHead section={section} as="h1" />
        <div className="hero-note reveal" style={{ '--r': 3 }}><span className="hero-note-text">{c.hero.note}</span></div>
        <div className="ps-ctas reveal" style={{ '--r': 4 }}>
          <CtaButton label={c.hero.primary} target="programa" go={go} />
          <CtaButton label={c.hero.secondary} target="copytrading" go={go} variant="ghost" />
        </div>
      </div>
      <div className="hero-visual reveal-visual"><QuantVisual visual={c.visual} /></div>
    </div>
  ),
  programa: ({ c, section }) => (
    <div className="ps-container ta-slide">
      <SectionHead section={section} compact />
      <div className="ta-facts">
        {c.program.facts.map((f, i) => (
          <article key={f.label} className="ta-fact reveal-card" style={{ '--c': i }}>
            <span className="ta-icon"><FactIcon name={f.icon} /></span>
            <span className="ta-fact-label">{f.label}</span>
            <strong>{f.value}</strong>
            <small>{f.note}</small>
          </article>
        ))}
      </div>
      <div className="ta-split ta-fill">
        <div className="ta-details reveal" style={{ '--r': 5 }}>
          <div className="ta-admission">
            <span className="ta-icon"><FactIcon name="mail" /></span>
            <div><b>{c.program.admission.title}</b><p>{c.program.admission.text}</p></div>
          </div>
          {c.program.bundle && <div className="ta-bundle"><b>{c.program.bundle.title}</b><p>{c.program.bundle.text}</p></div>}
          {c.program.details.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
        </div>
        <article className="ta-panel is-featured reveal-card" style={{ '--c': 5 }}>
          <h3>{c.program.structure.title}</h3>
          <dl className="ta-structure">
            {c.program.structure.rows.map(([label, value, highlight]) => (
              <div key={label}><dt>{label}</dt><dd className={highlight ? 'is-highlight' : ''}>{value}</dd></div>
            ))}
          </dl>
          <LeadButton interest="TRADING_ACADEMY" className="pbtn pbtn-primary">{c.program.cta}</LeadButton>
        </article>
      </div>
    </div>
  ),
  modulos: ({ c, section }) => (
    <div className="ps-container ta-slide">
      <SectionHead section={section} compact />
      <div className="ta-modules">
        {c.modules.map(([title, text], i) => (
          <article key={title} className="ta-module reveal-card" style={{ '--c': i }}>
            <span className="ta-module-num">{c.moduleLabel} {String(i + 1).padStart(2, '0')}</span>
            <b>{title}</b>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </div>
  ),
  perfil: ({ c, section }) => (
    <div className="ps-container ta-slide">
      <SectionHead section={section} compact />
      <div className="ta-split ta-fill">
        <article className="ta-panel reveal-card" style={{ '--c': 0 }}>
          <Eyebrow>{c.knowledge.eyebrow}</Eyebrow>
          <h3>{c.knowledge.title}</h3>
          <p>{c.knowledge.text}</p>
        </article>
        <article className="ta-panel is-featured reveal-card" style={{ '--c': 1 }}>
          <Eyebrow>{c.requirements.eyebrow}</Eyebrow>
          <h3>{c.requirements.title}</h3>
          <ul className="ta-checks">{c.requirements.items.map((it) => <li key={it}>{it}</li>)}</ul>
        </article>
      </div>
      <p className="ta-note reveal" style={{ '--r': 6 }}>{c.requirements.note}</p>
    </div>
  ),
  metodo: ({ c, section }) => (
    <div className="ps-container ta-slide">
      <SectionHead section={section} compact />
      <div className="ta-split ta-fill">
        {c.approaches.map((a, i) => (
          <article key={a.title} className={`ta-panel reveal-card ${a.featured ? 'is-featured' : ''}`} style={{ '--c': i }}>
            <Eyebrow>{a.eyebrow}</Eyebrow>
            <h3>{a.title}</h3>
            <ul className={a.featured ? 'ta-arrows' : 'ta-dots'}>{a.items.map((it) => <li key={it}>{it}</li>)}</ul>
          </article>
        ))}
      </div>
      <p className="ta-note is-gold reveal" style={{ '--r': 6 }}>{c.methodNote}</p>
    </div>
  ),
  copytrading: ({ c, section }) => (
    <div className="ps-container ta-slide ta-split is-center">
      <div className="ta-stack">
        <SectionHead section={section} />
        <ul className="ta-checks reveal" style={{ '--r': 3 }}>{c.copy.points.map(([b, text]) => <li key={b}><span><strong>{b}</strong> {text}</span></li>)}</ul>
      </div>
      <article className="ta-panel is-gold reveal-card" style={{ '--c': 2 }}>
        <Eyebrow gold>{c.copy.panelEyebrow}</Eyebrow>
        <h3>{c.copy.panelTitle[0]}<span className="ta-gold">{c.copy.panelTitle[1]}</span></h3>
        <p>{c.copy.panelText}</p>
        <CopytradingButton className="pbtn pbtn-primary">{c.copy.cta}</CopytradingButton>
        <p className="ta-disclaimer">{c.copy.disclaimer}</p>
      </article>
    </div>
  ),
  contacto: ({ c, section }) => (
    <div className="ps-container ta-slide">
      <SectionHead section={section} compact />
      <div className="ta-faq ta-fill">
        {c.faq.map(([q, a], i) => (
          <details key={q} className="reveal-card" style={{ '--c': i }}><summary>{q}</summary><p>{a}</p></details>
        ))}
      </div>
      <div className="ta-cta reveal" style={{ '--r': 6 }}>
        <h3>{c.contact.title}</h3>
        <LeadButton interest="TRADING_ACADEMY" className="pbtn pbtn-primary">{c.contact.cta}</LeadButton>
      </div>
      <p className="ta-disclaimer reveal" style={{ '--r': 7 }}>{c.contact.disclaimer}</p>
    </div>
  ),
};

function TradingStage() {
  const { lang } = useI18n();
  const c = TRADING_CONTENT[lang] || TRADING_CONTENT.es;
  const [legalOpen, setLegalOpen] = useState(false);
  const sections = useMemo(() => SLIDES.map((key) => ({ key, ...c.sections[key] })), [c]);
  const { activeKey, select } = useStagedSections(sections, `${c.title} · ${BRAND_FULL}`);
  const render = (key) => SLIDE_RENDERERS[key]?.({ c, section: c.sections[key], go: select }) || null;

  return (
    <StagedShell sections={sections} activeKey={activeKey} onSelect={select} render={render} onLegal={() => setLegalOpen(true)} extraLink={{ to: '/educacion-financiera', label: c.extraLink }} homeTo="/">
      <LegalNotice open={legalOpen} onClose={() => setLegalOpen(false)} />
    </StagedShell>
  );
}

export default function TradingAcademy() {
  return (
    <LeadRequestProvider>
      <TradingStage />
    </LeadRequestProvider>
  );
}

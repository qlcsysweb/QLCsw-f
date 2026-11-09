import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { BRAND_FULL } from '../../../components/layout/Brand.jsx';
import { LEGAL_CONTENT, LEGAL_PATHS } from './legalContent.js';

export function LegalLinks({ className = '' }) {
  const { t } = useI18n();
  return (
    <span className={`legal-links ${className}`}>
      <NavLink to={LEGAL_PATHS.terminos}>{t('common.terms')}</NavLink>
      <span aria-hidden="true">·</span>
      <NavLink to={LEGAL_PATHS.privacidad}>{t('common.privacy')}</NavLink>
    </span>
  );
}

export default function LegalPage({ doc }) {
  const { lang } = useI18n();
  const legal = LEGAL_CONTENT[lang] || LEGAL_CONTENT.es;
  const content = legal.docs[doc];
  useEffect(() => {
    document.title = `${content.title} · ${BRAND_FULL}`;
    window.scrollTo(0, 0);
  }, [content.title]);

  return (
    <article className="auth-card legal-card">
      <nav className="auth-methods" aria-label={legal.navLabel}>
        {Object.entries(legal.docs).map(([key, d]) => (
          <NavLink key={key} to={LEGAL_PATHS[key]} className={({ isActive }) => (isActive ? 'is-active' : '')}>{d.label}</NavLink>
        ))}
      </nav>
      <div className="section-kicker">{BRAND_FULL}</div>
      <h1>{content.title}</h1>
      <p className="small muted">{legal.updatedLabel}: {legal.updated}</p>
      <p className="subtitle">{content.intro}</p>
      {content.sections.map(([title, paragraphs]) => (
        <section key={title} className="legal-section">
          <h2>{title}</h2>
          {paragraphs.map((p) => <p key={p}>{p}</p>)}
        </section>
      ))}
    </article>
  );
}

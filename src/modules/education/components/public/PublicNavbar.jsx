import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { BrandLogo } from '../layout/BrandLogo.jsx';
import { BRAND_TAGLINE } from '../layout/Brand.jsx';
import { LanguageSwitcher } from '../ui/LanguageSwitcher.jsx';

export function PublicNavbar({ sections = [], activeKey, onSelect, onLegal, extraLink, homeTo }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const extra = extraLink === false ? null : extraLink || { to: '/trading-academy', label: t('common.tradingInstitutional') };
  const [open, setOpen] = useState(false);
  const brand = (
    <>
      <BrandLogo width="40" height="34" />
      <span className="pnav-brand-text">
        <small>{BRAND_TAGLINE}</small>
      </span>
    </>
  );
  const home = user ? (user.role === 'ADMIN' ? '/admin' : '/app') : null;

  useEffect(() => {
    setOpen(false);
  }, [activeKey]);

  const select = (key) => {
    setOpen(false);
    onSelect?.(key);
  };

  return (
    <header className={`pnav ${sections.length ? 'has-sections' : ''} ${homeTo ? 'has-home' : ''} ${open ? 'is-open' : ''}`}>
      <div className="pnav-inner">
        {homeTo ? (
          <Link className="pnav-brand" to={homeTo} aria-label={t('common.goHome')}>{brand}</Link>
        ) : (
          <button type="button" className="pnav-brand" onClick={() => select(sections[0]?.key)} aria-label={t('common.goHome')}>{brand}</button>
        )}
        {homeTo && <Link className="pnav-home" to={homeTo} aria-label={t('common.mainPage')}><span aria-hidden="true">←</span><b>{t('common.mainPage')}</b></Link>}
        <nav className="pnav-links" aria-label={t('common.sections')}>
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`${s.key === activeKey ? 'is-active' : ''} ${s.navHighlight ? 'is-highlight' : ''}`}
              aria-current={s.key === activeKey ? 'page' : undefined}
              onClick={() => select(s.key)}
            >
              {s.navLabel}
            </button>
          ))}
          {extra && <Link className="pnav-extra" to={extra.to}>{extra.label}</Link>}
        </nav>
        <div className="pnav-actions">
          <LanguageSwitcher />
          {onLegal && <button type="button" className="pnav-ghost pnav-legal" onClick={onLegal}>{t('common.legalShort')}</button>}
          {home ? (
            <Link className="pbtn pbtn-primary pbtn-sm" to={home}>{t('common.myPlatform')}</Link>
          ) : (
            <>
              <Link className="pnav-ghost pnav-login" to="/login">{t('common.login')}</Link>
              <Link className="pbtn pbtn-primary pbtn-sm" to="/registro">{t('common.register')}</Link>
            </>
          )}
          {sections.length > 0 && (
            <button type="button" className="pnav-burger" aria-label={t('common.openMenu')} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              <span />
              <span />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="pnav-sheet">
          {homeTo && (
            <Link className="pnav-sheet-link pnav-sheet-home" to={homeTo} style={{ '--i': 0 }}>
              <span>←</span>
              {t('common.mainPage')}
            </Link>
          )}
          {sections.map((s, i) => (
            <button key={s.key} type="button" className={`${s.key === activeKey ? 'is-active' : ''} ${s.navHighlight ? 'is-highlight' : ''}`} style={{ '--i': i }} onClick={() => select(s.key)}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {s.navLabel}
            </button>
          ))}
          {extra && (
            <Link className="pnav-sheet-link" to={extra.to} style={{ '--i': sections.length }}>
              <span>★</span>
              {extra.label}
            </Link>
          )}
          <div className="pnav-sheet-actions">
            {onLegal && <button type="button" className="pbtn pbtn-ghost" onClick={onLegal}>{t('common.legalFull')}</button>}
          </div>
        </div>
      )}
    </header>
  );
}

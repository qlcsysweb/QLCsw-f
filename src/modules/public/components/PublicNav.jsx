import { useState } from 'react';
import { Link } from 'react-router-dom';
import QlcLogo from '../../../components/QlcLogo';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function PublicNav() {
  const { t, language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const LINKS = [
    { href: '#modelo', label: t('nav.modelo') },
    { href: '#como-funciona', label: t('nav.comoFunciona') },
    { href: '#tecnologia', label: t('nav.tecnologia') },
    { href: '#microposiciones', label: t('nav.microposiciones') },
    { href: '#modelos', label: t('nav.modelos') },
    { href: '#resultados', label: t('nav.resultados') },
    { href: '#seguridad', label: t('nav.seguridad') },
    { href: '#sobre-qlc', label: t('nav.sobreQlc') },
    { href: '#faq', label: t('nav.faq') },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <div className="brand-area">
          <a className="brand" href="#inicio">
            <QlcLogo className="brand-mark" alt="QLC" />
            <span className="brand-name">QLC</span>
          </a>
        </div>
        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="header-access">
          <a className="access-btn" href="#contacto">
            {t('nav.registro')}
          </a>
          <Link className="access-btn" to="/login">
            {t('nav.accesoClientes')}
          </Link>
          <Link className="access-btn access-primary" to="/login">
            {t('nav.accesoAdmins')}
          </Link>
        </div>

        <div className="qlc-nav-menu-wrap">
          <button
            type="button"
            className="menu"
            aria-label={t('menu.open')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰
          </button>

          {menuOpen && (
            <>
              <div className="qlc-nav-menu-backdrop" onClick={closeMenu} />
              <div className="qlc-nav-menu-panel">
                <div className="qlc-nav-menu-section">
                  <div className="qlc-nav-menu-heading">{t('language.label')}</div>
                  <button
                    type="button"
                    className={`qlc-nav-menu-lang${language === 'es' ? ' active' : ''}`}
                    onClick={() => setLanguage('es')}
                  >
                    🇪🇸 Español
                  </button>
                  <button
                    type="button"
                    className={`qlc-nav-menu-lang${language === 'en' ? ' active' : ''}`}
                    onClick={() => setLanguage('en')}
                  >
                    🇺🇸 English
                  </button>
                </div>

                <div className="qlc-nav-menu-divider" />

                <div className="qlc-nav-menu-section qlc-nav-menu-links">
                  {LINKS.map((l) => (
                    <a key={l.href} href={l.href} onClick={closeMenu}>
                      {l.label}
                    </a>
                  ))}
                </div>

                <div className="qlc-nav-menu-divider" />

                <div className="qlc-nav-menu-section qlc-nav-menu-links">
                  <a href="#contacto" onClick={closeMenu}>
                    {t('nav.registro')}
                  </a>
                  <Link to="/login" onClick={closeMenu}>
                    {t('nav.accesoClientes')}
                  </Link>
                  <Link to="/login" onClick={closeMenu}>
                    {t('nav.accesoAdmins')}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

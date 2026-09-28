import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import QlcLogo from '../../../components/QlcLogo';
import { useLanguage } from '../../../i18n/LanguageContext';
import useSectionNav, { SECTIONS, HOME_ID, CONTACT_ID, CONTACT_PATH } from '../useSectionNav';

function LanguageDropdown() {
  const { t, language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="qlc-nav-lang">
      <button
        type="button"
        className="qlc-nav-lang-btn"
        aria-label={t('language.label')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {language === 'es' ? 'ES' : 'EN'} ▾
      </button>
      {open && (
        <>
          {createPortal(<div className="qlc-nav-menu-backdrop" onClick={close} />, document.body)}
          <div className="qlc-nav-lang-panel">
            <button
              type="button"
              className={`qlc-nav-lang-option${language === 'es' ? ' active' : ''}`}
              onClick={() => {
                setLanguage('es');
                close();
              }}
            >
              🇪🇸 Español
            </button>
            <button
              type="button"
              className={`qlc-nav-lang-option${language === 'en' ? ' active' : ''}`}
              onClick={() => {
                setLanguage('en');
                close();
              }}
            >
              🇺🇸 English
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// activeId: vista mostrada por PublicHomePage. Fuera de la página pública
// (Privacidad/Términos) no se recibe y ningún enlace aparece activo.
export default function PublicNav({ activeId = null }) {
  const { t } = useLanguage();
  const goTo = useSectionNav();

  return (
    <nav className="nav" aria-label="QLC">
      <div className="container nav-inner">
        <div className="brand-area">
          <a className="brand" href="/" onClick={goTo('/')} aria-label={t('nav.inicio')}>
            <QlcLogo className="brand-mark" alt="QLC" />
          </a>
        </div>

        <div className="nav-links">
          {/* "Inicio" es siempre la primera opción: regresa al hero. */}
          <a
            href="/"
            className={activeId === HOME_ID ? 'active' : ''}
            aria-current={activeId === HOME_ID ? 'page' : undefined}
            onClick={goTo('/')}
          >
            {t('nav.inicio')}
          </a>
          {/* CORRECCIÓN 20/3: navbar reducido — "Modelo", "Cómo funciona" y
              "Modelos de participación" NO aparecen aquí (las vistas y rutas
              siguen existiendo y se abren desde el hero y el footer).
              "El problema" SÍ debe aparecer, justo después de Microposiciones
              (ver orden real en SECTIONS). */}
          {SECTIONS.filter((s) => !['modelo', 'como-funciona', 'modelos'].includes(s.id)).map((s) => (
            <a
              key={s.id}
              href={s.path}
              className={activeId === s.id ? 'active' : ''}
              aria-current={activeId === s.id ? 'page' : undefined}
              onClick={goTo(s.path)}
            >
              {t(s.labelKey)}
            </a>
          ))}
        </div>

        <div className="qlc-nav-actions">
          <LanguageDropdown />
          <a
            className={`access-btn access-primary${activeId === CONTACT_ID ? ' is-current' : ''}`}
            href={CONTACT_PATH}
            onClick={goTo(CONTACT_PATH)}
            aria-current={activeId === CONTACT_ID ? 'page' : undefined}
          >
            {t('contact.submit')}
          </a>
          <Link className="access-btn" to="/registro">
            {t('nav.registro')}
          </Link>
          <Link className="access-btn" to="/login">
            {t('nav.iniciarSesion')}
          </Link>
        </div>
      </div>
    </nav>
  );
}

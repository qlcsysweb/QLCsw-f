import { tradingPath } from '../../../../../shared/config.js';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '../../../router.jsx';
import QlcLogo from '../../../components/QlcLogo';
import { useLanguage } from '../../../i18n/LanguageContext';
import useSectionNav, { SECTIONS, HOME_ID, CONTACT_ID, CONTACT_PATH } from '../useSectionNav';

// El inglés siempre va primero.
const LANG_LABELS = { en: '🇺🇸 English', es: '🇪🇸 Español', pt: '🇧🇷 Português' };
const MAIN_PAGE = { en: 'Main page', es: 'Página principal', pt: 'Página principal' };
const OPEN_MENU = { en: 'Open menu', es: 'Abrir menú', pt: 'Abrir menu' };

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
        {String(language || 'es').toUpperCase()} ▾
      </button>
      {open && (
        <>
          {createPortal(<div className="qlc-nav-menu-backdrop" onClick={close} />, document.body)}
          <div className="qlc-nav-lang-panel">
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <button
                key={code}
                type="button"
                className={`qlc-nav-lang-option${language === code ? ' active' : ''}`}
                onClick={() => {
                  setLanguage(code);
                  close();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// "Modelo", "Cómo funciona" y "Modelos de participación" no van en el menú:
// se abren desde el hero y el footer.
const MENU = [
  { id: HOME_ID, path: '/', labelKey: 'nav.inicio' },
  ...SECTIONS.filter((s) => !['modelo', 'como-funciona', 'modelos'].includes(s.id)),
];

// activeId: vista mostrada por PublicHomePage. Fuera de la página pública
// (Privacidad/Términos) no se recibe y ningún enlace aparece activo.
// Mismo formato que la academia: "Página principal" a la vista y las
// secciones dentro del menú desplegable.
export default function PublicNav({ activeId = null }) {
  const { t, language } = useLanguage();
  const goTo = useSectionNav();
  const [open, setOpen] = useState(false);
  const mainPage = MAIN_PAGE[language] || MAIN_PAGE.es;

  useEffect(() => {
    setOpen(false);
  }, [activeId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className={`nav${open ? ' is-open' : ''}`} aria-label="QLC">
      <div className="container nav-inner">
        <div className="brand-area">
          <a className="brand" href={tradingPath('/')} onClick={goTo('/')} aria-label={t('nav.inicio')}>
            <QlcLogo className="brand-mark" alt="QLC" />
          </a>
          <RouterLink className="qlc-nav-home" to="/" aria-label={mainPage}>
            <span aria-hidden="true">←</span>
            <b>{mainPage}</b>
          </RouterLink>
        </div>

        <div className="qlc-nav-actions">
          <LanguageDropdown />
          <a
            className={`access-btn access-primary${activeId === CONTACT_ID ? ' is-current' : ''}`}
            href={tradingPath(CONTACT_PATH)}
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
          <button
            type="button"
            className="qlc-nav-burger"
            aria-label={OPEN_MENU[language] || OPEN_MENU.es}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {open && (
        <div className="qlc-nav-sheet">
          <RouterLink className="qlc-nav-sheet-home" to="/" style={{ '--i': 0 }}>
            <span>←</span>
            {mainPage}
          </RouterLink>
          {MENU.map((s, i) => (
            <a
              key={s.id}
              href={tradingPath(s.path)}
              className={activeId === s.id ? 'active' : ''}
              aria-current={activeId === s.id ? 'page' : undefined}
              style={{ '--i': i + 1 }}
              onClick={(e) => {
                setOpen(false);
                goTo(s.path)(e);
              }}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {t(s.labelKey)}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

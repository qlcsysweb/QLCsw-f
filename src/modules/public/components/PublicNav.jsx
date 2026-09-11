import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import QlcLogo from '../../../components/QlcLogo';
import { useLanguage } from '../../../i18n/LanguageContext';
import useSectionNav, { SECTIONS, PATH_TO_ID } from '../useSectionNav';

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

export default function PublicNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeId, setActiveId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const didInitialScroll = useRef(false);

  // Esconder/mostrar según dirección de scroll + aumentar contraste del fondo
  // al alejarse del tope — transición suave vía CSS (ver public.css).
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 40);
      if (currentY < 120) {
        setHidden(false);
      } else if (currentY > lastScrollY.current + 4) {
        setHidden(true);
      } else if (currentY < lastScrollY.current - 4) {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detecta automáticamente qué sección está visible mientras el usuario
  // baja/sube por la página (scrollspy) — nunca requiere clic. Modelos/FAQ
  // se montan después (dependen de la carga del CMS), así que se reintenta
  // observarlas hasta que las 9 secciones estén presentes en el DOM.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    const observed = new Set();
    const tryObserveAll = () => {
      SECTIONS.forEach((s) => {
        if (observed.has(s.id)) return;
        const el = document.getElementById(s.id);
        if (el) {
          observer.observe(el);
          observed.add(s.id);
        }
      });
    };
    tryObserveAll();
    const interval = setInterval(() => {
      tryObserveAll();
      if (observed.size === SECTIONS.length) clearInterval(interval);
    }, 300);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Si se entra directamente a una ruta limpia (o se recarga en ella), lleva
  // a esa sección una sola vez al montar — sin animación (carga inicial).
  // Modelos/FAQ dependen de la carga del CMS, así que se reintenta unos
  // instantes si la sección todavía no está montada.
  useEffect(() => {
    if (didInitialScroll.current) return;
    const id = PATH_TO_ID[location.pathname];
    if (!id) {
      didInitialScroll.current = true;
      return;
    }
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        didInitialScroll.current = true;
      } else if (attempts < 20) {
        attempts += 1;
        setTimeout(tryScroll, 150);
      } else {
        didInitialScroll.current = true;
      }
    };
    tryScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToSection = useSectionNav();

  const goHome = (e) => {
    e.preventDefault();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToRegistroForm = (e) => {
    e.preventDefault();
    document.getElementById('registro-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={`nav${scrolled ? ' nav-scrolled' : ''}${hidden ? ' nav-hidden' : ''}`}>
      <div className="container nav-inner">
        <div className="brand-area">
          <a className="brand" href="/" onClick={goHome}>
            <QlcLogo className="brand-mark" alt="QLC" />
          </a>
        </div>

        <div className="nav-links">
          {/* CORRECCIÓN 20/3: navbar reducido — "Modelo", "Cómo funciona" y
              "Modelos de participación" NO aparecen aquí (las páginas y
              rutas siguen existiendo, solo se quitó el enlace del navbar).
              "El problema" SÍ debe aparecer, justo después de Microposiciones
              (ver orden real en SECTIONS). */}
          {SECTIONS.filter((s) => !['modelo', 'como-funciona', 'modelos'].includes(s.id)).map((s) => (
            <a
              key={s.id}
              href={s.path}
              className={activeId === s.id ? 'active' : ''}
              onClick={goToSection(s.path, s.id)}
            >
              {t(s.labelKey)}
            </a>
          ))}
        </div>

        <div className="qlc-nav-actions">
          <LanguageDropdown />
          <a className="access-btn access-primary" href="#registro-form" onClick={goToRegistroForm}>
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

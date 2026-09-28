import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import usePublicData from './usePublicData';
import { resolveViewId, HOME_ID } from './useSectionNav';
import { getCookie, setCookie } from '../../utils/cookies';
import DailyLanguagePrompt from '../../i18n/DailyLanguagePrompt';
import AntiScamModal from '../../components/AntiScamModal';
import PublicNav from './components/PublicNav';
import Hero from './components/Hero';
import ModeloSection from './components/ModeloSection';
import ComoFuncionaSection from './components/ComoFuncionaSection';
import TecnologiaSection from './components/TecnologiaSection';
import MicroposicionesSection from './components/MicroposicionesSection';
import ProblemaSection from './components/ProblemaSection';
import ModelosSection from './components/ModelosSection';
import ResultadosSection from './components/ResultadosSection';
import SeguridadSection from './components/SeguridadSection';
import SobreQlcSection from './components/SobreQlcSection';
import FaqSection from './components/FaqSection';
import ContactoSection from './components/ContactoSection';
import PublicFooter from './components/PublicFooter';
import './public.css';

// CORRECCIÓN 1: el visitante puede volver a elegir idioma solo una vez al
// día; el aviso antiestafa, en cambio, aparece en CADA visita a la página
// pública, siempre inmediatamente después. Ninguno de los dos afecta la
// preferencia de idioma permanente (qlc_language, 365 días).
const LANGUAGE_PROMPT_COOKIE = 'qlc_language_prompt_date';
const todayString = () => new Date().toISOString().slice(0, 10);

// Duración del fundido de salida; la entrada (≈220ms) es una animación CSS
// (.qlc-view) — ver public.css.
const FADE_OUT_MS = 160;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/*
 * La página pública funciona como un conjunto de pantallas: el navbar queda
 * fijo arriba y debajo se muestra ÚNICAMENTE la sección activa. Al elegir otra
 * opción: fade out → se reemplaza el contenido → fade in. No existe scroll
 * entre secciones; si una sección no cabe en la altura disponible, solo su
 * contenedor (.qlc-stage) muestra scroll interno.
 */
export default function PublicHomePage() {
  const location = useLocation();
  const { text, media, models, faqs, trackRecord, loading } = usePublicData();
  const [showLanguagePrompt, setShowLanguagePrompt] = useState(
    () => getCookie(LANGUAGE_PROMPT_COOKIE) !== todayString()
  );
  const [showScamModal, setShowScamModal] = useState(
    () => getCookie(LANGUAGE_PROMPT_COOKIE) === todayString()
  );

  const targetId = resolveViewId(location.pathname, location.hash);
  const [shownId, setShownId] = useState(targetId);
  const [leaving, setLeaving] = useState(false);
  const stageRef = useRef(null);
  const viewRef = useRef(null);
  const isFirstView = useRef(true);

  useEffect(() => {
    if (targetId === shownId) {
      setLeaving(false);
      return undefined;
    }
    if (prefersReducedMotion()) {
      setShownId(targetId);
      return undefined;
    }
    setLeaving(true);
    const timer = setTimeout(() => {
      setShownId(targetId);
      setLeaving(false);
    }, FADE_OUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  // Cada sección empieza desde su propio inicio (sin arrastrar el scroll
  // interno de la anterior) y recibe el foco para lectores de pantalla.
  useLayoutEffect(() => {
    if (stageRef.current) stageRef.current.scrollTop = 0;
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    viewRef.current?.focus({ preventScroll: true });
  }, [shownId]);

  const handleLanguagePromptDone = () => {
    setCookie(LANGUAGE_PROMPT_COOKIE, todayString(), 2);
    setShowLanguagePrompt(false);
    setShowScamModal(true);
  };

  const renderView = () => {
    switch (shownId) {
      case 'modelo':
        return <ModeloSection text={text} media={media} />;
      case 'como-funciona':
        return <ComoFuncionaSection text={text} media={media} />;
      case 'tecnologia':
        return <TecnologiaSection text={text} media={media} />;
      case 'microposiciones':
        return <MicroposicionesSection text={text} media={media} />;
      case 'el-problema':
        return <ProblemaSection text={text} media={media} />;
      case 'modelos':
        return loading ? null : <ModelosSection models={models} text={text} media={media} />;
      case 'resultados':
        return <ResultadosSection trackRecord={trackRecord} text={text} media={media} />;
      case 'seguridad':
        return <SeguridadSection text={text} media={media} />;
      case 'sobre-qlc':
        return <SobreQlcSection text={text} media={media} />;
      case 'faq':
        return loading ? null : <FaqSection faqs={faqs} media={media} />;
      case 'contacto':
        return (
          <>
            <ContactoSection text={text} media={media} />
            <PublicFooter text={text} media={media} />
          </>
        );
      case HOME_ID:
      default:
        return <Hero text={text} media={media} trackRecord={trackRecord} />;
    }
  };

  return (
    <div className="qlc-public qlc-public-app">
      {showLanguagePrompt && <DailyLanguagePrompt onDone={handleLanguagePromptDone} />}
      {showScamModal && <AntiScamModal onClose={() => setShowScamModal(false)} />}
      <PublicNav activeId={targetId} />
      <main className="qlc-stage" ref={stageRef}>
        <div
          key={shownId}
          ref={viewRef}
          tabIndex={-1}
          className={`qlc-view${leaving ? ' is-leaving' : ''}`}
          data-view={shownId}
        >
          {renderView()}
        </div>
      </main>
    </div>
  );
}

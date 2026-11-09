import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from '../../router.jsx';
import usePublicData from './usePublicData';
import useDominoEntrance from './useDominoEntrance';
import { resolveViewId, HOME_ID } from './useSectionNav';
import AntiScamModal from '../../components/AntiScamModal';
import AccountNotice from '../../components/AccountNotice';
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
import FaqAffiliateSection from './components/FaqAffiliateSection';
import ContactoSection from './components/ContactoSection';
import PublicFooter from './components/PublicFooter';
import './public.css';


/*
 * La página pública funciona como un conjunto de pantallas: el navbar queda
 * fijo arriba y debajo se muestra ÚNICAMENTE la sección activa. Al elegir otra
 * opción, la sección nueva reemplaza a la anterior al instante (sin fundido
 * de salida) y sus elementos entran en dominó, uno tras otro, hasta quedar
 * acomodados (ver useDominoEntrance.js). No existe scroll entre secciones; si
 * una sección no cabe en la altura disponible, solo su contenedor
 * (.qlc-stage) muestra scroll interno.
 */
export default function PublicHomePage() {
  const location = useLocation();
  const { text, media, models, faqs, trackRecord, loading } = usePublicData();
  const [showScamModal, setShowScamModal] = useState(true);
  const shownId = resolveViewId(location.pathname, location.hash);
  const stageRef = useRef(null);
  const viewRef = useRef(null);
  const isFirstView = useRef(true);

  // Cascada dominó al entrar a una sección; `loading` la vuelve a evaluar
  // cuando llegan los datos del CMS (FAQ / modelos se montan después).
  useDominoEntrance(viewRef, [shownId, loading]);

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

  const renderView = () => {
    switch (shownId) {
      case 'modelo':
        return <ModeloSection text={text} media={media} />;
      case 'como-funciona':
        return <ComoFuncionaSection text={text} media={media} />;
      case 'tecnologia':
        return <TecnologiaSection text={text} media={media} withIntro />;
      case 'microposiciones':
        return <MicroposicionesSection text={text} media={media} />;
      case 'el-problema':
        return <ProblemaSection text={text} media={media} withIntro />;
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
      case 'faq-affiliate-program':
        return <FaqAffiliateSection />;
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
      {/* El aviso antiestafa aparece en cada visita, después del selector de
          idioma de TradingApp. El modal de transferencia interna Bitget se
          muestra al iniciar sesión como cliente (ver ClientLayout), no aquí. */}
      {showScamModal && <AntiScamModal onClose={() => setShowScamModal(false)} />}
      {/* Aviso tras solicitar la eliminación de la cuenta (una sola vez). */}
      <AccountNotice />
      <PublicNav activeId={shownId} />
      <main className="qlc-stage" ref={stageRef}>
        <div
          key={shownId}
          ref={viewRef}
          tabIndex={-1}
          className="qlc-view"
          data-view={shownId}
        >
          {renderView()}
        </div>
      </main>
    </div>
  );
}

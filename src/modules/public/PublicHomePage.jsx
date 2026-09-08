import usePublicData from './usePublicData';
import PublicNav from './components/PublicNav';
import Hero from './components/Hero';
import ModeloSection from './components/ModeloSection';
import ComoFuncionaSection from './components/ComoFuncionaSection';
import TecnologiaSection from './components/TecnologiaSection';
import MicroposicionesSection from './components/MicroposicionesSection';
import ModelosSection from './components/ModelosSection';
import ResultadosSection from './components/ResultadosSection';
import SeguridadSection from './components/SeguridadSection';
import SobreQlcSection from './components/SobreQlcSection';
import FaqSection from './components/FaqSection';
import ContactoSection from './components/ContactoSection';
import PublicFooter from './components/PublicFooter';
import './public.css';

export default function PublicHomePage() {
  const { text, media, models, faqs, trackRecord, loading } = usePublicData();

  return (
    <div className="qlc-public">
      <PublicNav />
      <main id="inicio">
        <Hero text={text} media={media} trackRecord={trackRecord} />
        <ModeloSection text={text} media={media} />
        <ComoFuncionaSection text={text} media={media} />
        <TecnologiaSection text={text} media={media} />
        <MicroposicionesSection text={text} media={media} />
        {!loading && <ModelosSection models={models} text={text} media={media} />}
        <ResultadosSection trackRecord={trackRecord} text={text} media={media} />
        <SeguridadSection text={text} media={media} />
        <SobreQlcSection text={text} media={media} />
        {!loading && <FaqSection faqs={faqs} media={media} />}
        <ContactoSection text={text} media={media} />
      </main>
      <PublicFooter text={text} media={media} />
    </div>
  );
}

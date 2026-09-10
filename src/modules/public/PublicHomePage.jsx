import { useState } from 'react';
import usePublicData from './usePublicData';
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

export default function PublicHomePage() {
  const { text, media, models, faqs, trackRecord, loading } = usePublicData();
  const [showLanguagePrompt, setShowLanguagePrompt] = useState(
    () => getCookie(LANGUAGE_PROMPT_COOKIE) !== todayString()
  );
  const [showScamModal, setShowScamModal] = useState(
    () => getCookie(LANGUAGE_PROMPT_COOKIE) === todayString()
  );

  const handleLanguagePromptDone = () => {
    setCookie(LANGUAGE_PROMPT_COOKIE, todayString(), 2);
    setShowLanguagePrompt(false);
    setShowScamModal(true);
  };

  return (
    <div className="qlc-public">
      {showLanguagePrompt && <DailyLanguagePrompt onDone={handleLanguagePromptDone} />}
      {showScamModal && <AntiScamModal onClose={() => setShowScamModal(false)} />}
      <PublicNav />
      <main id="inicio">
        <Hero text={text} media={media} trackRecord={trackRecord} />
        <ModeloSection text={text} media={media} />
        <ComoFuncionaSection text={text} media={media} />
        <TecnologiaSection text={text} media={media} />
        <MicroposicionesSection text={text} media={media} />
        <ProblemaSection text={text} media={media} />
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

import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND_FULL } from '../../../components/layout/Brand.jsx';
import { StagedShell, useStagedSections } from '../../../components/public/StagedShell.jsx';
import { LeadRequestProvider, useLeadRequest } from '../../../features/leads/LeadModal.jsx';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { LegalNotice } from '../experience/LegalNotice.jsx';
import { HeroSection } from '../sections/HeroSection.jsx';
import { ClosingSection, LayersSection, RoutesSection } from '../sections/InfoSections.jsx';
import { EvidenceCard, EvidenceIntro } from '../sections/EvidenceCard.jsx';
import { HOME_CONTENT } from './homeContent.js';

// Rutas de formación: el texto "Conocimiento respaldado por experiencia real" arriba de las tarjetas y,
// en el tercer espacio, la tarjeta con el logo, las métricas de Bitget y el botón al perfil.
const ProductsSection = (props) => (
  <RoutesSection {...props} intro={<EvidenceIntro />} extra={<EvidenceCard index={(props.section?.items || []).length} />} />
);

const RENDERERS = {
  inicio: HeroSection,
  productos: ProductsSection,
  enfoque: RoutesSection,
  regalo: LayersSection,
  qlc: ClosingSection,
};

function HomeStage() {
  const { lang } = useI18n();
  const content = HOME_CONTENT[lang] || HOME_CONTENT.es;
  const sections = content.sections;
  const navigate = useNavigate();
  const requestInfo = useLeadRequest();
  const [legalOpen, setLegalOpen] = useState(false);
  const { activeKey, select } = useStagedSections(sections, BRAND_FULL);
  const byKey = useMemo(() => Object.fromEntries(sections.map((s) => [s.key, s])), [sections]);

  const go = useCallback((target) => {
    if (!target) return;
    if (target === 'solicitar-info') return requestInfo('GENERAL');
    if (target.startsWith('/')) return navigate(target);
    return select(target);
  }, [navigate, requestInfo, select]);

  const render = (key) => {
    const Renderer = RENDERERS[key];
    return Renderer ? <Renderer section={byKey[key]} go={go} /> : null;
  };

  return (
    <StagedShell sections={sections} activeKey={activeKey} onSelect={select} render={render} onLegal={() => setLegalOpen(true)} extraLink={{ to: '/trading-academy', label: content.extraLink }}>
      <LegalNotice open={legalOpen} onClose={() => setLegalOpen(false)} />
    </StagedShell>
  );
}

export default function QlcHome() {
  return (
    <LeadRequestProvider>
      <HomeStage />
    </LeadRequestProvider>
  );
}

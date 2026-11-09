import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND_FULL } from '../../../components/layout/Brand.jsx';
import { StagedShell, useStagedSections } from '../../../components/public/StagedShell.jsx';
import { HeroSection } from '../sections/HeroSection.jsx';
import { CourseSection } from '../sections/CourseSection.jsx';
import { AccessSection, FeatureSection, GenericSection, LayersSection, QlcSection } from '../sections/InfoSections.jsx';
import { CopytradingFilter } from './CopytradingFilter.jsx';
import { LegalNotice } from './LegalNotice.jsx';
import { usePublicContent } from './usePublicContent.js';

const RENDERERS = {
  inicio: HeroSection,
  curso: CourseSection,
  patrimonio: LayersSection,
  plataforma: FeatureSection,
  acceso: AccessSection,
  qlc: QlcSection,
};

export default function PublicExperience() {
  const content = usePublicContent();
  const sections = content.sections;
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const { activeKey, select } = useStagedSections(sections, BRAND_FULL);
  const byKey = useMemo(() => Object.fromEntries(sections.map((s) => [s.key, s])), [sections]);

  const go = useCallback((target) => {
    if (!target) return;
    if (target === 'filtro-qlc') return setFilterOpen(true);
    if (target.startsWith('/')) return navigate(target);
    if (/^https?:\/\//.test(target)) return window.open(target, '_blank', 'noopener');
    return select(target);
  }, [navigate, select]);

  const render = (key) => {
    const section = byKey[key];
    if (!section) return null;
    const Renderer = RENDERERS[key] || GenericSection;
    return <Renderer section={section} offers={content.offers || []} go={go} />;
  };

  return (
    <StagedShell sections={sections} activeKey={activeKey} onSelect={select} render={render} onLegal={() => setLegalOpen(true)} homeTo="/">
      <CopytradingFilter open={filterOpen} onClose={() => setFilterOpen(false)} />
      <LegalNotice open={legalOpen} onClose={() => setLegalOpen(false)} />
    </StagedShell>
  );
}

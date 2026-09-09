import { useEffect, useState } from 'react';
import api from '../../../services/api';
import Modal from '../../../components/Modal';
import SectionContentModal from './SectionContentModal';
import ModelsPage from '../ModelsPage';
import FaqPage from '../FaqPage';
import TrackRecordPage from '../TrackRecordPage';
import MediaLibraryPage from './MediaLibraryPage';
import { useLanguage } from '../../../i18n/LanguageContext';

import Hero from '../../public/components/Hero';
import ModeloSection from '../../public/components/ModeloSection';
import ComoFuncionaSection from '../../public/components/ComoFuncionaSection';
import TecnologiaSection from '../../public/components/TecnologiaSection';
import MicroposicionesSection from '../../public/components/MicroposicionesSection';
import SeguridadSection from '../../public/components/SeguridadSection';
import SobreQlcSection from '../../public/components/SobreQlcSection';
import ContactoSection from '../../public/components/ContactoSection';
import PublicFooter from '../../public/components/PublicFooter';

export default function CmsPage() {
  const { t } = useLanguage();
  const [content, setContent] = useState({});
  const [trackRecord, setTrackRecord] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [customModal, setCustomModal] = useState(null);
  const [message, setMessage] = useState('');

  const SECTIONS = [
    {
      key: 'multimedia',
      label: t('adminCms.multimediaLabel'),
      description: t('adminCms.multimediaDesc'),
      kind: 'custom',
    },
    {
      key: 'hero',
      label: t('adminCms.heroLabel'),
      description: t('adminCms.heroDesc'),
      kind: 'content',
      section: 'hero',
      fields: [
        { key: 'eyebrow', label: t('adminCms.fieldEyebrow'), fallback: 'Institutional Copytrading Infrastructure' },
        { key: 'title_line1', label: t('adminCms.fieldTitleLine1'), fallback: 'Copytrading Institucional.' },
        { key: 'title_line2', label: t('adminCms.fieldTitleLine2Highlight'), fallback: 'Accesible desde 20 USDT.' },
        { key: 'lead', label: t('adminCms.fieldDescription'), type: 'textarea', fallback: '' },
        { key: 'mini_platform_label', label: t('adminCms.fieldMiniPlatformLabel'), fallback: 'BITGET' },
        { key: 'mini_platform_value', label: t('adminCms.fieldMiniPlatformValue'), fallback: 'Elite Trader' },
      ],
      PreviewComponent: Hero,
    },
    {
      key: 'modelo',
      label: t('adminCms.modeloLabel'),
      description: t('adminCms.modeloDesc'),
      kind: 'content',
      section: 'modelo',
      fields: [
        { key: 'kicker', label: t('adminCms.fieldLabel'), fallback: 'EL CONCEPTO' },
        { key: 'h2_line1', label: t('adminCms.fieldTitleLine1'), fallback: 'Copytrading institucional.' },
        { key: 'h2_line2', label: t('adminCms.fieldTitleLine2Highlight'), fallback: 'Sin salir de tu cuenta.' },
        { key: 'intro', label: t('adminCms.fieldIntroText'), type: 'textarea', fallback: '' },
      ],
      PreviewComponent: ModeloSection,
    },
    {
      key: 'como_funciona',
      label: t('adminCms.comoFuncionaLabel'),
      description: t('adminCms.comoFuncionaDesc'),
      kind: 'content',
      section: 'como_funciona',
      fields: [
        { key: 'kicker', label: t('adminCms.fieldLabel'), fallback: 'CÓMO FUNCIONA' },
        { key: 'h2_line1', label: t('adminCms.fieldTitleLine1'), fallback: 'Tu cuenta.' },
        { key: 'h2_line2', label: t('adminCms.fieldTitleLine2Highlight'), fallback: 'Nuestra infraestructura.' },
        { key: 'sub', label: t('adminCms.fieldSubtitle'), type: 'textarea', fallback: '' },
        { key: 'connection_title', label: t('adminCms.fieldConnectionTitle'), fallback: '' },
        { key: 'connection_text', label: t('adminCms.fieldConnectionText'), type: 'textarea', fallback: '' },
      ],
      PreviewComponent: ComoFuncionaSection,
    },
    {
      key: 'tecnologia',
      label: t('adminCms.tecnologiaLabel'),
      description: t('adminCms.tecnologiaDesc'),
      kind: 'content',
      section: 'tecnologia',
      fields: [
        { key: 'kicker', label: t('adminCms.fieldLabel'), fallback: 'INFRAESTRUCTURA' },
        { key: 'h2_line1', label: t('adminCms.fieldTitleLine1'), fallback: 'Una arquitectura.' },
        { key: 'h2_line2', label: t('adminCms.fieldTitleLine2Highlight'), fallback: 'Una experiencia sencilla.' },
        { key: 'sub', label: t('adminCms.fieldSubtitle'), type: 'textarea', fallback: '' },
      ],
      PreviewComponent: TecnologiaSection,
    },
    {
      key: 'microposiciones',
      label: t('adminCms.microposicionesLabel'),
      description: t('adminCms.microposicionesDesc'),
      kind: 'content',
      section: 'microposiciones',
      fields: [
        { key: 'range', label: t('adminCms.fieldRange'), fallback: '20–400 USDT' },
        { key: 'lead', label: t('adminCms.fieldText'), type: 'textarea', fallback: '' },
      ],
      PreviewComponent: MicroposicionesSection,
    },
    {
      key: 'modelos',
      label: t('adminCms.modelosLabel'),
      description: t('adminCms.modelosDesc'),
      kind: 'custom',
    },
    {
      key: 'track_record',
      label: t('adminCms.trackRecordLabel'),
      description: t('adminCms.trackRecordDesc'),
      kind: 'custom',
    },
    {
      key: 'seguridad',
      label: t('adminCms.seguridadLabel'),
      description: t('adminCms.seguridadDesc'),
      kind: 'content',
      section: 'seguridad',
      fields: [
        { key: 'kicker', label: t('adminCms.fieldLabel'), fallback: 'CONTROL' },
        { key: 'h2_line1', label: t('adminCms.fieldTitleLine1'), fallback: 'Tu cuenta.' },
        { key: 'h2_line2', label: t('adminCms.fieldTitleLine2Highlight'), fallback: 'Tu capital. Tu control.' },
      ],
      PreviewComponent: SeguridadSection,
    },
    {
      key: 'sobre_qlc',
      label: t('adminCms.sobreQlcLabel'),
      description: t('adminCms.sobreQlcDesc'),
      kind: 'content',
      section: 'sobre_qlc',
      fields: [
        { key: 'intro', label: t('adminCms.fieldInstitutionalPhrase'), type: 'textarea', fallback: '' },
        { key: 'body_1', label: t('adminCms.fieldParagraph1'), type: 'textarea', fallback: '' },
        { key: 'body_2', label: t('adminCms.fieldParagraph2'), type: 'textarea', fallback: '' },
        { key: 'body_3', label: t('adminCms.fieldParagraph3Highlight'), type: 'textarea', fallback: '' },
      ],
      PreviewComponent: SobreQlcSection,
    },
    {
      key: 'faq',
      label: t('adminCms.faqLabel'),
      description: t('adminCms.faqDesc'),
      kind: 'custom',
    },
    {
      key: 'contacto',
      label: t('adminCms.contactoLabel'),
      description: t('adminCms.contactoDesc'),
      kind: 'content',
      section: 'contacto',
      fields: [
        { key: 'kicker', label: t('adminCms.fieldLabel'), fallback: 'QUANTUM LIQUIDITY CAPITAL' },
        { key: 'title', label: t('adminCms.fieldTitle'), fallback: 'COPYTRADING INSTITUCIONAL.' },
        { key: 'sub', label: t('adminCms.fieldSubtitle'), type: 'textarea', fallback: '' },
      ],
      PreviewComponent: ContactoSection,
    },
    {
      key: 'footer',
      label: t('adminCms.footerLabel'),
      description: t('adminCms.footerDesc'),
      kind: 'content',
      section: 'footer',
      fields: [
        { key: 'tagline', label: t('adminCms.fieldTagline'), fallback: '' },
        { key: 'disclaimer', label: t('adminCms.fieldRiskDisclaimer'), type: 'textarea', rows: 4, fallback: '' },
      ],
      PreviewComponent: PublicFooter,
    },
  ];

  const load = () => {
    api.get('/admin/content').then(({ data }) => {
      const bySection = {};
      data.content.forEach((row) => {
        bySection[row.section] = bySection[row.section] || {};
        bySection[row.section][row.key] = { value: row.value, valueEn: row.valueEn };
      });
      setContent(bySection);
    });
    api.get('/track-record').then(({ data }) => setTrackRecord(data.trackRecord)).catch(() => {});
  };
  useEffect(load, []);

  const openSection = (section) => {
    if (section.kind === 'custom') {
      setCustomModal(section.key);
    } else {
      setActiveSection(section);
    }
  };

  const handleSaved = () => {
    setActiveSection(null);
    setMessage(t('adminCms.changesSaved'));
    setTimeout(() => setMessage(''), 3500);
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminCms.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminCms.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('adminCms.intro')}</p>

      {message && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>
          {message}
        </div>
      )}

      <div className="qlc-detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {SECTIONS.map((s) => (
          <div className="qlc-card" key={s.key}>
            <div className="qlc-kicker">{s.label}</div>
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)', minHeight: 40 }}>{s.description}</p>
            <button className="qlc-btn primary" style={{ width: '100%' }} onClick={() => openSection(s)}>
              {t('adminCms.edit')}
            </button>
          </div>
        ))}
      </div>

      {activeSection && (
        <SectionContentModal
          title={activeSection.label}
          section={activeSection.section}
          fields={activeSection.fields}
          currentValues={content[activeSection.section]}
          PreviewComponent={activeSection.PreviewComponent}
          previewProps={activeSection.key === 'hero' ? { trackRecord } : {}}
          onClose={() => setActiveSection(null)}
          onSaved={handleSaved}
        />
      )}

      {customModal === 'modelos' && (
        <Modal title={t('adminCms.modelsModalTitle')} onClose={() => setCustomModal(null)} width={960}>
          <ModelsPage />
        </Modal>
      )}
      {customModal === 'track_record' && (
        <Modal title={t('adminCms.trackRecordLabel')} onClose={() => setCustomModal(null)} width={640}>
          <TrackRecordPage />
        </Modal>
      )}
      {customModal === 'faq' && (
        <Modal title={t('adminCms.faqModalTitle')} onClose={() => setCustomModal(null)} width={720}>
          <FaqPage />
        </Modal>
      )}
      {customModal === 'multimedia' && (
        <Modal title={t('adminCms.multimediaModalTitle')} onClose={() => setCustomModal(null)} width={960}>
          <MediaLibraryPage />
        </Modal>
      )}
    </div>
  );
}

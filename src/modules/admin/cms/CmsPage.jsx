import { useEffect, useState } from 'react';
import api from '../../../services/api';
import Modal from '../../../components/Modal';
import SectionContentModal from './SectionContentModal';
import ModelsPage from '../ModelsPage';
import FaqPage from '../FaqPage';
import TrackRecordPage from '../TrackRecordPage';
import MediaLibraryPage from './MediaLibraryPage';

import Hero from '../../public/components/Hero';
import ModeloSection from '../../public/components/ModeloSection';
import ComoFuncionaSection from '../../public/components/ComoFuncionaSection';
import TecnologiaSection from '../../public/components/TecnologiaSection';
import MicroposicionesSection from '../../public/components/MicroposicionesSection';
import SeguridadSection from '../../public/components/SeguridadSection';
import SobreQlcSection from '../../public/components/SobreQlcSection';
import ContactoSection from '../../public/components/ContactoSection';
import PublicFooter from '../../public/components/PublicFooter';

const SECTIONS = [
  {
    key: 'multimedia',
    label: 'MULTIMEDIA',
    description: 'Logo animado, imágenes y videos de la página pública — subir, publicar, ordenar y asignar a cada sección.',
    kind: 'custom',
  },
  {
    key: 'hero',
    label: 'HERO',
    description: 'Título principal, frase destacada y estadísticas de portada.',
    kind: 'content',
    section: 'hero',
    fields: [
      { key: 'eyebrow', label: 'Etiqueta superior', fallback: 'Institutional Copytrading Infrastructure' },
      { key: 'title_line1', label: 'Título — línea 1', fallback: 'Trading institucional.' },
      { key: 'title_line2', label: 'Título — línea 2 (resaltada)', fallback: 'Accesible desde 20 USDT.' },
      { key: 'lead', label: 'Descripción', type: 'textarea', fallback: '' },
      { key: 'mini_platform_label', label: 'Plataforma (mini stat)', fallback: 'BITGET' },
      { key: 'mini_platform_value', label: 'Valor de plataforma (mini stat)', fallback: 'Elite Trader' },
    ],
    PreviewComponent: Hero,
  },
  {
    key: 'modelo',
    label: 'MODELO',
    description: '"El concepto" — cómo se presenta la propuesta de copytrading.',
    kind: 'content',
    section: 'modelo',
    fields: [
      { key: 'kicker', label: 'Etiqueta', fallback: 'EL CONCEPTO' },
      { key: 'h2_line1', label: 'Título — línea 1', fallback: 'Copytrading institucional.' },
      { key: 'h2_line2', label: 'Título — línea 2 (resaltada)', fallback: 'Sin salir de tu cuenta.' },
      { key: 'intro', label: 'Texto introductorio', type: 'textarea', fallback: '' },
    ],
    PreviewComponent: ModeloSection,
  },
  {
    key: 'como_funciona',
    label: 'CÓMO FUNCIONA',
    description: 'Explicación del flujo cliente → API → QLC.',
    kind: 'content',
    section: 'como_funciona',
    fields: [
      { key: 'kicker', label: 'Etiqueta', fallback: 'CÓMO FUNCIONA' },
      { key: 'h2_line1', label: 'Título — línea 1', fallback: 'Tu cuenta.' },
      { key: 'h2_line2', label: 'Título — línea 2 (resaltada)', fallback: 'Nuestra infraestructura.' },
      { key: 'sub', label: 'Subtítulo', type: 'textarea', fallback: '' },
      { key: 'connection_title', label: 'Título de la conexión directa', fallback: '' },
      { key: 'connection_text', label: 'Texto de la conexión directa', type: 'textarea', fallback: '' },
    ],
    PreviewComponent: ComoFuncionaSection,
  },
  {
    key: 'tecnologia',
    label: 'TECNOLOGÍA',
    description: 'Infraestructura tecnológica de QLC.',
    kind: 'content',
    section: 'tecnologia',
    fields: [
      { key: 'kicker', label: 'Etiqueta', fallback: 'INFRAESTRUCTURA' },
      { key: 'h2_line1', label: 'Título — línea 1', fallback: 'Una arquitectura.' },
      { key: 'h2_line2', label: 'Título — línea 2 (resaltada)', fallback: 'Una experiencia sencilla.' },
      { key: 'sub', label: 'Subtítulo', type: 'textarea', fallback: '' },
    ],
    PreviewComponent: TecnologiaSection,
  },
  {
    key: 'microposiciones',
    label: 'MICROPOSICIONES',
    description: 'Rango de inversión y texto de escala.',
    kind: 'content',
    section: 'microposiciones',
    fields: [
      { key: 'range', label: 'Rango (ej. 20–400 USDT)', fallback: '20–400 USDT' },
      { key: 'lead', label: 'Texto', type: 'textarea', fallback: '' },
    ],
    PreviewComponent: MicroposicionesSection,
  },
  {
    key: 'modelos',
    label: 'MODELOS',
    description: 'Flexible, Performance y Compound — datos reales de cada modelo.',
    kind: 'custom',
  },
  {
    key: 'track_record',
    label: 'TRACK RECORD',
    description: 'Referencia externa verificable (Bitget), ranking y enlace.',
    kind: 'custom',
  },
  {
    key: 'seguridad',
    label: 'SEGURIDAD',
    description: 'Control del capital y de la conexión API.',
    kind: 'content',
    section: 'seguridad',
    fields: [
      { key: 'kicker', label: 'Etiqueta', fallback: 'CONTROL' },
      { key: 'h2_line1', label: 'Título — línea 1', fallback: 'Tu cuenta.' },
      { key: 'h2_line2', label: 'Título — línea 2 (resaltada)', fallback: 'Tu capital. Tu control.' },
    ],
    PreviewComponent: SeguridadSection,
  },
  {
    key: 'sobre_qlc',
    label: 'SOBRE QLC',
    description: 'Naturaleza y descripción institucional de QLC.',
    kind: 'content',
    section: 'sobre_qlc',
    fields: [
      { key: 'intro', label: 'Frase institucional', type: 'textarea', fallback: '' },
      { key: 'body_1', label: 'Párrafo 1', type: 'textarea', fallback: '' },
      { key: 'body_2', label: 'Párrafo 2', type: 'textarea', fallback: '' },
      { key: 'body_3', label: 'Párrafo 3 (destacado)', type: 'textarea', fallback: '' },
    ],
    PreviewComponent: SobreQlcSection,
  },
  {
    key: 'faq',
    label: 'FAQ',
    description: 'Preguntas frecuentes — crear, editar, eliminar y reordenar.',
    kind: 'custom',
  },
  {
    key: 'contacto',
    label: 'CONTACTO',
    description: 'Título, subtítulo y llamada a la acción de registro.',
    kind: 'content',
    section: 'contacto',
    fields: [
      { key: 'kicker', label: 'Etiqueta', fallback: 'QUANTUM LIQUIDITY CAPITAL' },
      { key: 'title', label: 'Título', fallback: 'COPYTRADING INSTITUCIONAL.' },
      { key: 'sub', label: 'Subtítulo', type: 'textarea', fallback: '' },
    ],
    PreviewComponent: ContactoSection,
  },
  {
    key: 'footer',
    label: 'FOOTER',
    description: 'Tagline y aviso de riesgo / disclaimer.',
    kind: 'content',
    section: 'footer',
    fields: [
      { key: 'tagline', label: 'Tagline', fallback: '' },
      { key: 'disclaimer', label: 'Disclaimer de riesgo', type: 'textarea', rows: 4, fallback: '' },
    ],
    PreviewComponent: PublicFooter,
  },
];

export default function CmsPage() {
  const [content, setContent] = useState({});
  const [trackRecord, setTrackRecord] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [customModal, setCustomModal] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/admin/content').then(({ data }) => {
      const bySection = {};
      data.content.forEach((row) => {
        bySection[row.section] = bySection[row.section] || {};
        bySection[row.section][row.key] = row.value;
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
    setMessage('✓ Cambios guardados correctamente.');
    setTimeout(() => setMessage(''), 3500);
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">CONTENIDO DEL SITIO</div>
      <h1 style={{ marginTop: 0 }}>Editor de la página pública</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>
        Cada tarjeta corresponde a una sección real de la página pública. Los cambios que guardes
        aquí se publican de inmediato — no necesitas tocar código.
      </p>

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
              Editar
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
        <Modal title="Modelos de participación" onClose={() => setCustomModal(null)} width={960}>
          <ModelsPage />
        </Modal>
      )}
      {customModal === 'track_record' && (
        <Modal title="Track Record" onClose={() => setCustomModal(null)} width={640}>
          <TrackRecordPage />
        </Modal>
      )}
      {customModal === 'faq' && (
        <Modal title="Preguntas frecuentes" onClose={() => setCustomModal(null)} width={720}>
          <FaqPage />
        </Modal>
      )}
      {customModal === 'multimedia' && (
        <Modal title="Multimedia" onClose={() => setCustomModal(null)} width={960}>
          <MediaLibraryPage />
        </Modal>
      )}
    </div>
  );
}

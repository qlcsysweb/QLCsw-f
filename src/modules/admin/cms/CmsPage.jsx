import { useState } from 'react';
import Modal from '../../../components/Modal';
import ModelsPage from '../ModelsPage';
import FaqPage from '../FaqPage';
import TrackRecordPage from '../TrackRecordPage';
import MediaLibraryPage from './MediaLibraryPage';
import { useLanguage } from '../../../i18n/LanguageContext';

// Contenido del sitio público. Los TEXTOS de las secciones (en español e
// inglés, incluidos los documentos legales) ya no se editan aquí: viven en el
// código (frontend/src/content/publicContent.js), así el sitio público no
// consulta NeonDB para mostrarlos. Aquí quedan los datos que QLC actualiza
// con frecuencia: multimedia, modelos, track record y FAQ.
export default function CmsPage() {
  const { t } = useLanguage();
  const [customModal, setCustomModal] = useState(null);

  const SECTIONS = [
    { key: 'multimedia', label: t('adminCms.multimediaLabel'), description: t('adminCms.multimediaDesc') },
    { key: 'modelos', label: t('adminCms.modelosLabel'), description: t('adminCms.modelosDesc') },
    { key: 'track_record', label: t('adminCms.trackRecordLabel'), description: t('adminCms.trackRecordDesc') },
    { key: 'faq', label: t('adminCms.faqLabel'), description: t('adminCms.faqDesc') },
  ];

  return (
    <div>
      <div className="qlc-kicker">{t('adminCms.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminCms.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('adminCms.intro')}</p>
      <div className="qlc-card" style={{ borderColor: 'var(--qlc-line)', marginBottom: 16, maxWidth: 760 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--qlc-muted)', lineHeight: 1.6 }}>{t('adminCms.textsInCodeNotice')}</p>
      </div>

      <div className="qlc-detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {SECTIONS.map((s) => (
          <div className="qlc-card" key={s.key}>
            <div className="qlc-kicker">{s.label}</div>
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)', minHeight: 40 }}>{s.description}</p>
            <button className="qlc-btn primary" style={{ width: '100%' }} onClick={() => setCustomModal(s.key)}>
              {t('adminCms.edit')}
            </button>
          </div>
        ))}
      </div>

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

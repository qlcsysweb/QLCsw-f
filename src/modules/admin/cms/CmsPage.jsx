import { useState } from 'react';
import Modal from '../../../components/Modal';
import TrackRecordPage from '../TrackRecordPage';
import MediaLibraryPage from './MediaLibraryPage';
import { useLanguage } from '../../../i18n/LanguageContext';

// Contenido del sitio público. Los TEXTOS de las secciones (en español e
// inglés, incluidos los documentos legales) ya no se editan aquí: viven en el
// código (frontend/src/content/), igual que las preguntas frecuentes y los
// textos del modelo de participación y de Resultados: la página pública no
// consulta NeonDB. Aquí quedan la multimedia (logos ES/EN) y las cifras del
// perfil de Bitget, que se publican en site-data.json (Cloudinary).
export default function CmsPage() {
  const { t } = useLanguage();
  const [customModal, setCustomModal] = useState(null);

  const SECTIONS = [
    { key: 'multimedia', label: t('adminCms.multimediaLabel'), description: t('adminCms.multimediaDesc') },
    { key: 'track_record', label: t('adminCms.trackRecordLabel'), description: t('adminCms.trackRecordDesc') },
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

      {customModal === 'track_record' && (
        <Modal title={t('adminCms.trackRecordLabel')} onClose={() => setCustomModal(null)} width={640}>
          <TrackRecordPage />
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

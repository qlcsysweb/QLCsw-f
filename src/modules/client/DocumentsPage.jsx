import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDateTime } from '../../utils/cdmxTime';
import './DocumentsPage.css';

// La categoría real del documento principal que se solicita al cliente.
const IDENTITY_CATEGORY = 'identificacion';

/*
 * DOCUMENTOS — hoy solo se solicita un documento: el DOCUMENTO DE IDENTIDAD.
 * Estados reales del flujo (nada inventado):
 *   - NO ENVIADO      → todavía no existe un documento activo.
 *   - ENVIADO + 🔒    → ya enviado; bloqueado por defecto (el cliente no puede
 *                       borrarlo ni reemplazarlo).
 *   - CORRECCIÓN HABILITADA → un ADMIN desbloqueó ESE documento; el cliente
 *                       puede seleccionar el archivo correcto y pulsar
 *                       "Enviar archivo corregido" (reemplazo atómico en backend).
 * Todas las reglas se hacen cumplir en el backend, no en esta pantalla.
 */
export default function DocumentsPage() {
  const { t, language } = useLanguage();
  const [documents, setDocuments] = useState(null);
  const [file, setFile] = useState(null);
  const [correctionFile, setCorrectionFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  const load = () => api.get('/client/documents').then(({ data }) => setDocuments(data.documents));
  useEffect(() => {
    load();
  }, []);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  if (!documents) return <div className="qlc-empty">{t('common.loading')}</div>;

  const identity = documents.find((d) => d.category === IDENTITY_CATEGORY) || null;
  const otherDocuments = documents.filter((d) => d.category !== IDENTITY_CATEGORY);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', IDENTITY_CATEGORY);
    try {
      await api.post('/client/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      flash(t('clientDocuments.sentOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setBusy(false);
    }
  };

  const submitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionFile || !identity) return;
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('file', correctionFile);
    try {
      await api.post(`/client/documents/${identity.id}/correction`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCorrectionFile(null);
      flash(t('clientDocuments.correctionSentOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setBusy(false);
    }
  };

  const removeDocument = async (docId) => {
    await api.delete(`/client/documents/${docId}`);
    flash(t('clientDocuments.deletedOk'));
    load();
  };

  const unlocked = Boolean(identity?.clientEditUnlocked);

  return (
    <div>
      <div className="qlc-kicker">{t('clientDocuments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientDocuments.title')}</h1>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <section className="qlc-card qlc-id-card">
        <div className="qlc-id-card-head">
          <div>
            <div className="qlc-id-card-kicker">{t('clientDocuments.identityKicker')}</div>
            <h3 className="qlc-id-card-title">{t('clientDocuments.identityTitle')}</h3>
            <p className="qlc-id-card-sub">{t('clientDocuments.identitySubtitle')}</p>
          </div>
          <div className="qlc-id-card-badges">
            {!identity && <span className="qlc-badge muted">{t('clientDocuments.stateNotSent')}</span>}
            {identity && <span className="qlc-badge ok">{t('clientDocuments.stateSent')}</span>}
            {identity && !unlocked && <span className="qlc-badge muted">{t('clientDocuments.locked')}</span>}
            {identity && unlocked && <span className="qlc-badge warn">{t('clientDocuments.correctionEnabled')}</span>}
          </div>
        </div>

        {identity ? (
          <div className="qlc-id-card-body">
            <div className="qlc-id-card-icon" aria-hidden="true">🪪</div>
            <div className="qlc-id-card-info">
              <strong>{t('clientDocuments.identityName')}</strong>
              <span>{identity.fileName}</span>
              <span>
                {t('clientDocuments.uploadedAt')}: {formatCdmxDateTime(identity.createdAt)}
              </span>
            </div>
            <button type="button" className="qlc-btn ghost" onClick={() => setViewingDocument(identity)}>
              👁 {t('clientDocuments.viewDocument')}
            </button>
          </div>
        ) : (
          <form className="qlc-id-card-form" onSubmit={submit}>
            <p className="qlc-id-card-hint">{t('clientDocuments.fileHint')}</p>
            <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
            <button className="qlc-btn primary" disabled={!file || busy}>
              {busy ? t('clientDocuments.uploading') : t('clientDocuments.sendDocument')}
            </button>
          </form>
        )}

        {identity && !unlocked && <p className="qlc-id-card-hint">{t('clientDocuments.lockedNotice')}</p>}

        {identity && unlocked && (
          <form className="qlc-id-card-form" onSubmit={submitCorrection}>
            <p className="qlc-id-card-hint">{t('clientDocuments.correctionIntro')}</p>
            <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={(e) => setCorrectionFile(e.target.files[0] || null)} />
            <div className="qlc-id-card-actions">
              <button className="qlc-btn primary" disabled={!correctionFile || busy}>
                {busy ? t('clientDocuments.correctionSubmitting') : t('clientDocuments.correctionSubmit')}
              </button>
              <button type="button" className="qlc-btn ghost" onClick={() => setConfirmDelete(identity)} disabled={busy}>
                {t('clientDocuments.delete')}
              </button>
            </div>
          </form>
        )}
      </section>

      {otherDocuments.length > 0 && (
        <section className="qlc-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('clientDocuments.otherDocuments')}</h3>
          <ul className="qlc-plain-list">
            {otherDocuments.map((d) => (
              <li key={d.id} className="qlc-doc-card">
                <div className="qlc-doc-card-info">
                  <span className="qlc-doc-card-name">{d.fileName}</span>
                  <button type="button" className="qlc-btn ghost" onClick={() => setViewingDocument(d)}>
                    {t('clientDocuments.view')}
                  </button>
                  <span className="qlc-badge ok">{t('clientDocuments.stateSent')}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {viewingDocument && (
        <DocumentViewerModal
          url={`/client/documents/${viewingDocument.id}/download`}
          fileName={viewingDocument.fileName}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={t('clientDocuments.deleteTitle')}
          message={t('clientDocuments.deleteMessage')}
          confirmLabel={t('clientDocuments.delete')}
          twoStep
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => removeDocument(confirmDelete.id)}
        />
      )}
    </div>
  );
}

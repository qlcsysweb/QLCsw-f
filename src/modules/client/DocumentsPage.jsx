import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// Formulario de "archivo corregido" — solo aparece cuando el admin habilitó
// la corrección de ESTE documento puntual (clientEditUnlocked=true). El
// archivo se guarda en estado local propio hasta que el cliente pulsa el
// botón explícito "Enviar archivo corregido": elegir el archivo por sí solo
// nunca envía nada.
function DocumentCorrectionForm({ onSubmit, submitting, t }) {
  const [file, setFile] = useState(null);
  return (
    <form
      className="qlc-doc-correction-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) return;
        onSubmit(file);
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', margin: '2px 0 8px' }}>{t('clientDocuments.correctionIntro')}</p>
      <input
        type="file"
        accept=".pdf,image/*"
        className="qlc-input"
        onChange={(e) => setFile(e.target.files[0] || null)}
      />
      <button className="qlc-btn primary" style={{ marginTop: 8 }} disabled={!file || submitting}>
        {submitting ? t('clientDocuments.correctionSubmitting') : t('clientDocuments.correctionSubmit')}
      </button>
    </form>
  );
}

export default function DocumentsPage() {
  const { t, language } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({ category: 'identificacion', description: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [correctingId, setCorrectingId] = useState(null);

  const CATEGORIES = [
    { value: 'identificacion', label: t('clientDocuments.categoryId') },
    { value: 'otro', label: t('clientDocuments.categoryOther') },
  ];

  const load = () => api.get('/client/documents').then(({ data }) => setDocuments(data.documents));
  useEffect(() => {
    load();
  }, []);

  const takenCategories = new Set(documents.map((d) => d.category));
  const availableCategories = CATEGORIES.filter((c) => !takenCategories.has(c.value));

  const upload = async (e) => {
    e.preventDefault();
    const file = e.target.elements.docFile.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', form.category);
    fd.append('description', form.description);
    try {
      await api.post('/client/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(t('clientDocuments.sentOk'));
      setTimeout(() => setMessage(''), 4000);
      e.target.reset();
      setForm((f) => ({ ...f, description: '' }));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (docId) => {
    await api.delete(`/client/documents/${docId}`);
    setMessage(t('clientDocuments.deletedOk'));
    setTimeout(() => setMessage(''), 4000);
    load();
  };

  // "Enviar archivo corregido" — un solo paso atómico en el backend
  // (correctDocument): sube el nuevo archivo, actualiza la metadata del
  // MISMO documento y solo entonces borra el archivo anterior en Drive.
  // Nunca queda un estado intermedio sin documento válido.
  const submitCorrection = async (doc, file) => {
    setCorrectingId(doc.id);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/client/documents/${doc.id}/correction`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(t('clientDocuments.correctionSentOk'));
      setTimeout(() => setMessage(''), 4000);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setCorrectingId(null);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientDocuments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientDocuments.title')}</h1>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <div className="qlc-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>
          {t('clientDocuments.sentDocuments')} ({documents.length})
        </h3>
        {documents.length === 0 ? (
          <div className="qlc-empty">{t('clientDocuments.noneSent')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {documents.map((d) => (
              <li key={d.id} className="qlc-doc-card">
                <div className="qlc-doc-card-info">
                  <span className="qlc-doc-card-name">{CATEGORIES.find((c) => c.value === d.category)?.label || d.category}</span>
                  <button
                    type="button"
                    onClick={() => setViewingDocument(d)}
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontSize: 12, color: 'var(--qlc-blue2)', cursor: 'pointer' }}
                  >
                    {t('clientDocuments.view')}
                  </button>
                  <span className="qlc-badge ok">{t('clientDocuments.sent')}</span>
                  {d.clientEditUnlocked && <span className="qlc-badge warn">{t('clientDocuments.correctionEnabled')}</span>}
                </div>
                <div className="qlc-doc-card-actions">
                  {d.clientEditUnlocked ? (
                    <button className="qlc-btn ghost" onClick={() => setConfirmDelete(d)}>
                      {t('clientDocuments.delete')}
                    </button>
                  ) : (
                    <span className="qlc-badge muted" title={t('clientDocuments.lockedNotice')}>
                      {t('clientDocuments.locked')}
                    </span>
                  )}
                </div>
                {d.clientEditUnlocked && (
                  <DocumentCorrectionForm t={t} submitting={correctingId === d.id} onSubmit={(file) => submitCorrection(d, file)} />
                )}
              </li>
            ))}
          </ul>
        )}
        {documents.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 12, marginBottom: 0 }}>
            {t('clientDocuments.lockedNotice')}
          </p>
        )}
      </div>

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

      {availableCategories.length > 0 ? (
        <form className="qlc-card" style={{ maxWidth: 480 }} onSubmit={upload}>
          <h3 style={{ marginTop: 0 }}>{t('clientDocuments.uploadTitle')}</h3>
          <label className="qlc-label">{t('clientDocuments.category')}</label>
          <select
            className="qlc-select"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {availableCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <label className="qlc-label">{t('clientDocuments.description')}</label>
          <input className="qlc-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <label className="qlc-label">{t('clientDocuments.file')}</label>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -4 }}>{t('clientDocuments.fileHint')}</p>
          <input type="file" name="docFile" className="qlc-input" accept=".pdf,image/*" required />
          <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={uploading}>
            {uploading ? t('clientDocuments.uploading') : t('clientDocuments.uploadDocument')}
          </button>
        </form>
      ) : (
        <div className="qlc-empty">{t('clientDocuments.allCategoriesSent')}</div>
      )}
    </div>
  );
}

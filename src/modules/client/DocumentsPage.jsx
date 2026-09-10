import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function DocumentsPage() {
  const { t, language } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({ category: 'identificacion', description: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const CATEGORIES = [
    { value: 'identificacion', label: t('clientDocuments.categoryId') },
    { value: 'comprobante_domicilio', label: t('clientDocuments.categoryAddress') },
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
              <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {CATEGORIES.find((c) => c.value === d.category)?.label || d.category}
                  <span style={{ color: 'var(--qlc-muted2)', marginLeft: 8, fontSize: 12 }}>
                    <a href={`${API_BASE_URL}/client/documents/${d.id}/download`} target="_blank" rel="noreferrer">
                      {t('clientDocuments.view')}
                    </a>
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="qlc-badge ok">{t('clientDocuments.sent')}</span>
                  {d.clientEditUnlocked ? (
                    <button className="qlc-btn ghost" onClick={() => setConfirmDelete(d)}>
                      {t('clientDocuments.delete')}
                    </button>
                  ) : (
                    <span className="qlc-badge muted" title={t('clientDocuments.lockedNotice')}>
                      {t('clientDocuments.locked')}
                    </span>
                  )}
                </span>
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

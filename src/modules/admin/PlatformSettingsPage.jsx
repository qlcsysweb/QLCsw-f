import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// CORRECCIÓN 4 / REVERSIÓN B: el antiguo "PDF informativo" (adjunto
// automático al correo de bienvenida de un prospecto) fue eliminado por
// completo — no debe reintroducirse aquí ni en ningún otro lugar.
//
// CORRECCIÓN 27: en su lugar, esta página administra las DOS guías de uso
// (ADMIN / CLIENTE) — los únicos PDFs almacenados en Cloudinary.
function GuideCard({ role, settings, t, onUploaded, onDeleted }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { language } = useLanguage();

  const urlKey = role === 'ADMIN' ? 'adminGuidePdfUrl' : 'clientGuidePdfUrl';
  const nameKey = role === 'ADMIN' ? 'adminGuideFileName' : 'clientGuideFileName';
  const fileName = settings[nameKey];

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post(`/admin/platform-settings/guide/${role.toLowerCase()}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(data.settings);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = async () => {
    const { data } = await api.delete(`/admin/platform-settings/guide/${role.toLowerCase()}`);
    onDeleted(data.settings);
  };

  return (
    <div className="qlc-card">
      <h3 style={{ marginTop: 0 }}>
        {role === 'ADMIN' ? t('adminPlatformSettings.adminGuideTitle') : t('adminPlatformSettings.clientGuideTitle')}
      </h3>
      {error && <div className="qlc-field-error">{error}</div>}
      {fileName ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 13 }}>{fileName}</span>
          <button className="qlc-btn ghost" onClick={() => setConfirmDelete(true)}>
            {t('common.delete')}
          </button>
        </div>
      ) : (
        <div className="qlc-empty" style={{ marginBottom: 14 }}>
          {t('adminPlatformSettings.noGuide')}
        </div>
      )}
      <label className="qlc-label">{fileName ? t('adminPlatformSettings.replaceGuide') : t('adminPlatformSettings.uploadGuide')}</label>
      <input type="file" className="qlc-input" accept="application/pdf" onChange={upload} disabled={uploading} />
      {uploading && <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminPlatformSettings.uploading')}</p>}

      {confirmDelete && (
        <ConfirmModal
          title={t('adminPlatformSettings.deleteGuideTitle')}
          message={t('adminPlatformSettings.deleteGuideMessage')}
          confirmLabel={t('common.delete')}
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

export default function PlatformSettingsPage() {
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [urlForm, setUrlForm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api.get('/admin/platform-settings').then(({ data }) => {
      setSettings(data.settings);
      setUrlForm(data.settings.externalPlatformUrl || '');
    });
  useEffect(() => {
    load();
  }, []);

  if (!settings) return <div className="qlc-empty">{t('adminPlatformSettings.loading')}</div>;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const saveUrl = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/admin/platform-settings', { externalPlatformUrl: urlForm });
      setSettings(data.settings);
      flash(t('adminPlatformSettings.urlSaved'));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminPlatformSettings.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminPlatformSettings.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('adminPlatformSettings.intro')}</p>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <div className="qlc-detail-grid">
        <form className="qlc-card" onSubmit={saveUrl}>
          <h3 style={{ marginTop: 0 }}>{t('adminPlatformSettings.linkTitle')}</h3>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminPlatformSettings.linkHint')}</p>
          <label className="qlc-label">{t('adminPlatformSettings.linkLabel')}</label>
          <input
            className="qlc-input"
            type="url"
            value={urlForm}
            onChange={(e) => setUrlForm(e.target.value)}
            placeholder="https://…"
          />
          <button className="qlc-btn primary" style={{ marginTop: 14, width: '100%' }} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>

        <GuideCard role="ADMIN" settings={settings} t={t} onUploaded={setSettings} onDeleted={setSettings} />
        <GuideCard role="CLIENT" settings={settings} t={t} onUploaded={setSettings} onDeleted={setSettings} />
      </div>
    </div>
  );
}

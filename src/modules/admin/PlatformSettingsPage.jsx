import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function PlatformSettingsPage() {
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [urlForm, setUrlForm] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmDeletePdf, setConfirmDeletePdf] = useState(false);

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

  const uploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/admin/platform-settings/info-pdf', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings(data.settings);
      flash(t('adminPlatformSettings.pdfUploaded'));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deletePdf = async () => {
    const { data } = await api.delete('/admin/platform-settings/info-pdf');
    setSettings(data.settings);
    flash(t('adminPlatformSettings.pdfDeleted'));
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

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminPlatformSettings.pdfTitle')}</h3>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminPlatformSettings.pdfHint')}</p>
          {settings.infoPdfFileName ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13 }}>{settings.infoPdfFileName}</span>
              <button className="qlc-btn ghost" onClick={() => setConfirmDeletePdf(true)}>
                {t('common.delete')}
              </button>
            </div>
          ) : (
            <div className="qlc-empty" style={{ marginBottom: 14 }}>
              {t('adminPlatformSettings.noPdf')}
            </div>
          )}
          <label className="qlc-label">
            {settings.infoPdfFileName ? t('adminPlatformSettings.replacePdf') : t('adminPlatformSettings.uploadPdf')}
          </label>
          <input type="file" className="qlc-input" accept="application/pdf" onChange={uploadPdf} disabled={uploading} />
          {uploading && <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminPlatformSettings.uploading')}</p>}
        </div>
      </div>

      {confirmDeletePdf && (
        <ConfirmModal
          title={t('adminPlatformSettings.deletePdfTitle')}
          message={t('adminPlatformSettings.deletePdfMessage')}
          confirmLabel={t('common.delete')}
          onClose={() => setConfirmDeletePdf(false)}
          onConfirm={deletePdf}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../../services/api';
import ConfirmModal from '../../../components/ConfirmModal';
import { useLanguage } from '../../../i18n/LanguageContext';
import { translateBackendMessage } from '../../../i18n/backendMessages';

export default function GoogleDriveSettingsPage() {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ rootFolderId: '', rootFolderName: '' });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  const CAPABILITY_LABELS = {
    canCreate: t('adminDrive.capCreate'),
    canUpload: t('adminDrive.capUpload'),
    canDownload: t('adminDrive.capDownload'),
    canDelete: t('adminDrive.capDelete'),
  };

  const load = () =>
    api.get('/admin/drive-config').then(({ data }) => {
      setConfig(data.config);
      setForm({
        rootFolderId: data.config.rootFolderId || '',
        rootFolderName: data.config.rootFolderName || 'QLC',
      });
    });
  useEffect(() => {
    load();
  }, []);

  if (!config) return <div className="qlc-empty">{t('adminDrive.loadingConfig')}</div>;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/admin/drive-config', {
        rootFolderId: form.rootFolderId,
        rootFolderName: form.rootFolderName,
        isEnabled: true,
      });
      setConfig(data.config);
      flash(t('adminDrive.saved'));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const { data } = await api.post('/admin/drive-config/test');
      setConfig(data.config);
      setTestResult(data);
      if (!data.ok) setError(translateBackendMessage(data.message, language));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    const { data } = await api.post('/admin/drive-config/disconnect');
    setConfig(data.config);
    setTestResult(null);
    flash(t('adminDrive.disconnectedNotice'));
  };

  const statusLabel = config.isConnected
    ? { text: t('adminDrive.connected'), className: 'ok', dot: '●' }
    : config.hasServiceAccountCreds
    ? { text: t('adminDrive.disconnected'), className: 'danger', dot: '×' }
    : { text: t('adminDrive.notConfigured'), className: 'muted', dot: '—' };

  return (
    <div>
      <div className="qlc-kicker">{t('adminDrive.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminDrive.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('adminDrive.intro')}</p>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-card" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className={`qlc-badge ${statusLabel.className}`} style={{ fontSize: 12, padding: '8px 14px' }}>
            {statusLabel.dot} {statusLabel.text}
          </span>
        </div>

        {!config.hasServiceAccountCreds && (
          <div className="qlc-card" style={{ borderColor: 'var(--qlc-warn-border)', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13 }}>{t('adminDrive.noCredsNotice')}</p>
          </div>
        )}

        {config.hasServiceAccountCreds && (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -10, marginBottom: 20 }}>
            {t('adminDrive.technicalAccountConfigured')}: {config.serviceAccountEmailMasked}
          </p>
        )}

        <form onSubmit={save}>
          <label className="qlc-label">{t('adminDrive.folderNameLabel')}</label>
          <input
            className="qlc-input"
            value={form.rootFolderName}
            onChange={(e) => setForm((f) => ({ ...f, rootFolderName: e.target.value }))}
            placeholder="QLC"
          />

          <label className="qlc-label">{t('adminDrive.folderIdLabel')}</label>
          <input
            className="qlc-input"
            value={form.rootFolderId}
            onChange={(e) => setForm((f) => ({ ...f, rootFolderId: e.target.value }))}
            placeholder="Ej: 1AbCdEfGhIjKlMnOpQrStUvWxYz"
          />
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>
            {t('adminDrive.folderIdHint')}
            {config.usingBootstrapFolder && t('adminDrive.usingBootstrapFolder')}
          </p>

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={testConnection} disabled={testing}>
              {testing ? t('adminDrive.testing') : t('adminDrive.testConnection')}
            </button>
            <button className="qlc-btn primary" disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>

        {testResult?.ok && (
          <div className="qlc-card" style={{ marginTop: 18, borderColor: 'var(--qlc-ok-border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13 }}>
              {t('adminDrive.connectedOk')} "{testResult.folderName}".
            </p>
            {testResult.capabilities &&
              Object.entries(CAPABILITY_LABELS).map(([key, label]) => (
                <div key={key} style={{ fontSize: 13, marginBottom: 4 }}>
                  {testResult.capabilities[key] ? '✓' : '×'} {label}
                </div>
              ))}
          </div>
        )}

        {config.lastTestedAt && !testResult && (
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 14 }}>
            {t('adminDrive.lastTest')}: {new Date(config.lastTestedAt).toLocaleString()} —{' '}
            {config.lastTestStatus === 'OK' ? t('adminDrive.correct') : '! ' + translateBackendMessage(config.lastTestMessage, language)}
          </p>
        )}

        {config.isConnected && (
          <div className="qlc-form-actions" style={{ marginTop: 20, borderTop: '1px solid var(--qlc-line)', paddingTop: 16 }}>
            <button className="qlc-btn danger" onClick={() => setConfirmingDisconnect(true)}>
              {t('adminDrive.disconnect')}
            </button>
          </div>
        )}
      </div>

      {confirmingDisconnect && (
        <ConfirmModal
          title={t('adminDrive.disconnectTitle')}
          message={t('adminDrive.disconnectMessage')}
          confirmLabel={t('adminDrive.disconnect')}
          onClose={() => setConfirmingDisconnect(false)}
          onConfirm={disconnect}
        />
      )}
    </div>
  );
}

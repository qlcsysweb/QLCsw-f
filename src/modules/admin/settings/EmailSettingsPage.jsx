import { useEffect, useState } from 'react';
import api from '../../../services/api';
import ConfirmModal from '../../../components/ConfirmModal';
import { useLanguage } from '../../../i18n/LanguageContext';
import { translateBackendMessage } from '../../../i18n/backendMessages';

// AUDITORÍA QLC PARTE 13 — configuración de correo (Gmail) administrable
// desde el panel, mismo patrón que Configuración → Google Drive.
export default function EmailSettingsPage() {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ gmailUser: '', gmailSenderName: '', gmailAppPassword: '' });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [confirmingTest, setConfirmingTest] = useState(false);

  const load = () =>
    api.get('/admin/email-config').then(({ data }) => {
      setConfig(data.config);
      setForm((f) => ({ ...f, gmailSenderName: data.config.gmailSenderName || '' }));
    });
  useEffect(() => {
    load();
  }, []);

  if (!config) return <div className="qlc-empty">{t('adminEmail.loadingConfig')}</div>;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { gmailSenderName: form.gmailSenderName };
      if (form.gmailUser) payload.gmailUser = form.gmailUser;
      if (form.gmailAppPassword) payload.gmailAppPassword = form.gmailAppPassword;
      const { data } = await api.put('/admin/email-config', payload);
      setConfig(data.config);
      setForm({ gmailUser: '', gmailSenderName: data.config.gmailSenderName || '', gmailAppPassword: '' });
      flash(t('adminEmail.saved'));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  // AUDITORÍA QLC PARTE 13 — esto SÍ envía un correo real (a la propia
  // cuenta configurada). Se pide confirmación explícita antes de disparar.
  const testConnection = async () => {
    setConfirmingTest(false);
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const { data } = await api.post('/admin/email-config/test');
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
    const { data } = await api.post('/admin/email-config/disconnect');
    setConfig(data.config);
    setTestResult(null);
    flash(t('adminEmail.disconnectedNotice'));
  };

  const statusLabel = config.isConnected
    ? { text: t('adminEmail.connected'), className: 'ok', dot: '●' }
    : config.hasCredentials
    ? { text: t('adminEmail.disconnected'), className: 'danger', dot: '×' }
    : { text: t('adminEmail.notConfigured'), className: 'muted', dot: '—' };

  return (
    <div>
      <div className="qlc-kicker">{t('adminEmail.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminEmail.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('adminEmail.intro')}</p>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-card" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className={`qlc-badge ${statusLabel.className}`} style={{ fontSize: 12, padding: '8px 14px' }}>
            {statusLabel.dot} {statusLabel.text}
          </span>
        </div>

        {config.isLockedByAnother && (
          <div className="qlc-card" style={{ borderColor: 'var(--qlc-warn-border)', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13 }}>{t('adminEmail.lockedByAnotherNotice')}</p>
          </div>
        )}

        {!config.hasCredentials && (
          <div className="qlc-card" style={{ borderColor: 'var(--qlc-warn-border)', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13 }}>{t('adminEmail.noCredsNotice')}</p>
          </div>
        )}

        {config.hasCredentials && (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -10, marginBottom: 20 }}>
            {t('adminEmail.accountConfigured')}: {config.gmailUserMasked}
            {' · '}
            {config.hasOwnCredentials ? t('adminEmail.credsSourcePanel') : t('adminEmail.credsSourceEnv')}
          </p>
        )}

        <form onSubmit={save}>
          <h3 style={{ fontSize: 14, marginTop: 0 }}>{t('adminEmail.credentialsTitle')}</h3>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -6 }}>{t('adminEmail.credentialsHint')}</p>
          <label className="qlc-label">{t('adminEmail.providerLabel')}</label>
          <input className="qlc-input" value="Gmail" disabled />
          <label className="qlc-label">{t('adminEmail.gmailUserLabel')}</label>
          <input
            className="qlc-input"
            type="email"
            value={form.gmailUser}
            onChange={(e) => setForm((f) => ({ ...f, gmailUser: e.target.value }))}
            placeholder={config.gmailUserMasked || 'correo@qlc.net'}
            disabled={config.isLockedByAnother}
          />
          <label className="qlc-label">{t('adminEmail.senderNameLabel')}</label>
          <input
            className="qlc-input"
            value={form.gmailSenderName}
            onChange={(e) => setForm((f) => ({ ...f, gmailSenderName: e.target.value }))}
            placeholder="Quantum Liquidity Capital (QLC)"
            disabled={config.isLockedByAnother}
          />
          <label className="qlc-label">{t('adminEmail.appPasswordLabel')}</label>
          <input
            className="qlc-input"
            type="password"
            value={form.gmailAppPassword}
            onChange={(e) => setForm((f) => ({ ...f, gmailAppPassword: e.target.value }))}
            placeholder={config.hasOwnCredentials ? '•••••••••••••••• (configurada)' : 'xxxx xxxx xxxx xxxx'}
            disabled={config.isLockedByAnother}
          />
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -4, marginBottom: 14 }}>{t('adminEmail.appPasswordHint')}</p>

          <div style={{ fontSize: 11, color: 'var(--qlc-muted2)', border: '1px solid var(--qlc-line)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            {t('adminEmail.smtpInfoTitle')}: {config.smtpHost}:{config.smtpPort} ({config.smtpSecurity}) — {t('adminEmail.smtpInfoFixed')}
          </div>

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={() => setConfirmingTest(true)} disabled={testing}>
              {testing ? t('adminEmail.testing') : t('adminEmail.testConnection')}
            </button>
            <button className="qlc-btn primary" disabled={saving || config.isLockedByAnother}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>

        {testResult && (
          <div className="qlc-card" style={{ marginTop: 18, borderColor: testResult.ok ? 'var(--qlc-ok-border)' : 'var(--qlc-danger-border)' }}>
            <p style={{ margin: 0, fontSize: 13 }}>{testResult.message}</p>
          </div>
        )}

        {config.lastTestedAt && !testResult && (
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 14 }}>
            {t('adminEmail.lastTest')}: {new Date(config.lastTestedAt).toLocaleString()} —{' '}
            {config.lastTestStatus === 'OK' ? t('adminEmail.correct') : '! ' + translateBackendMessage(config.lastTestMessage, language)}
          </p>
        )}

        {config.isConnected && !config.isLockedByAnother && (
          <div className="qlc-form-actions" style={{ marginTop: 20, borderTop: '1px solid var(--qlc-line)', paddingTop: 16 }}>
            <button className="qlc-btn danger" onClick={() => setConfirmingDisconnect(true)}>
              {t('adminEmail.disconnect')}
            </button>
          </div>
        )}
      </div>

      {confirmingDisconnect && (
        <ConfirmModal
          title={t('adminEmail.disconnectTitle')}
          message={t('adminEmail.disconnectMessage')}
          confirmLabel={t('adminEmail.disconnect')}
          onClose={() => setConfirmingDisconnect(false)}
          onConfirm={disconnect}
        />
      )}

      {confirmingTest && (
        <ConfirmModal
          title={t('adminEmail.testTitle')}
          message={t('adminEmail.testConfirmMessage')}
          confirmLabel={t('adminEmail.testConnection')}
          onClose={() => setConfirmingTest(false)}
          onConfirm={testConnection}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../../services/api';
import ConfirmModal from '../../../components/ConfirmModal';
import { useLanguage } from '../../../i18n/LanguageContext';
import { translateBackendMessage } from '../../../i18n/backendMessages';

// AUDITORÍA QLC PARTE 13 — configuración de correo (Gmail) administrable
// desde el panel, mismo patrón que Configuración → Google Drive.
//
// CORRECCIÓN Render free tier — Render bloquea de forma permanente los
// puertos SMTP salientes (25/465/587), así que se agrega un segundo método
// de envío, Gmail API vía OAuth2 (HTTPS, nunca bloqueado). El admin elige
// cuál método usar; ambos comparten el mismo botón "Enviar correo de
// prueba".
const OAUTH_CALLBACK_PATH = '/api/email-config/oauth/callback';

function backendPublicUrlGuess() {
  // Best-effort solo para mostrar en la guía "URI de redirección" — el valor
  // real que Google usará es el que el backend arma con BACKEND_PUBLIC_URL.
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '');
  }
}

export default function EmailSettingsPage() {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    gmailUser: '',
    gmailSenderName: '',
    gmailAppPassword: '',
    googleClientId: '',
    googleClientSecret: '',
  });
  const [method, setMethod] = useState('APP_PASSWORD');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [confirmingTest, setConfirmingTest] = useState(false);

  const load = () =>
    api.get('/admin/email-config').then(({ data }) => {
      setConfig(data.config);
      setMethod(data.config.authMethod || 'APP_PASSWORD');
      setForm((f) => ({ ...f, gmailSenderName: data.config.gmailSenderName || '' }));
    });

  useEffect(() => {
    load();
  }, []);

  // Al volver de Google (redirección real del navegador, no un XHR), el
  // backend agrega ?oauth=success|error&... a esta misma URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    if (!oauth) return;
    if (oauth === 'success') {
      flash(t('adminEmail.oauthSuccessNotice'));
      load();
    } else if (oauth === 'error') {
      setError(params.get('reason') || 'No se pudo conectar con Google.');
    }
    params.delete('oauth');
    params.delete('reason');
    params.delete('email');
    const cleanQuery = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (cleanQuery ? `?${cleanQuery}` : ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!config) return <div className="qlc-empty">{t('adminEmail.loadingConfig')}</div>;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { gmailSenderName: form.gmailSenderName, authMethod: method };
      if (form.gmailUser) payload.gmailUser = form.gmailUser;
      if (method === 'APP_PASSWORD' && form.gmailAppPassword) payload.gmailAppPassword = form.gmailAppPassword;
      if (method === 'OAUTH2' && form.googleClientId) payload.googleClientId = form.googleClientId;
      if (method === 'OAUTH2' && form.googleClientSecret) payload.googleClientSecret = form.googleClientSecret;
      const { data } = await api.put('/admin/email-config', payload);
      setConfig(data.config);
      setMethod(data.config.authMethod || 'APP_PASSWORD');
      setForm({
        gmailUser: '',
        gmailSenderName: data.config.gmailSenderName || '',
        gmailAppPassword: '',
        googleClientId: '',
        googleClientSecret: '',
      });
      flash(t('adminEmail.saved'));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  const connectGoogle = async () => {
    setConnecting(true);
    setError('');
    try {
      const { data } = await api.get('/admin/email-config/oauth/start');
      window.location.href = data.url;
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setConnecting(false);
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
    setMethod('APP_PASSWORD');
    setTestResult(null);
    flash(t('adminEmail.disconnectedNotice'));
  };

  const statusLabel = config.isConnected
    ? { text: t('adminEmail.connected'), className: 'ok', dot: '●' }
    : config.hasCredentials
    ? { text: t('adminEmail.disconnected'), className: 'danger', dot: '×' }
    : { text: t('adminEmail.notConfigured'), className: 'muted', dot: '—' };

  const canConnectGoogle = Boolean((form.gmailUser || config.gmailUserMasked) && (form.googleClientId || config.hasGoogleOAuthClient));
  const redirectUri = `${backendPublicUrlGuess()}${OAUTH_CALLBACK_PATH}`;

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
          <h3 style={{ fontSize: 14, marginTop: 0 }}>{t('adminEmail.methodTitle')}</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: config.isLockedByAnother ? 'default' : 'pointer' }}>
              <input
                type="radio"
                name="authMethod"
                checked={method === 'APP_PASSWORD'}
                onChange={() => setMethod('APP_PASSWORD')}
                disabled={config.isLockedByAnother}
              />
              {t('adminEmail.methodAppPassword')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: config.isLockedByAnother ? 'default' : 'pointer' }}>
              <input
                type="radio"
                name="authMethod"
                checked={method === 'OAUTH2'}
                onChange={() => setMethod('OAUTH2')}
                disabled={config.isLockedByAnother}
              />
              {t('adminEmail.methodOAuth2')}
            </label>
          </div>
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -2, marginBottom: 16 }}>{t('adminEmail.methodHintRender')}</p>

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

          {method === 'APP_PASSWORD' && (
            <>
              <label className="qlc-label">{t('adminEmail.appPasswordLabel')}</label>
              <input
                className="qlc-input"
                type="password"
                value={form.gmailAppPassword}
                onChange={(e) => setForm((f) => ({ ...f, gmailAppPassword: e.target.value }))}
                placeholder={config.hasOwnCredentials && config.authMethod === 'APP_PASSWORD' ? '•••••••••••••••• (configurada)' : 'xxxx xxxx xxxx xxxx'}
                disabled={config.isLockedByAnother}
              />
              <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -4, marginBottom: 14 }}>{t('adminEmail.appPasswordHint')}</p>
              <div style={{ fontSize: 11, color: 'var(--qlc-muted2)', border: '1px solid var(--qlc-line)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
                {t('adminEmail.smtpInfoTitle')}: {config.smtpHost}:{config.smtpPort} ({config.smtpSecurity}) — {t('adminEmail.smtpInfoFixed')}
              </div>
            </>
          )}

          {method === 'OAUTH2' && (
            <>
              <h4 style={{ fontSize: 13, marginBottom: 4 }}>{t('adminEmail.oauthSectionTitle')}</h4>
              <label className="qlc-label">{t('adminEmail.oauthClientIdLabel')}</label>
              <input
                className="qlc-input"
                value={form.googleClientId}
                onChange={(e) => setForm((f) => ({ ...f, googleClientId: e.target.value }))}
                placeholder={config.googleOAuthClientIdMasked || 'xxxxxxxx.apps.googleusercontent.com'}
                disabled={config.isLockedByAnother}
              />
              <label className="qlc-label">{t('adminEmail.oauthClientSecretLabel')}</label>
              <input
                className="qlc-input"
                type="password"
                value={form.googleClientSecret}
                onChange={(e) => setForm((f) => ({ ...f, googleClientSecret: e.target.value }))}
                placeholder={config.hasGoogleOAuthClient ? '•••••••••••••••• (configurado)' : 'GOCSPX-xxxxxxxxxxxxxxxx'}
                disabled={config.isLockedByAnother}
              />
              <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -4, marginBottom: 14 }}>{t('adminEmail.oauthClientSecretHint')}</p>

              <details style={{ marginBottom: 14, fontSize: 12, color: 'var(--qlc-muted2)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t('adminEmail.oauthHowToTitle')}</summary>
                <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                  <p style={{ margin: '4px 0' }}>{t('adminEmail.oauthHowToStep1')}</p>
                  <p style={{ margin: '4px 0' }}>{t('adminEmail.oauthHowToStep2')}</p>
                  <p style={{ margin: '4px 0' }}>{t('adminEmail.oauthHowToStep3')}</p>
                  <p style={{ margin: '4px 0' }}>{t('adminEmail.oauthHowToStep4')}</p>
                  <p style={{ margin: '4px 0' }}>{t('adminEmail.oauthHowToStep5')}</p>
                  <code style={{ display: 'block', background: 'var(--qlc-panel2, rgba(255,255,255,0.04))', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all', margin: '4px 0 8px' }}>
                    {redirectUri}
                  </code>
                  <p style={{ margin: '4px 0' }}>{t('adminEmail.oauthHowToStep6')}</p>
                </div>
              </details>

              <div
                className="qlc-card"
                style={{ borderColor: config.oauthConnectedEmail ? 'var(--qlc-ok-border)' : 'var(--qlc-warn-border)', marginBottom: 14, padding: '10px 14px' }}
              >
                <p style={{ margin: 0, fontSize: 13 }}>
                  {config.oauthConnectedEmail ? (
                    <>
                      ✓ {t('adminEmail.oauthConnectedAs')}: <strong>{config.oauthConnectedEmail}</strong>
                    </>
                  ) : (
                    t('adminEmail.oauthNotConnectedYet')
                  )}
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <button
                  type="button"
                  className="qlc-btn ghost"
                  onClick={connectGoogle}
                  disabled={connecting || config.isLockedByAnother || !canConnectGoogle}
                >
                  {connecting ? t('adminEmail.oauthConnecting') : config.oauthConnectedEmail ? t('adminEmail.oauthReconnectButton') : t('adminEmail.oauthConnectButton')}
                </button>
                {!canConnectGoogle && <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>{t('adminEmail.oauthNeedsSaveFirst')}</p>}
              </div>
            </>
          )}

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

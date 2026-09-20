import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../../services/api';
import ConfirmModal from '../../../components/ConfirmModal';
import { useLanguage } from '../../../i18n/LanguageContext';
import { translateBackendMessage } from '../../../i18n/backendMessages';

// IMPLEMENTACIÓN DEFINITIVA DE GOOGLE DRIVE — QLC usa el Drive PERSONAL de
// sistemaweb.qlc@gmail.com (sin Google Workspace), así que ya no existe una
// cuenta de servicio: el admin autoriza esa cuenta una sola vez con OAuth2,
// mismo patrón ya usado en Configuración → Correo.
const OAUTH_CALLBACK_PATH = '/api/drive-config/oauth/callback';

function backendPublicUrlGuess() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '');
  }
}

export default function GoogleDriveSettingsPage() {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    rootFolderId: '',
    rootFolderName: '',
    googleClientId: '',
    googleClientSecret: '',
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [confirmingTest, setConfirmingTest] = useState(false);

  const CAPABILITY_LABELS = {
    canCreate: t('adminDrive.capCreate'),
    canUpload: t('adminDrive.capUpload'),
    canDownload: t('adminDrive.capDownload'),
    canDelete: t('adminDrive.capDelete'),
  };

  const load = () =>
    api.get('/admin/drive-config').then(({ data }) => {
      setConfig(data.config);
      setForm((f) => ({
        ...f,
        rootFolderId: data.config.rootFolderId || '',
        rootFolderName: data.config.rootFolderName || 'QLC',
      }));
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
      flash(t('adminDrive.oauthSuccessNotice'));
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

  if (!config) return <div className="qlc-empty">{t('adminDrive.loadingConfig')}</div>;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { rootFolderId: form.rootFolderId, rootFolderName: form.rootFolderName, isEnabled: true };
      if (form.googleClientId) payload.googleClientId = form.googleClientId;
      if (form.googleClientSecret) payload.googleClientSecret = form.googleClientSecret;
      const { data } = await api.put('/admin/drive-config', payload);
      setConfig(data.config);
      setForm((f) => ({ ...f, rootFolderId: data.config.rootFolderId || '', googleClientId: '', googleClientSecret: '' }));
      flash(translateBackendMessage(data.message, language));
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
      const { data } = await api.get('/admin/drive-config/oauth/start');
      window.location.href = data.url;
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setConnecting(false);
    }
  };

  // Envía una petición real a Google Drive (verifica el token y la carpeta
  // raíz). Se pide confirmación explícita antes de disparar — el admin
  // decide cuándo autorizar la primera prueba real.
  const testConnection = async () => {
    setConfirmingTest(false);
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

  // CORRECCIÓN — el estado ahora viene de `connectionState`, calculado en
  // vivo por el backend contra el propio OAuth2 de Google (nunca requiere
  // haber pulsado "Probar conexión", que además toca la carpeta real de
  // Drive). Los 4 estados posibles, ver driveConfigService.getStatus().
  const STATUS_LABELS = {
    CONNECTED: { text: t('adminDrive.connected'), className: 'ok', dot: '●' },
    AUTH_ERROR: { text: t('adminDrive.authError'), className: 'danger', dot: '×' },
    PENDING_AUTHORIZATION: { text: t('adminDrive.pendingAuthorization'), className: 'warn', dot: '◌' },
    NOT_CONFIGURED: { text: t('adminDrive.notConfigured'), className: 'muted', dot: '—' },
  };
  const statusLabel = STATUS_LABELS[config.connectionState] || STATUS_LABELS.NOT_CONFIGURED;

  const canConnectGoogle = Boolean(form.googleClientId || config.hasGoogleOAuthClient);
  const redirectUri = `${backendPublicUrlGuess()}${OAUTH_CALLBACK_PATH}`;

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

        {config.isLockedByAnother && (
          <div className="qlc-card" style={{ borderColor: 'var(--qlc-warn-border)', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13 }}>{t('adminDrive.lockedByAnotherNotice')}</p>
          </div>
        )}

        {!config.hasGoogleOAuthClient && (
          <div className="qlc-card" style={{ borderColor: 'var(--qlc-warn-border)', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13 }}>{t('adminDrive.noCredsNotice')}</p>
          </div>
        )}

        <details style={{ marginBottom: 18, fontSize: 12, color: 'var(--qlc-muted2)', border: '1px solid var(--qlc-line)', borderRadius: 8, padding: '10px 14px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--qlc-text, inherit)' }}>{t('adminDrive.howToTitle')}</summary>
          <div style={{ marginTop: 10, lineHeight: 1.6 }}>
            <p style={{ margin: '4px 0 10px', padding: '8px 10px', borderRadius: 6, background: 'var(--qlc-warn-bg, rgba(255,193,7,0.08))', border: '1px solid var(--qlc-warn-border)' }}>
              {t('adminDrive.howToFreeNotice')}
            </p>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <p key={n} style={{ margin: '4px 0' }}>{t(`adminDrive.howToStep${n}`)}</p>
            ))}
            <code style={{ display: 'block', background: 'var(--qlc-panel2, rgba(255,255,255,0.04))', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all', margin: '4px 0 8px' }}>
              {redirectUri}
            </code>
            {[7, 8, 9, 10].map((n) => (
              <p key={n} style={{ margin: '4px 0' }}>{t(`adminDrive.howToStep${n}`)}</p>
            ))}
          </div>
        </details>

        <form onSubmit={save}>
          <h3 style={{ fontSize: 14, marginTop: 0 }}>{t('adminDrive.oauthSectionTitle')}</h3>
          <label className="qlc-label">{t('adminDrive.oauthClientIdLabel')}</label>
          <input
            className="qlc-input"
            value={form.googleClientId}
            onChange={(e) => setForm((f) => ({ ...f, googleClientId: e.target.value }))}
            placeholder={config.googleOAuthClientIdMasked || 'xxxxxxxx.apps.googleusercontent.com'}
            disabled={config.isLockedByAnother}
          />
          <label className="qlc-label">{t('adminDrive.oauthClientSecretLabel')}</label>
          <input
            className="qlc-input"
            type="password"
            value={form.googleClientSecret}
            onChange={(e) => setForm((f) => ({ ...f, googleClientSecret: e.target.value }))}
            placeholder={config.hasGoogleOAuthClient ? '•••••••••••••••• (configurado)' : 'GOCSPX-xxxxxxxxxxxxxxxx'}
            disabled={config.isLockedByAnother}
          />
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -4, marginBottom: 14 }}>{t('adminDrive.oauthClientSecretHint')}</p>

          <div
            className="qlc-card"
            style={{
              borderColor:
                config.connectionState === 'CONNECTED'
                  ? 'var(--qlc-ok-border)'
                  : config.connectionState === 'AUTH_ERROR'
                  ? 'var(--qlc-danger-border)'
                  : 'var(--qlc-warn-border)',
              marginBottom: 14,
              padding: '10px 14px',
            }}
          >
            {/* Nunca se muestra "✓ Conectado" solo porque hay un correo
                guardado en la fila — eso mostraría una cuenta "fantasma"
                enmascarada si la autorización ya no es válida. El check
                verde exige connectionState === 'CONNECTED' (verificado en
                vivo contra Google en este mismo request). */}
            <p style={{ margin: 0, fontSize: 13 }}>
              {config.connectionState === 'CONNECTED' && (
                <>
                  ✓ {t('adminDrive.oauthConnectedAs')}: <strong>{config.oauthConnectedEmailMasked}</strong>
                </>
              )}
              {config.connectionState === 'AUTH_ERROR' && (
                <>
                  ⚠ {t('adminDrive.oauthPreviouslyAuthorizedAs')} <strong>{config.oauthConnectedEmailMasked}</strong>, {t('adminDrive.oauthNoLongerValid')}
                </>
              )}
              {(config.connectionState === 'PENDING_AUTHORIZATION' || config.connectionState === 'NOT_CONFIGURED') &&
                t('adminDrive.oauthNotConnectedYet')}
            </p>
            {config.connectionState === 'AUTH_ERROR' && config.connectionError && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--qlc-danger)' }}>{translateBackendMessage(config.connectionError, language)}</p>
            )}
            <p style={{ margin: '6px 0 0', fontSize: 11 }}>{t('adminDrive.oauthExpectedAccountNotice')}</p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <button
              type="button"
              className="qlc-btn ghost"
              onClick={connectGoogle}
              disabled={connecting || config.isLockedByAnother || !canConnectGoogle}
            >
              {connecting ? t('adminDrive.oauthConnecting') : config.hasCredentials ? t('adminDrive.oauthReconnectButton') : t('adminDrive.oauthConnectButton')}
            </button>
            {!canConnectGoogle && <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>{t('adminDrive.oauthNeedsSaveFirst')}</p>}
          </div>

          <h3 style={{ fontSize: 14, marginTop: 0 }}>{t('adminDrive.folderSectionTitle')}</h3>
          <label className="qlc-label">{t('adminDrive.folderNameLabel')}</label>
          <input
            className="qlc-input"
            value={form.rootFolderName}
            onChange={(e) => setForm((f) => ({ ...f, rootFolderName: e.target.value }))}
            placeholder="QLC"
            disabled={config.isLockedByAnother}
          />

          <label className="qlc-label">{t('adminDrive.folderIdLabel')}</label>
          <input
            className="qlc-input"
            value={form.rootFolderId}
            onChange={(e) => setForm((f) => ({ ...f, rootFolderId: e.target.value }))}
            placeholder="https://drive.google.com/drive/folders/TU_FOLDER_ID"
            disabled={config.isLockedByAnother}
          />
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>{t('adminDrive.folderIdHint')}</p>

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={() => setConfirmingTest(true)} disabled={testing}>
              {testing ? t('adminDrive.testing') : t('adminDrive.testConnection')}
            </button>
            <button className="qlc-btn primary" disabled={saving || config.isLockedByAnother}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>

        {testResult?.ok && (
          <div className="qlc-card" style={{ marginTop: 18, borderColor: 'var(--qlc-ok-border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13 }}>{testResult.message}</p>
          </div>
        )}
        {testResult && !testResult.ok && (
          <div className="qlc-card" style={{ marginTop: 18, borderColor: 'var(--qlc-danger-border)' }}>
            <p style={{ margin: 0, fontSize: 13 }}>{testResult.message}</p>
          </div>
        )}

        {config.lastTestedAt && !testResult && (
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 14 }}>
            {t('adminDrive.lastTest')}: {new Date(config.lastTestedAt).toLocaleString()} —{' '}
            {config.lastTestStatus === 'OK' ? t('adminDrive.correct') : '! ' + translateBackendMessage(config.lastTestMessage, language)}
          </p>
        )}

        {config.hasCredentials && !config.isLockedByAnother && (
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

      {confirmingTest && (
        <ConfirmModal
          title={t('adminDrive.testTitle')}
          message={t('adminDrive.testConfirmMessage')}
          confirmLabel={t('adminDrive.testConnection')}
          onClose={() => setConfirmingTest(false)}
          onConfirm={testConnection}
        />
      )}
    </div>
  );
}

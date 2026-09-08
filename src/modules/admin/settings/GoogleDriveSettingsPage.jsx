import { useEffect, useState } from 'react';
import api from '../../../services/api';
import ConfirmModal from '../../../components/ConfirmModal';

const CAPABILITY_LABELS = {
  canCreate: 'Puede crear carpetas',
  canUpload: 'Puede subir archivos',
  canDownload: 'Puede descargar archivos',
  canDelete: 'Puede eliminar archivos',
};

export default function GoogleDriveSettingsPage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ rootFolderId: '', rootFolderName: '' });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

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

  if (!config) return <div className="qlc-empty">Cargando configuración…</div>;

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
      flash('✓ Configuración de Google Drive guardada correctamente.');
    } catch (err) {
      setError(err.message);
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
      if (!data.ok) setError(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    const { data } = await api.post('/admin/drive-config/disconnect');
    setConfig(data.config);
    setTestResult(null);
    flash('Google Drive fue desconectado. La plataforma no podrá subir ni descargar documentos hasta que lo reactives.');
  };

  const statusLabel = config.isConnected
    ? { text: 'CONECTADO', className: 'ok', dot: '●' }
    : config.hasServiceAccountCreds
    ? { text: 'DESCONECTADO', className: 'danger', dot: '×' }
    : { text: 'NO CONFIGURADO', className: 'muted', dot: '—' };

  return (
    <div>
      <div className="qlc-kicker">CONFIGURACIÓN</div>
      <h1 style={{ marginTop: 0 }}>Google Drive</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>
        QLC guarda todos los contratos, comprobantes y documentos de clientes en una sola carpeta
        corporativa de Google Drive. Los clientes nunca conectan su propio Drive — solo usan la
        interfaz de QLC.
      </p>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-card" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className={`qlc-badge ${statusLabel.className}`} style={{ fontSize: 12, padding: '8px 14px' }}>
            {statusLabel.dot} {statusLabel.text}
          </span>
        </div>

        {!config.hasServiceAccountCreds && (
          <div className="qlc-card" style={{ borderColor: 'var(--qlc-warn-border)', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13 }}>
              La credencial técnica de la cuenta de servicio todavía no está configurada en el
              servidor. Esto lo configura quien administra la infraestructura (variables
              <code> GOOGLE_SERVICE_ACCOUNT_EMAIL</code> y <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>
              ). Una vez hecho eso, la carpeta y el resto de la conexión se administran desde aquí,
              sin volver a tocar archivos de configuración.
            </p>
          </div>
        )}

        {config.hasServiceAccountCreds && (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -10, marginBottom: 20 }}>
            Cuenta técnica configurada: {config.serviceAccountEmailMasked}
          </p>
        )}

        <form onSubmit={save}>
          <label className="qlc-label">Nombre de la carpeta principal</label>
          <input
            className="qlc-input"
            value={form.rootFolderName}
            onChange={(e) => setForm((f) => ({ ...f, rootFolderName: e.target.value }))}
            placeholder="QLC"
          />

          <label className="qlc-label">Folder ID de Google Drive</label>
          <input
            className="qlc-input"
            value={form.rootFolderId}
            onChange={(e) => setForm((f) => ({ ...f, rootFolderId: e.target.value }))}
            placeholder="Ej: 1AbCdEfGhIjKlMnOpQrStUvWxYz"
          />
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>
            Se obtiene de la URL de la carpeta en Google Drive. Recuerda compartir esa carpeta con
            el email de la cuenta de servicio (arriba) con permiso de Editor.
            {config.usingBootstrapFolder && ' Actualmente se está usando la carpeta configurada por infraestructura.'}
          </p>

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={testConnection} disabled={testing}>
              {testing ? 'Probando…' : 'Probar conexión'}
            </button>
            <button className="qlc-btn primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>

        {testResult?.ok && (
          <div className="qlc-card" style={{ marginTop: 18, borderColor: 'var(--qlc-ok-border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13 }}>
              ✓ Conectado correctamente con la carpeta "{testResult.folderName}".
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
            Última prueba: {new Date(config.lastTestedAt).toLocaleString()} —{' '}
            {config.lastTestStatus === 'OK' ? '✓ correcta' : '! ' + config.lastTestMessage}
          </p>
        )}

        {config.isConnected && (
          <div className="qlc-form-actions" style={{ marginTop: 20, borderTop: '1px solid var(--qlc-line)', paddingTop: 16 }}>
            <button className="qlc-btn danger" onClick={() => setConfirmingDisconnect(true)}>
              Desconectar
            </button>
          </div>
        )}
      </div>

      {confirmingDisconnect && (
        <ConfirmModal
          title="¿Desconectar Google Drive?"
          message="Mientras esté desconectado, ni el administrador ni los clientes podrán subir o descargar contratos, documentos o comprobantes. Podrás reactivarlo guardando la configuración nuevamente."
          confirmLabel="Desconectar"
          onClose={() => setConfirmingDisconnect(false)}
          onConfirm={disconnect}
        />
      )}
    </div>
  );
}

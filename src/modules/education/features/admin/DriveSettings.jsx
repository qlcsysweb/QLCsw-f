import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime } from '../../utils/format.js';
import { Card, Notice, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Input } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { tr } from '../../i18n/tr.js';

function Editor({ data, canManage, onSaved }) {
  const [f, setF] = useState({ clientId: '', clientSecret: '' });
  const [state, setState] = useState({ busy: false, error: null, info: null });
  const hasApp = !!(data.clientId && data.hasSecret);
  const canConnect = hasApp || !!(f.clientId.trim() && f.clientSecret.trim());
  const linked = data.status === 'CONNECTED';

  const run = async (fn, info) => {
    setState({ busy: true, error: null, info: null });
    try {
      await fn();
      setState({ busy: false, error: null, info: info || null });
    } catch (error) {
      setState({ busy: false, error, info: null });
    }
    onSaved();
  };
  const connect = () => run(async () => {
    if (!hasApp) await api.put('/admin/mail-settings', { clientId: f.clientId.trim(), clientSecret: f.clientSecret.trim() });
    const { url } = await api.get('/admin/integrations/drive/connect');
    window.location.assign(url);
  });
  const test = () => run(async () => {
    const res = await api.post('/admin/integrations/drive/test', {});
    if (!res.lastTest?.ok) throw new Error(tr(res.lastTest?.error || 'No se pudo conectar'));
  }, tr('Conexión correcta: se creó y se borró un archivo de prueba en Google Drive.'));
  const disconnect = () => {
    if (!window.confirm(tr('Los clientes no podrán enviar comprobantes y no se podrán abrir las evidencias hasta volver a conectar. Tus archivos siguen en Google Drive. ¿Desconectar?'))) return;
    run(() => api.del('/admin/integrations/drive'), tr('Google Drive desconectado.'));
  };

  return (
    <div className="stack">
      <div className="mail-status">
        {data.connected ? <Pill>{tr('Conectado')}</Pill> : data.status === 'ERROR' ? <Pill variant="bad">{tr('Error de conexión')}</Pill> : <Pill variant="warn">{tr('Sin conectar')}</Pill>}
        {data.email && <span className="small muted">{data.email}</span>}
      </div>
      {data.lastError && <p className="small down">{tr('Google rechazó la conexión. Pulsa Reconectar con Google; si cambió el Client ID o el Client Secret, también hay que reconectar.')}</p>}
      {data.missingScope && <Notice variant="gold">{tr('La cuenta {email} se conectó sin el permiso de Google Drive. Pulsa «Reconectar con Google» y acepta el permiso.', { email: data.email || 'Google' })}</Notice>}

      <h4>{tr('Aplicación OAuth2 de Google Cloud')}</h4>
      {hasApp
        ? <p className="small muted">{tr('Usa la misma aplicación de Gmail: {value}. Si la cambias, Gmail y Drive se deben volver a conectar.', { value: data.clientId })}</p>
        : (
          <>
            <p className="small muted">{tr('Gmail y Drive usan la misma aplicación. Lo que guardes aquí también lo usará Gmail.')}</p>
            <div className="form-grid cols-2">
              <Field label={tr('Client ID')}><Input name="qlc-drive-app" autoComplete="off" value={f.clientId} disabled={!canManage} onChange={(e) => setF({ ...f, clientId: e.target.value })} placeholder="xxxxxxxx.apps.googleusercontent.com" /></Field>
              <Field label={tr('Client Secret')}><Input type="password" name="qlc-drive-secret" autoComplete="new-password" value={f.clientSecret} disabled={!canManage} onChange={(e) => setF({ ...f, clientSecret: e.target.value })} /></Field>
            </div>
          </>
        )}
      <details className="more-actions">
        <summary>{tr('Qué hacer en Google Cloud antes de conectar')}</summary>
        <ol className="small">
          <li>{tr('Entra a Google Cloud Console, al mismo proyecto de la aplicación de Gmail. No hay que crear otro cliente.')}</li>
          <li>{tr('En «APIs y servicios» activa la Google Drive API.')}</li>
          <li>{tr('En «Acceso a los datos» agrega el permiso {scope}.', { scope: '.../auth/drive.file' })}</li>
          <li>{tr('Revisa que en «URI de redireccionamiento autorizados» esté: {uri}', { uri: data.redirectUri })}</li>
          <li>{tr('En «Público», si la aplicación sigue en modo de prueba, pásala a producción. En modo de prueba Google corta la conexión cada 7 días.')}</li>
          <li>{tr('Pulsa «Conectar con Google», elige la cuenta donde se guardarán los archivos y acepta el permiso.')}</li>
        </ol>
      </details>

      <p className="small muted">{tr('QLC solo puede ver los archivos y carpetas que ella misma crea. Los guarda en la carpeta «QLC Financial Education»; los comprobantes van en Clientes / cliente / Pagos.')}</p>
      {data.gmailEmail && data.email && data.gmailEmail !== data.email && <p className="small muted">{tr('Drive usa una cuenta distinta a la de Gmail ({email}). Es válido.', { email: data.gmailEmail })}</p>}
      {data.folderUrl && <a className="btn-link" href={data.folderUrl} target="_blank" rel="noopener noreferrer">{tr('Abrir la carpeta en Google Drive')}</a>}
      {!data.encryptionReady && <Notice variant="gold">{tr('Falta TOKEN_ENCRYPTION_KEY en el servidor: sin ella no se pueden guardar credenciales cifradas.')}</Notice>}

      <FormError error={state.error} />
      {state.info && <p className="small up">{state.info}</p>}
      {canManage && (
        <div className="form-actions">
          <Button variant={linked ? 'secondary' : undefined} loading={state.busy} disabled={!canConnect} onClick={connect}>{linked ? tr('Reconectar con Google') : tr('Conectar con Google')}</Button>
          {data.connected && <Button loading={state.busy} onClick={test}>{tr('Probar conexión')}</Button>}
          {(linked || data.status === 'ERROR') && <Button variant="secondary" loading={state.busy} onClick={disconnect}>{tr('Desconectar')}</Button>}
        </div>
      )}
      {data.lastTest && (
        <p className="small muted">{tr('Última prueba:')} {dateTime(data.lastTest.at)} — {data.lastTest.ok ? <span className="up">{tr('correcta')}</span> : <span className="down">{tr('falló')}{data.lastTest.error ? `: ${tr(data.lastTest.error)}` : ''}</span>}</p>
      )}
    </div>
  );
}

export function DriveSettings({ canManage, onChanged }) {
  const res = useAsync(() => api.get('/admin/integrations/drive'), []);
  return (
    <Card title={tr('Google Drive')}>
      <p className="small muted">{tr('Guarda los comprobantes de pago de los clientes y los archivos de la plataforma en tu Google Drive. Los clientes solo los ven a través de QLC, nunca con un enlace de Drive.')}</p>
      <AsyncView {...res} onRetry={res.reload}>
        {(data) => <Editor data={data} canManage={canManage} onSaved={() => { res.reload(); onChanged?.(); }} />}
      </AsyncView>
    </Card>
  );
}

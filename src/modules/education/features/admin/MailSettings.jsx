import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { Card, Notice, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Input } from '../../components/ui/Form.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { dateTime } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

function Editor({ data, canManage, onSaved }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [testTo, setTestTo] = useState(user?.email || '');
  const [f, setF] = useState({
    method: data.method || 'OAUTH',
    smtpEmail: data.smtpEmail || '',
    smtpPassword: '',
    clientId: '',
    clientSecret: '',
    senderName: data.senderName || '',
    disabled: new Set(data.disabled || []),
    clientDisabled: new Set(data.clientDisabled || []),
  });
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState({ busy: false, error: null, info: null });
  const run = async (fn, info) => {
    setState({ busy: true, error: null, info: null });
    try {
      await fn();
      setState({ busy: false, error: null, info });
      setF((v) => ({ ...v, smtpPassword: '', clientId: '', clientSecret: '' }));
      onSaved();
    } catch (error) {
      setState({ busy: false, error, info: null });
    }
  };
  const persist = () => api.put('/admin/mail-settings', {
    method: f.method,
    smtpEmail: f.smtpEmail.trim(),
    ...(f.smtpPassword.trim() ? { smtpPassword: f.smtpPassword.trim() } : {}),
    ...(f.clientId.trim() ? { clientId: f.clientId.trim() } : {}),
    ...(f.clientSecret.trim() ? { clientSecret: f.clientSecret.trim() } : {}),
    senderName: f.senderName.trim() || 'QLC Financial Education',
    disabled: [...f.disabled],
    clientDisabled: [...f.clientDisabled],
  });
  const save = () => run(persist, tr('Configuración guardada.'));
  const connect = () => run(async () => {
    await persist();
    const { url } = await api.get('/admin/integrations/gmail/connect');
    window.location.assign(url);
  });
  const test = () => run(async () => {
    await persist();
    const res = await api.post('/admin/integrations/gmail/test', { to: testTo.trim(), language: lang });
    if (!res.sent) {
      onSaved();
      throw new Error(res.error || tr('No se pudo enviar'));
    }
  }, tr('Google aceptó el envío a {to}. Si no aparece en unos minutos, revisa Spam en ese correo y, en la cuenta que envía, las carpetas Enviados y Recibidos por si hay un aviso de rebote.', { to: testTo.trim() || user?.email }));
  const disconnect = () => run(async () => {
    await api.del('/admin/integrations/gmail');
    setConfirm(false);
  }, tr('Cuenta de Google desconectada.'));
  const toggle = (key, type) => {
    const next = new Set(f[key]);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setF({ ...f, [key]: next });
  };
  const setGroup = (key, events, on) => {
    const next = new Set(f[key]);
    events.forEach((e) => (on ? next.delete(e.type) : next.add(e.type)));
    setF({ ...f, [key]: next });
  };
  const groupsFor = (key, groups) => (
    <div className="notify-groups">
      {groups.map((g) => (
        <fieldset key={g.label} className="notify-group">
          <legend>
            {tr(g.label)}
            {canManage && <button type="button" className="btn-link" onClick={() => setGroup(key, g.events, g.events.some((e) => f[key].has(e.type)))}>{g.events.some((e) => f[key].has(e.type)) ? tr('Activar todos') : tr('Desactivar todos')}</button>}
          </legend>
          {g.events.map((e) => (
            <label key={e.type} className="check">
              <input type="checkbox" checked={!f[key].has(e.type)} disabled={!canManage} onChange={() => toggle(key, e.type)} />
              {tr(e.label)}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
  const linked = data.gmail.status === 'CONNECTED';
  const oauthConnected = linked && !data.gmail.missingScope;
  const hasOauthApp = !!(data.clientId && data.hasSecret) || !!(f.clientId.trim() && f.clientSecret.trim());
  const canTest = f.method === 'SMTP' ? !!(f.smtpEmail.trim() && (data.hasSmtpPassword || f.smtpPassword.trim())) : oauthConnected;
  return (
    <div className="stack">
      <div className="mail-status">
        {data.connected ? <Pill>{tr('Conectado')}</Pill> : <Pill variant="muted">{tr('No conectado')}</Pill>}
        <span className="small muted">{data.account ? tr('Cuenta configurada: {account} · configurada desde este panel', { account: data.account }) : tr('Aún no hay una cuenta configurada.')}</span>
      </div>
      {data.gmail.lastError && f.method === 'OAUTH' && <p className="small down">{tr(data.gmail.lastError)}</p>}

      <h4>{tr('Método de envío')}</h4>
      <div className="mail-methods">
        <label className="check">
          <input type="radio" name="mail-method" checked={f.method === 'SMTP'} disabled={!canManage} onChange={() => setF({ ...f, method: 'SMTP' })} />
          {tr('SMTP con contraseña de aplicación')}
        </label>
        <label className="check">
          <input type="radio" name="mail-method" checked={f.method === 'OAUTH'} disabled={!canManage} onChange={() => setF({ ...f, method: 'OAUTH' })} />
          {tr('Gmail API (OAuth2) — recomendado')}
        </label>
      </div>
      <p className="small muted">{tr('Render y muchos servidores gratuitos bloquean los puertos SMTP de forma permanente. Gmail API usa HTTPS (puerto 443), que nunca se bloquea. En un VPS propio funcionan los dos métodos si el proveedor permite el puerto 465.')}</p>

      <h4>{tr('Cuenta de Gmail')}</h4>
      <p className="small muted">{tr('Esta cuenta y estas notificaciones son exclusivas de esta subplataforma: se guardan en su propia base de datos y no se mezclan con otras plataformas.')}</p>
      <div className="form-grid cols-2">
        <Field label={tr('Proveedor')}><Input value="Gmail" readOnly /></Field>
        <Field label={tr('Nombre del remitente')}><Input maxLength={120} value={f.senderName} disabled={!canManage} onChange={(e) => setF({ ...f, senderName: e.target.value })} /></Field>
        {f.method === 'SMTP' && (
          <>
            <Field label={tr('Correo de Gmail')}><Input type="email" name="qlc-smtp-account" autoComplete="off" value={f.smtpEmail} disabled={!canManage} onChange={(e) => setF({ ...f, smtpEmail: e.target.value })} placeholder="cuenta@gmail.com" /></Field>
            <Field label={tr('Contraseña de aplicación')} hint={tr('Se guarda siempre cifrada y nunca se muestra completa. Deja el campo vacío para conservar la ya guardada.')}>
              <Input type="password" name="qlc-smtp-secret" autoComplete="new-password" value={f.smtpPassword} disabled={!canManage} onChange={(e) => setF({ ...f, smtpPassword: e.target.value })} placeholder={data.hasSmtpPassword ? '••••••••' : ''} />
            </Field>
          </>
        )}
      </div>

      {f.method === 'SMTP' && (
        <details className="more-actions">
          <summary>{tr('Cómo obtener la contraseña de aplicación')}</summary>
          <ol className="small">
            <li>{tr('Entra a la cuenta de Google que enviará los correos y activa la verificación en dos pasos.')}</li>
            <li>{tr('En «Seguridad» busca «Contraseñas de aplicaciones» y crea una para QLC.')}</li>
            <li>{tr('Copia aquí la contraseña de 16 letras, guarda y envía un correo de prueba.')}</li>
          </ol>
        </details>
      )}

      {f.method === 'OAUTH' && (
        <>
          <h4>{tr('Aplicación OAuth2 de Google Cloud')}</h4>
          <div className="form-grid cols-2">
            <Field label={tr('Client ID')} hint={data.clientId ? tr('Actual: {value}. Déjalo vacío para conservarlo.', { value: data.clientId }) : null}>
              <Input name="qlc-oauth-app" autoComplete="off" value={f.clientId} disabled={!canManage} onChange={(e) => setF({ ...f, clientId: e.target.value })} placeholder="xxxxxxxx.apps.googleusercontent.com" />
            </Field>
            <Field label={tr('Client Secret')} hint={tr('Se guarda cifrado y nunca se muestra completo. Deja el campo vacío para conservar el ya guardado.')}>
              <Input type="password" name="qlc-oauth-secret" autoComplete="new-password" value={f.clientSecret} disabled={!canManage} onChange={(e) => setF({ ...f, clientSecret: e.target.value })} placeholder={data.hasSecret ? '••••••••' : ''} />
            </Field>
          </div>
          <details className="more-actions">
            <summary>{tr('Cómo obtener el Client ID y el Client Secret')}</summary>
            <ol className="small">
              <li>{tr('Entra a Google Cloud Console con la cuenta de Gmail que enviará los correos y crea un proyecto.')}</li>
              <li>{tr('Activa la Gmail API en «APIs y servicios».')}</li>
              <li>{tr('En «Pantalla de consentimiento de OAuth» registra la aplicación y agrega tu correo como usuario de prueba.')}</li>
              <li>{tr('En «Credenciales» crea un «ID de cliente de OAuth» de tipo «Aplicación web».')}</li>
              <li>{tr('En «URI de redireccionamiento autorizados» agrega: {uri}', { uri: data.redirectUri })}</li>
              <li>{tr('Copia el Client ID y el Client Secret aquí y pulsa «Conectar con Google».')}</li>
            </ol>
          </details>
          {data.gmail.missingScope && <Notice variant="gold">{tr('La cuenta {email} se conectó sin el permiso de enviar correos. Pulsa «Reconectar con Google» y, en la pantalla de Google, marca la casilla de enviar correo electrónico en tu nombre.', { email: data.gmail.email || '' })}</Notice>}
          {oauthConnected && <div className="mail-connected">✓ {tr('Conectado con Google como:')} <b>{data.gmail.email}</b></div>}
          {canManage && (
            <div className="form-actions mail-oauth-actions">
              <Button variant="secondary" loading={state.busy} disabled={!hasOauthApp} onClick={connect}>{linked ? tr('Reconectar con Google') : tr('Conectar con Google')}</Button>
              {linked && <Button variant="secondary" loading={state.busy} onClick={() => setConfirm(true)}>{tr('Desconectar')}</Button>}
            </div>
          )}
        </>
      )}
      {!data.encryptionReady && <Notice variant="gold">{tr('Falta TOKEN_ENCRYPTION_KEY en el servidor: sin ella no se pueden guardar credenciales cifradas.')}</Notice>}

      <h4>{tr('Notificaciones para administradores')}</h4>
      <p className="small muted">{tr('Todo lo que pasa en la plataforma se avisa a la cuenta de Gmail conectada arriba. Todos los avisos vienen activados. Desmarca los que no quieras recibir por correo; siguen guardándose en el panel.')}</p>
      {groupsFor('disabled', data.groups)}

      <h4>{tr('Notificaciones para clientes')}</h4>
      <p className="small muted">{tr('Correos que recibe cada cliente en su propia cuenta de correo. Desmarca los que no quieras enviar. Los correos de verificación, recuperación de contraseña y avisos antes de eliminar una cuenta siempre se envían.')}</p>
      {groupsFor('clientDisabled', data.clientGroups || [])}

      <FormError error={state.error} />
      {state.info && <p className="small up">{state.info}</p>}
      {canManage && (
        <Field label={tr('Enviar la prueba a')} hint={tr('Las notificaciones para administradores llegan a la cuenta conectada arriba, no necesariamente a este correo.')}>
          <Input type="email" name="qlc-test-to" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
        </Field>
      )}
      {canManage && (
        <div className="form-actions">
          <Button variant="secondary" loading={state.busy} disabled={!canTest} onClick={test}>{tr('Enviar correo de prueba')}</Button>
          <Button loading={state.busy} onClick={save}>{tr('Guardar')}</Button>
        </div>
      )}
      {data.lastTest && (
        <p className="small muted">{tr('Última prueba:')} {dateTime(data.lastTest.at)} — {data.lastTest.ok ? <span className="up">{tr('correcta')}</span> : <span className="down">{tr('falló')}{data.lastTest.error ? `: ${data.lastTest.error}` : ''}</span>}</p>
      )}
      <ConfirmDialog open={confirm} title={tr('Desconectar Gmail')} danger confirmLabel={tr('Desconectar')} loading={state.busy}
        message={tr('Se revocará el acceso y se eliminará el token cifrado. El envío de correos del sistema se detendrá hasta volver a conectar.')} onConfirm={disconnect} onClose={() => setConfirm(false)} />
    </div>
  );
}

export function MailSettings({ canManage, onChanged }) {
  const res = useAsync(() => api.get('/admin/mail-settings'), []);
  return (
    <Card title={tr('Correo (Gmail)')}>
      <p className="small muted">{tr('QLC envía automáticamente un correo por cada notificación importante, a los administradores o al cliente correspondiente, además de mostrarla dentro de la plataforma. Usa una cuenta de Gmail corporativa dedicada a estos envíos.')}</p>
      <AsyncView {...res} onRetry={res.reload}>
        {(data) => <Editor key={data.clientId || 'new'} data={data} canManage={canManage} onSaved={() => { res.reload(); onChanged?.(); }} />}
      </AsyncView>
    </Card>
  );
}

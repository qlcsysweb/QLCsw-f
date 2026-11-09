import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Input, Textarea } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { tr } from '../../i18n/tr.js';

function Editor({ data, canManage, onSaved }) {
  const [f, setF] = useState({ accessToken: '', webhookSecret: '', testPayerEmail: data.testPayerEmail || '' });
  const [state, setState] = useState({ busy: false, error: null, info: null });
  const run = async (fn, info) => {
    setState({ busy: true, error: null, info: null });
    try {
      await fn();
      setState({ busy: false, error: null, info });
      setF((v) => ({ ...v, accessToken: '', webhookSecret: '' }));
      onSaved();
    } catch (error) {
      setState({ busy: false, error, info: null });
      onSaved();
    }
  };
  const body = () => ({
    ...(f.accessToken.trim() ? { accessToken: f.accessToken.trim() } : {}),
    ...(f.webhookSecret.trim() ? { webhookSecret: f.webhookSecret.trim() } : {}),
    ...(data.testMode ? { testPayerEmail: f.testPayerEmail.trim() } : {}),
  });
  const save = () => run(() => api.put('/admin/payment-settings', body()), tr('Configuración guardada.'));
  const test = () => run(async () => {
    await api.put('/admin/payment-settings', body());
    const res = await api.post('/admin/payment-settings/test', {});
    if (!res.lastTest?.ok) throw new Error(res.lastTest?.error || tr('No se pudo conectar'));
  }, tr('Conexión correcta con Mercado Pago.'));
  const toggle = (enabled) => {
    if (enabled && !data.testMode && !window.confirm(tr('A partir de ahora los clientes que residen en México pagarán con dinero real en Mercado Pago y ya no existirá el pago simulado. ¿Activar?'))) return;
    if (!enabled && !window.confirm(tr('Los clientes ya no podrán pagar con Mercado Pago. Si Bitget tampoco está activa, volverá el modo de prueba, donde cualquier cliente puede activar su acceso sin pagar. ¿Desactivar Mercado Pago?'))) return;
    run(() => api.put('/admin/payment-settings', { ...body(), enabled }), enabled ? tr('Mercado Pago activado.') : tr('Mercado Pago desactivado.'));
  };

  return (
    <div className="stack">
      <div className="mail-status">
        {data.enabled ? <Pill>{tr('Activa')}</Pill> : <Pill variant="warn">{tr('Desactivada')}</Pill>}
        {data.enabled && data.testMode && <Pill variant="warn">{tr('Credenciales de prueba')}</Pill>}
        {data.account && <span className="small muted">{tr('Cuenta: {name} · Cobra en {currency}', { name: data.account.nickname || data.account.siteId, currency: data.chargeCurrency })}</span>}
      </div>

      <h4>{tr('Credenciales')}</h4>
      <p className="small muted">{tr('Se guardan cifradas en la base de datos y nunca se muestran completas. Deja un campo vacío para conservar el ya guardado.')}</p>
      <div className="form-grid cols-2">
        <Field label={tr('Access Token')} hint={data.hasToken ? tr('Ya hay un token guardado. Al cambiarlo, Mercado Pago se desactiva hasta volver a probar la conexión.') : tr('Empieza con APP_USR- o TEST-.')}>
          <Input type="password" name="qlc-mp-token" autoComplete="new-password" value={f.accessToken} disabled={!canManage} onChange={(e) => setF({ ...f, accessToken: e.target.value })} placeholder={data.hasToken ? '••••••••' : 'APP_USR-...'} />
        </Field>
        <Field label={tr('Clave secreta del webhook')} hint={data.hasWebhookSecret ? tr('Ya hay una clave guardada.') : tr('Sirve para comprobar que cada aviso de pago viene de Mercado Pago.')}>
          <Input type="password" name="qlc-mp-webhook" autoComplete="new-password" value={f.webhookSecret} disabled={!canManage} onChange={(e) => setF({ ...f, webhookSecret: e.target.value })} placeholder={data.hasWebhookSecret ? '••••••••' : ''} />
        </Field>
      </div>

      {data.testMode && (
        <Field label={tr('Correo del comprador de prueba')} hint={tr('Solo se usa mientras las credenciales sean de prueba. Con credenciales de producción se ignora y se usa el correo real del cliente.')}>
          <Input type="email" name="qlc-mp-test-buyer" autoComplete="off" value={f.testPayerEmail} disabled={!canManage} onChange={(e) => setF({ ...f, testPayerEmail: e.target.value })} placeholder="test_user_123@testuser.com" />
        </Field>
      )}

      <h4>{tr('URL del webhook')}</h4>
      <code className="code-line">{data.webhookUrl}</code>

      <details className="more-actions">
        <summary>{tr('Cómo obtener estos datos')}</summary>
        <ol className="small">
          <li>{tr('Entra a «Tus integraciones» en Mercado Pago Developers y crea una aplicación de tipo Checkout Pro.')}</li>
          <li>{tr('En «Credenciales de producción» copia el Access Token. Para probar sin dinero real usa las credenciales de prueba.')}</li>
          <li>{tr('En «Webhooks» pega la URL de arriba, marca los eventos «Pagos» y «Planes y suscripciones», y guarda.')}</li>
          <li>{tr('Copia la «Clave secreta» que muestra esa misma pantalla y pégala aquí.')}</li>
          <li>{tr('Pulsa «Guardar y probar conexión», revisa los tipos de cambio y activa Mercado Pago.')}</li>
        </ol>
      </details>

      {data.chargeCurrency && data.ratesNeeded.length > 0 && (
        <>
          <h4>{tr('Tipo de cambio')}</h4>
          <p className="small muted">{tr('Se actualiza solo cada hora y a cada valor de mercado se le suma {markup} {currency} para evitar pérdidas. El cliente ve el monto exacto antes de pagar.', { markup: data.rateMarkup, currency: data.chargeCurrency })}</p>
          <div className="form-grid cols-2">
            {data.ratesNeeded.map((code) => (
              <Field key={code} label={tr('1 {from} equivale a ({to})', { from: code, to: data.chargeCurrency })} hint={data.marketRates[code] ? tr('Valor de mercado: {value}', { value: data.marketRates[code] }) : undefined}>
                <Input readOnly value={data.rates[code] ?? ''} placeholder={tr('Pendiente de actualizar')} />
              </Field>
            ))}
          </div>
          {data.ratesUpdatedAt && <p className="small muted">{tr('Última actualización:')} {dateTime(data.ratesUpdatedAt)}</p>}
          {(data.ratesError || data.ratesStale) && <Notice variant="gold">{tr('El tipo de cambio no se pudo actualizar. Se sigue usando el último valor guardado; revísalo antes de vender.')}</Notice>}
        </>
      )}

      {!data.encryptionReady && <Notice variant="gold">{tr('Falta TOKEN_ENCRYPTION_KEY en el servidor: sin ella no se pueden guardar credenciales cifradas.')}</Notice>}
      {!data.enabled && data.missing.length > 0 && <p className="small muted">{tr('Para activar falta:')} {data.missing.map((m) => tr(m)).join(', ')}.</p>}

      <FormError error={state.error} />
      {state.info && <p className="small up">{state.info}</p>}
      {canManage && (
        <div className="form-actions">
          <Button variant="secondary" loading={state.busy} disabled={!data.hasToken && !f.accessToken.trim()} onClick={test}>{tr('Guardar y probar conexión')}</Button>
          <Button variant="secondary" loading={state.busy} onClick={save}>{tr('Guardar')}</Button>
          {data.enabled
            ? <Button variant="danger" loading={state.busy} onClick={() => toggle(false)}>{tr('Desactivar Mercado Pago')}</Button>
            : <Button loading={state.busy} onClick={() => toggle(true)}>{tr('Activar Mercado Pago')}</Button>}
        </div>
      )}
      {data.lastTest && (
        <p className="small muted">{tr('Última prueba:')} {dateTime(data.lastTest.at)} — {data.lastTest.ok ? <span className="up">{tr('correcta')}</span> : <span className="down">{tr('falló')}{data.lastTest.error ? `: ${data.lastTest.error}` : ''}</span>}</p>
      )}
    </div>
  );
}

function BitgetEditor({ data, canManage, onSaved }) {
  const [f, setF] = useState({ uid: data.uid, instructions: data.instructions, walletAddress: data.walletAddress, walletNetwork: data.walletNetwork, rates: { ...data.rates } });
  const [state, setState] = useState({ busy: false, error: null, info: null });
  const body = () => ({
    uid: f.uid.trim(),
    walletAddress: f.walletAddress.trim(),
    walletNetwork: f.walletNetwork,
    instructions: f.instructions.trim(),
    rates: Object.fromEntries(Object.entries(f.rates).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])),
  });
  const run = async (extra, info) => {
    setState({ busy: true, error: null, info: null });
    try {
      await api.put('/admin/bitget-settings', { ...body(), ...extra });
      setState({ busy: false, error: null, info });
    } catch (error) {
      setState({ busy: false, error, info: null });
    }
    onSaved();
  };
  return (
    <div className="stack">
      <div className="mail-status">
        {data.enabled ? <Pill>{tr('Activa')}</Pill> : <Pill variant="warn">{tr('Desactivada')}</Pill>}
        <span className="small muted">{tr('Disponible para clientes de todos los países.')}</span>
      </div>
      <p className="small muted">{tr('El cliente transfiere USDT al UID de Bitget o a la wallet y reporta el N.º de orden o hash con su evidencia. Tú revisas el reporte en Pagos y confirmas el pago. Las evidencias se guardan en el Google Drive conectado en Integraciones, en la tarjeta Google Drive.')}</p>
      <div className="form-grid cols-2">
        <Field label={tr('UID de recepción de Bitget')} hint={tr('Es el mismo para todos los clientes. El cliente no puede cambiarlo.')}>
          <Input name="qlc-bitget-uid" autoComplete="off" inputMode="numeric" maxLength={20} value={f.uid} disabled={!canManage} onChange={(e) => setF({ ...f, uid: e.target.value })} />
        </Field>
        <Field label={tr('Dirección de wallet de USDT')} hint={tr('El cliente la ve con su código QR y un botón para copiar.')}>
          <Input name="qlc-wallet-address" autoComplete="off" maxLength={128} value={f.walletAddress} disabled={!canManage} onChange={(e) => setF({ ...f, walletAddress: e.target.value })} />
        </Field>
        <Field label={tr('Red de la wallet')} hint={tr('Debe ser la red real de esa dirección. La wallet no se muestra hasta elegirla.')}>
          <select className="input" value={f.walletNetwork} disabled={!canManage} onChange={(e) => setF({ ...f, walletNetwork: e.target.value })}>
            <option value="">{tr('Selecciona la red')}</option>
            {data.networks.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </Field>
        <Field label={tr('Instrucciones de pago')} full>
          <Textarea rows={3} maxLength={1500} value={f.instructions} disabled={!canManage} onChange={(e) => setF({ ...f, instructions: e.target.value })} />
        </Field>
      </div>
      {data.ratesNeeded.length > 0 && (
        <>
          <h4>{tr('Tipo de cambio')}</h4>
          <p className="small muted">{tr('Los precios en USD o USDT se cobran 1 a 1 en USDT. Para otras monedas define aquí cuántos USDT equivale cada unidad.')}</p>
          <div className="form-grid cols-2">
            {data.ratesNeeded.map((code) => (
              <Field key={code} label={tr('1 {from} equivale a ({to})', { from: code, to: 'USDT' })}>
                <Input type="number" min="0" step="0.0001" value={f.rates[code] ?? ''} disabled={!canManage} onChange={(e) => setF({ ...f, rates: { ...f.rates, [code]: e.target.value } })} />
              </Field>
            ))}
          </div>
        </>
      )}
      {!data.enabled && data.missing.length > 0 && <p className="small muted">{tr('Para activar falta:')} {data.missing.map((m) => tr(m)).join(', ')}.</p>}
      <FormError error={state.error} />
      {state.info && <p className="small up">{state.info}</p>}
      {canManage && (
        <div className="form-actions">
          <Button variant="secondary" loading={state.busy} onClick={() => run({}, tr('Configuración guardada.'))}>{tr('Guardar')}</Button>
          {data.enabled
            ? <Button variant="danger" loading={state.busy} onClick={() => run({ enabled: false }, tr('Bitget desactivado.'))}>{tr('Desactivar Bitget')}</Button>
            : <Button loading={state.busy} onClick={() => run({ enabled: true }, tr('Bitget activado.'))}>{tr('Activar Bitget')}</Button>}
        </div>
      )}
    </div>
  );
}

export default function AdminGateway() {
  const { user } = useAuth();
  const res = useAsync(() => api.get('/admin/payment-settings'), []);
  const bg = useAsync(() => api.get('/admin/bitget-settings'), []);
  return (
    <>
      <PageHeader kicker={tr('Comercial')} title={tr('Pasarela de pago')} subtitle={tr('Mercado Pago solo se muestra a clientes que residen en México: pagan en su página, con suscripción en productos mensuales o anuales y pago único en los demás. La transferencia Bitget se muestra a todos.')} />
      <Card title={tr('Mercado Pago')}>
        <AsyncView {...res} onRetry={res.reload}>
          {(data) => <Editor data={data} canManage={user?.adminLevel === 'FULL'} onSaved={res.reload} />}
        </AsyncView>
      </Card>
      <Card title={tr('Transferencia en USDT (Bitget y wallet)')}>
        <AsyncView {...bg} onRetry={bg.reload}>
          {(data) => <BitgetEditor data={data} canManage={user?.adminLevel === 'FULL'} onSaved={bg.reload} />}
        </AsyncView>
      </Card>
    </>
  );
}

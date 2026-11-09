import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { date, dateTime, priceMoney } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { CodeInput, Field, FormError, FormGrid, Input, Select } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { EventLog } from '../../features/admin/EventLog.jsx';
import { tr } from '../../i18n/tr.js';

const REASONS = [
  ['CORTESIA', 'Cortesía'],
  ['BENEFICIO', 'Beneficio especial'],
  ['PROMOCION', 'Promoción comercial'],
  ['COMPENSACION', 'Compensación al cliente'],
  ['INVITACION', 'Invitación'],
  ['ESPECIAL', 'Autorización especial'],
];

const localInput = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};
const inDays = (n) => localInput(Date.now() + n * 86400000);

function AuthorizeDialog({ action, onClose, onDone }) {
  const [f, setF] = useState({ masterPassword: '', code: '' });
  const [state, setState] = useState({ busy: false, error: null });
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null });
    try {
      await action.run(f);
      onDone();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Modal open title={tr('Autorización del Administrador General')} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Notice>{action.summary}</Notice>
        <Field label={tr('Contraseña maestra')}><Input type="password" autoComplete="off" value={f.masterPassword} onChange={(e) => setF({ ...f, masterPassword: e.target.value })} /></Field>
        <Field label={tr('Código de su autenticador')}><CodeInput value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
        <FormError error={state.error} />
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button>
          <Button type="submit" loading={state.busy} disabled={!f.masterPassword || f.code.length !== 6}>{tr('Autorizar')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Setup({ status, onDone }) {
  const [f, setF] = useState({ password: '', confirm: '', code: '' });
  const [state, setState] = useState({ busy: false, error: null });
  const save = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setState({ busy: false, error: new Error(tr('Las contraseñas no coinciden')) });
    setState({ busy: true, error: null });
    try {
      await api.post('/admin/general/setup', { password: f.password, code: f.code });
      onDone();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  if (!status.canClaim) return <Notice>{tr('La contraseña maestra aún no está configurada. Solo el Administrador General designado puede configurarla.')}</Notice>;
  return (
    <Card title={tr('Configurar contraseña maestra')}>
      <p className="small">{tr('La cuenta que configure la contraseña maestra quedará como Administrador General: será la única que pueda conceder, modificar y retirar accesos manualmente. La contraseña se guarda cifrada en el servidor y nunca en la página.')}</p>
      <form className="stack" onSubmit={save}>
        <FormGrid>
          <Field label={tr('Contraseña maestra')} hint={tr('Mínimo 12 caracteres, con letras y números.')}><Input type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Field label={tr('Confirmar contraseña')}><Input type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
          <Field label={tr('Código de su autenticador')}><CodeInput value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
        </FormGrid>
        <FormError error={state.error} />
        <div className="form-actions"><Button type="submit" loading={state.busy}>{tr('Configurar y quedar como Administrador General')}</Button></div>
      </form>
    </Card>
  );
}

function Pending({ authorize }) {
  const res = useAsync(() => api.get('/admin/general/pending'), []);
  const [expiry, setExpiry] = useState({});
  return (
    <Card title={tr('Pagos promocionales pendientes de autorización')}>
      <p className="small muted">{tr('La pasarela ya confirmó estos pagos, pero ninguno activa acceso por sí solo. Verifique el pago y autorice o rechace.')}</p>
      <AsyncView {...res} onRetry={res.reload}>
        {(rows) => (
          <DataTable rows={rows} empty={tr('No hay pagos promocionales pendientes.')} columns={[
            { key: 'resolvedAt', label: tr('Pagado'), render: (a) => dateTime(a.resolvedAt) },
            { key: 'user', label: tr('Usuario'), render: (a) => <>{a.user.name}<span className="small block">{a.user.email}</span></> },
            { key: 'offer', label: tr('Producto'), render: (a) => a.offer.name },
            { key: 'promo', label: tr('Promoción'), render: (a) => (a.promotion ? `${a.promotion.discountPercent}% · ${a.promotion.code}` : '—') },
            { key: 'amount', label: tr('Importe cobrado'), align: 'right', render: (a) => (a.amount === null ? '—' : priceMoney(a.amount)) },
            { key: 'expiry', label: tr('Vencimiento (opcional)'), render: (a) => <Input type="datetime-local" value={expiry[a.id] || ''} onChange={(e) => setExpiry({ ...expiry, [a.id]: e.target.value })} /> },
            { key: 'x', label: '', align: 'right', render: (a) => (
              <span className="row-actions">
                <Button onClick={() => authorize({
                  summary: tr('Conceder {product} a {name} por su pago promocional{until}.', { product: a.offer.name, name: a.user.name, until: expiry[a.id] ? tr(' hasta el {date}', { date: dateTime(expiry[a.id]) }) : tr(' por el periodo normal del producto') }),
                  run: (auth) => api.post(`/admin/general/pending/${a.id}/authorize`, { ...auth, expiresAt: expiry[a.id] ? new Date(expiry[a.id]).toISOString() : null }),
                  after: res.reload,
                })}>{tr('Autorizar')}</Button>
                <Button variant="secondary" onClick={() => authorize({
                  summary: tr('Rechazar la autorización del pago de {name}. No se activará ningún acceso.', { name: a.user.name }),
                  run: (auth) => api.post(`/admin/general/pending/${a.id}/reject`, auth),
                  after: res.reload,
                })}>{tr('No autorizar')}</Button>
              </span>
            ) },
          ]} />
        )}
      </AsyncView>
    </Card>
  );
}

function GrantForm({ user, offers, authorize }) {
  const [f, setF] = useState({ offerCode: '', expiresAt: inDays(365), reason: 'CORTESIA', note: '' });
  const offer = offers.find((o) => o.code === f.offerCode);
  return (
    <div className="stack">
      <FormGrid>
        <Field label={tr('Producto')}><Select value={f.offerCode} placeholder={tr('Selecciona…')} onChange={(e) => setF({ ...f, offerCode: e.target.value })} options={offers.map((o) => ({ value: o.code, label: o.name }))} /></Field>
        <Field label={tr('Fecha y hora de vencimiento')}><Input type="datetime-local" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>
        <Field label={tr('Motivo')}><Select value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} options={REASONS.map(([value, label]) => ({ value, label: tr(label) }))} /></Field>
        <Field label={tr('Nota (opcional)')}><Input maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      </FormGrid>
      <div className="form-actions">
        <Button disabled={!f.offerCode || !f.expiresAt} onClick={() => authorize({
          summary: tr('Conceder {product} a {name} ({email}) hasta el {date}, sin pago.', { product: offer?.name, name: user.name, email: user.email, date: dateTime(f.expiresAt) }),
          run: (auth) => api.post('/admin/general/grants', { userId: user.id, offerCode: f.offerCode, expiresAt: new Date(f.expiresAt).toISOString(), reason: f.reason, note: f.note || null, ...auth }),
        })}>{tr('Conceder acceso')}</Button>
      </div>
    </div>
  );
}

function UserAccess({ authorize, reloadKey }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [expiry, setExpiry] = useState({});
  const res = useAsync(() => api.get(`/admin/general/users?q=${encodeURIComponent(q.trim())}`), [q, reloadKey]);
  const offers = useAsync(() => api.get('/admin/pricing'), []);
  const user = selected && (res.data || []).find((u) => u.id === selected);
  return (
    <Card title={tr('Conceder, modificar y retirar accesos')}>
      <Field label={tr('Seleccionar usuario')}><Input value={q} onChange={(e) => { setQ(e.target.value); setSelected(null); }} placeholder={tr('Buscar por nombre o correo')} /></Field>
      {!user && (
        <AsyncView {...res} onRetry={res.reload}>
          {(rows) => (
            <DataTable rows={rows} empty={tr('Sin coincidencias.')} columns={[
              { key: 'name', label: tr('Usuario'), render: (u) => <>{u.name}<span className="small block">{u.email}</span></> },
              { key: 'grants', label: tr('Accesos vigentes'), render: (u) => u.grants.filter((g) => g.current).map((g) => g.offer).join(', ') || '—' },
              { key: 'x', label: '', align: 'right', render: (u) => <button type="button" className="btn-link" onClick={() => setSelected(u.id)}>{tr('Administrar')}</button> },
            ]} />
          )}
        </AsyncView>
      )}
      {user && (
        <div className="stack">
          <div className="source-line"><span><b>{user.name}</b> · {user.email}</span><button type="button" className="btn-link" onClick={() => setSelected(null)}>{tr('Cambiar de usuario')}</button></div>
          <DataTable rows={user.grants} empty={tr('Este usuario no tiene accesos registrados.')} columns={[
            { key: 'offer', label: tr('Producto'), render: (g) => g.offer },
            { key: 'source', label: tr('Origen'), render: (g) => <>{tr(g.sourceLabel)}{g.reason && <span className="small block">{g.reason}</span>}</> },
            { key: 'startsAt', label: tr('Inicio'), render: (g) => date(g.startsAt) },
            { key: 'expiresAt', label: tr('Vencimiento'), render: (g) => (g.expiresAt ? dateTime(g.expiresAt) : tr('Sin vencimiento')) },
            { key: 'status', label: tr('Estado'), render: (g) => (!g.active ? <><Pill variant="bad">{tr('Retirado')}</Pill>{g.revokedBy && <span className="small block">{g.revokedBy} · {date(g.revokedAt)}</span>}</> : g.current ? <Pill>{tr('Activo')}</Pill> : <Pill variant="warn">{tr('Vencido')}</Pill>) },
            { key: 'by', label: tr('Concedido por'), render: (g) => g.grantedBy || (g.source === 'PAGO' ? tr('Pasarela') : '—') },
            { key: 'x', label: '', align: 'right', render: (g) => g.active && (
              <span className="row-actions">
                <Input type="datetime-local" value={expiry[g.id] || ''} onChange={(e) => setExpiry({ ...expiry, [g.id]: e.target.value })} aria-label={tr('Nueva fecha de vencimiento')} />
                <button type="button" className="btn-link" disabled={!expiry[g.id]} onClick={() => authorize({
                  summary: tr('Cambiar el vencimiento de {product} de {name} al {date}.', { product: g.offer, name: user.name, date: dateTime(expiry[g.id]) }),
                  run: (auth) => api.put(`/admin/general/grants/${g.id}`, { expiresAt: new Date(expiry[g.id]).toISOString(), ...auth }),
                })}>{tr('Modificar vencimiento')}</button>
                <button type="button" className="btn-link danger" onClick={() => authorize({
                  summary: tr('Retirar el acceso {product} de {name}. El servicio se desactiva de inmediato; sus datos se conservan.', { product: g.offer, name: user.name }),
                  run: (auth) => api.post(`/admin/general/grants/${g.id}/revoke`, auth),
                })}>{tr('Retirar acceso')}</button>
              </span>
            ) },
          ]} />
          <h4>{tr('Conceder acceso manual')}</h4>
          <GrantForm user={user} offers={(offers.data || []).filter((o) => o.active)} authorize={authorize} />
        </div>
      )}
    </Card>
  );
}

function ChangeMaster({ authorize }) {
  const [password, setPassword] = useState('');
  return (
    <Card title={tr('Cambiar contraseña maestra')}>
      <div className="inline-form">
        <Field label={tr('Nueva contraseña maestra')} hint={tr('Mínimo 12 caracteres, con letras y números.')}><Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Button variant="secondary" disabled={password.length < 12} onClick={() => authorize({
          summary: tr('Confirme con la contraseña maestra actual para guardar la nueva.'),
          run: (auth) => api.post('/admin/general/change', { password, ...auth }),
          after: () => setPassword(''),
        })}>{tr('Cambiar')}</Button>
      </div>
    </Card>
  );
}

export default function AdminAccessControl() {
  const { user } = useAuth();
  const status = useAsync(() => api.get('/admin/general/status'), []);
  const [action, setAction] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  if (user?.adminLevel !== 'FULL') return <Notice>{tr('Esta sección es exclusiva del Administrador General.')}</Notice>;
  return (
    <>
      <PageHeader kicker={tr('Administración general')} title={tr('Control de accesos')} subtitle={tr('Conceder, modificar y retirar accesos manualmente, con contraseña maestra, autenticador y registro de auditoría.')} />
      <AsyncView {...status} onRetry={status.reload}>
        {(s) => (
          <>
            {!s.configured && <Setup status={s} onDone={status.reload} />}
            {s.configured && !s.isGeneralAdmin && <Notice>{tr('Las operaciones de esta sección son exclusivas del Administrador General ({name}). Usted puede consultar el historial.', { name: s.ownerName })}</Notice>}
            {s.isGeneralAdmin && (
              <>
                <Notice>{tr('Cada concesión sin pago, cambio de vencimiento o retiro le pedirá la contraseña maestra y el código de su autenticador, y quedará registrado en el historial.')}</Notice>
                <Pending key={`p${reloadKey}`} authorize={setAction} />
                <UserAccess authorize={setAction} reloadKey={reloadKey} />
                <ChangeMaster authorize={setAction} />
              </>
            )}
            <Card title={tr('Historial y auditoría')}>
              <EventLog key={`h${reloadKey}`} category="ACCESO" />
            </Card>
          </>
        )}
      </AsyncView>
      {action && (
        <AuthorizeDialog
          action={action}
          onClose={() => setAction(null)}
          onDone={() => { action.after?.(); setAction(null); setReloadKey((k) => k + 1); }}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { date, dateTime, priceMoney } from '../../utils/format.js';
import { Card, PageHeader, Pill, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Field, FormError, FormGrid, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { EventLog } from '../../features/admin/EventLog.jsx';
import { tr } from '../../i18n/tr.js';

const STATES = [
  ['', 'Todos'],
  ['ACTIVO', 'Activos'],
  ['INACTIVOS', 'Inactivos (cancelados y vencidos)'],
  ['CANCELADO', 'Cancelados'],
  ['VENCIDO', 'Vencidos'],
  ['SIN_SUSCRIPCION', 'Sin suscripción'],
];
const STATE_TONE = { ACTIVO: '', CANCELADO: 'bad', VENCIDO: 'warn', SIN_SUSCRIPCION: 'muted' };
const PROMO_TONE = { ACTIVA: '', USADA: 'info', VENCIDA: 'warn', CANCELADA: 'bad' };

const inDays = (n) => {
  const d = new Date(Date.now() + n * 86400000);
  d.setHours(23, 59, 0, 0);
  return d.toISOString().slice(0, 16);
};

function PromotionModal({ user, onClose, onSaved }) {
  const offers = useAsync(() => api.get('/admin/pricing'), []);
  const [f, setF] = useState({ offerCode: '', discountPercent: 50, validUntil: inDays(15), message: '', send: !user.marketingOptOut });
  const [state, setState] = useState({ busy: false, error: null });
  const offer = (offers.data || []).find((o) => o.code === f.offerCode);
  const final = offer?.price === null || offer?.price === undefined ? null : (offer.price * (100 - Number(f.discountPercent || 0))) / 100;
  const firstName = user.name.split(' ')[0];
  const defaultMessage = tr('Hola {name}, queremos invitarte a regresar a QLC. Reactiva tu acceso con un beneficio especial del {pct}% de descuento en tu renovación.', { name: firstName, pct: f.discountPercent });
  const save = async () => {
    setState({ busy: true, error: null });
    try {
      await api.post('/admin/promotions', { userId: user.id, offerCode: f.offerCode, discountPercent: Number(f.discountPercent), validUntil: new Date(f.validUntil).toISOString(), message: f.message || defaultMessage, send: f.send });
      onSaved();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Modal open wide title={tr('Promoción de recuperación · {name}', { name: user.name })} onClose={onClose}
      footer={<Button onClick={save} loading={state.busy} disabled={!f.offerCode}>{f.send ? tr('Generar y enviar promoción') : tr('Generar código')}</Button>}>
      <div className="stack">
        <FormGrid>
          <Field label={tr('Producto al que aplica')}>
            <Select value={f.offerCode} onChange={(e) => setF({ ...f, offerCode: e.target.value })} placeholder={tr('Selecciona…')} options={(offers.data || []).filter((o) => o.active).map((o) => ({ value: o.code, label: `${o.name}${o.price !== null ? ` · ${priceMoney(o.price)}` : ''}` }))} />
          </Field>
          <Field label={tr('Descuento (%)')}><Input type="number" min="1" max="100" value={f.discountPercent} onChange={(e) => setF({ ...f, discountPercent: e.target.value })} /></Field>
          <Field label={tr('Vigente hasta')}><Input type="datetime-local" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} /></Field>
          <Field label={tr('Precio con descuento')}><Input readOnly value={final === null ? '—' : priceMoney(final)} /></Field>
        </FormGrid>
        <Field label={tr('Mensaje del correo')} hint={tr('Si lo dejas vacío se usa el mensaje sugerido.')}><Textarea rows={3} maxLength={600} value={f.message} placeholder={defaultMessage} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
        <label className="check">
          <input type="checkbox" checked={f.send} disabled={user.marketingOptOut} onChange={(e) => setF({ ...f, send: e.target.checked })} />
          {user.marketingOptOut ? tr('Este usuario pidió no recibir promociones por correo: el código se genera para compartirlo por otro medio.') : tr('Enviar la promoción por correo electrónico')}
        </label>
        <p className="small muted">{tr('Al pagar con este código, la pasarela confirma el cobro pero el acceso no se activa solo: queda pendiente para que el Administrador General lo autorice en Control de accesos.')}</p>
        <FormError error={state.error} />
      </div>
    </Modal>
  );
}

function Promotions({ reloadKey, onChanged }) {
  const { user } = useAuth();
  const res = useAsync(() => api.get('/admin/promotions'), [reloadKey]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const canEdit = ['EDIT', 'FULL'].includes(user?.adminLevel);
  const act = async (id, action) => {
    setBusy(id);
    setError(null);
    try {
      await api.post(`/admin/promotions/${id}/${action}`);
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  };
  return (
    <Card title={tr('Promociones personalizadas')}>
      <FormError error={error} />
      <AsyncView {...res} onRetry={res.reload}>
        {(rows) => (
          <DataTable rows={rows} empty={tr('Aún no hay promociones.')} columns={[
            { key: 'createdAt', label: tr('Creada'), render: (p) => date(p.createdAt) },
            { key: 'user', label: tr('Usuario'), render: (p) => <>{p.user.name}<span className="small block">{p.user.email}</span></> },
            { key: 'offer', label: tr('Producto'), render: (p) => p.offer.name },
            { key: 'discount', label: tr('Descuento'), render: (p) => `${p.discountPercent}% · ${p.finalPrice === null ? '—' : priceMoney(p.finalPrice)}` },
            { key: 'code', label: tr('Código'), render: (p) => <b className="mono">{p.code}</b> },
            { key: 'validUntil', label: tr('Vigencia'), render: (p) => dateTime(p.validUntil) },
            { key: 'status', label: tr('Estado'), render: (p) => <><Pill variant={PROMO_TONE[p.status]}>{tr({ ACTIVA: 'Activa', USADA: 'Utilizada', VENCIDA: 'Vencida', CANCELADA: 'Cancelada' }[p.status])}</Pill>{p.emailedAt && <span className="small block">{tr('Enviada {date}', { date: date(p.emailedAt) })}</span>}{p.authorization === 'PENDING' && <span className="small block warn-text">{tr('Pago pendiente de autorización')}</span>}</> },
            { key: 'x', label: '', align: 'right', render: (p) => canEdit && p.status === 'ACTIVA' && (
              <span className="row-actions">
                {!p.user.marketingOptOut && <button type="button" className="btn-link" disabled={busy === p.id} onClick={() => act(p.id, 'send')}>{tr('Reenviar')}</button>}
                <button type="button" className="btn-link danger" disabled={busy === p.id} onClick={() => act(p.id, 'cancel')}>{tr('Cancelar')}</button>
              </span>
            ) },
          ]} />
        )}
      </AsyncView>
    </Card>
  );
}

function RetentionCard() {
  const { user } = useAuth();
  const res = useAsync(() => api.get('/admin/retention'), []);
  const [state, setState] = useState({ busy: false, error: null });
  const canEdit = user?.adminLevel === 'FULL';
  const toggle = async (enabled) => {
    if (!enabled && !window.confirm(tr('¿Desactivar los avisos y la eliminación automática de cuentas sin renovar?'))) return;
    setState({ busy: true, error: null });
    try {
      await api.put('/admin/retention', { enabled });
      await res.reload();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Card title={tr('Avisos de renovación y eliminación de cuentas')}>
      <AsyncView {...res} onRetry={res.reload}>
        {(d) => (
          <div className="stack">
            <label className="check">
              <input type="checkbox" checked={d.enabled} disabled={!canEdit || state.busy} onChange={(e) => toggle(e.target.checked)} />
              {' '}{tr('Avisar por correo y eliminar la cuenta si el cliente no renueva en 30 días')}
            </label>
            <p className="small muted">{tr('Cuando termina la suscripción, el cliente recibe un correo a los 10 días (le quedan 20), a los 20 días (le quedan 10) y a los 29 días (le queda 1). Si no renueva al día 30, el sistema elimina su cuenta y toda su información. Mientras Gmail no esté conectado no se envían avisos, no corre el conteo y no se elimina ninguna cuenta.')}</p>
            {d.since && <p className="small muted">{tr('Activo desde {date}. Los clientes que ya estaban vencidos cuentan sus 30 días a partir de esa fecha.', { date: date(d.since) })}</p>}
            <FormError error={state.error} />
          </div>
        )}
      </AsyncView>
    </Card>
  );
}

export default function AdminSubscribers() {
  const { user } = useAuth();
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [promoFor, setPromoFor] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const params = new URLSearchParams({ ...(state ? { state } : {}), ...(q.trim() ? { q: q.trim() } : {}) }).toString();
  const res = useAsync(() => api.get(`/admin/subscribers${params ? `?${params}` : ''}`), [params, reloadKey]);
  const counts = res.data?.counts || {};
  const canEdit = ['EDIT', 'FULL'].includes(user?.adminLevel);
  return (
    <>
      <PageHeader kicker={tr('Comercial')} title={tr('Suscriptores')} subtitle={tr('Quién está suscrito, quién canceló o dejó de pagar, y recuperación con promociones personalizadas.')} />
      <StatGrid cols={4}>
        <StatCard label={tr('Activos')} value={counts.ACTIVO ?? '—'} />
        <StatCard label={tr('Cancelados')} value={counts.CANCELADO ?? '—'} />
        <StatCard label={tr('Vencidos')} value={counts.VENCIDO ?? '—'} />
        <StatCard label={tr('Sin suscripción')} value={counts.SIN_SUSCRIPCION ?? '—'} />
      </StatGrid>
      <RetentionCard />
      <Card>
        <div className="inline-form">
          <Select value={state} onChange={(e) => setState(e.target.value)} options={STATES.map(([value, label]) => ({ value, label: tr(label) }))} aria-label={tr('Estado')} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Buscar por nombre o correo')} />
        </div>
        <AsyncView {...res} onRetry={res.reload}>
          {(data) => (
            <DataTable rows={data.rows} empty={tr('Sin usuarios en este filtro.')} columns={[
              { key: 'name', label: tr('Suscriptor'), render: (r) => <Link to={`/admin/clientes/${r.id}`}>{r.name}<span className="small block">{r.email}</span></Link> },
              { key: 'state', label: tr('Estado'), render: (r) => <><Pill variant={STATE_TONE[r.state]}>{tr(r.stateLabel)}</Pill>{r.pendingAuthorization && <span className="small block warn-text">{tr('Pago promocional por autorizar')}</span>}</> },
              { key: 'product', label: tr('Producto'), render: (r) => r.product || '—' },
              { key: 'expiresAt', label: tr('Vence / venció'), render: (r) => (r.expiresAt ? date(r.expiresAt) : '—') },
              { key: 'lastPayment', label: tr('Último pago'), render: (r) => (r.lastPayment ? <>{r.lastPayment.amount === null ? '—' : priceMoney(r.lastPayment.amount)}<span className="small block">{date(r.lastPayment.date)}</span></> : '—') },
              { key: 'promos', label: tr('Promociones'), render: (r) => (r.promotionsSent ? tr('{n} enviadas · {u} usadas', { n: r.promotionsSent, u: r.promotionsUsed }) : '—') },
              { key: 'x', label: '', align: 'right', render: (r) => (
                <span className="row-actions">
                  <button type="button" className="btn-link" onClick={() => setHistoryFor(r)}>{tr('Historial')}</button>
                  {canEdit && <button type="button" className="btn-link" onClick={() => setPromoFor(r)}>{tr('Enviar promoción')}</button>}
                </span>
              ) },
            ]} />
          )}
        </AsyncView>
      </Card>
      <Promotions reloadKey={reloadKey} onChanged={() => setReloadKey((k) => k + 1)} />
      <Card title={tr('Movimientos y notificaciones')}>
        <p className="small muted">{tr('Cada contratación, activación, renovación, vencimiento, cancelación, pago fallido y recuperación se guarda aquí y también se envía al correo administrativo.')}</p>
        <EventLog key={reloadKey} />
      </Card>
      {promoFor && <PromotionModal user={promoFor} onClose={() => setPromoFor(null)} onSaved={() => { setPromoFor(null); setReloadKey((k) => k + 1); }} />}
      {historyFor && (
        <Modal open wide title={tr('Historial · {name}', { name: historyFor.name })} onClose={() => setHistoryFor(null)}>
          <EventLog userId={historyFor.id} />
        </Modal>
      )}
    </>
  );
}

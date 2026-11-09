import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { date, dateTime } from '../../utils/format.js';
import { Card, PageHeader, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Field, FormError, Input, Select } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { giftPill } from '../../features/gifts/ClientCommerce.jsx';
import { tr } from '../../i18n/tr.js';

const FILTERS = [['', 'Todos'], ['DISPONIBLE', 'Disponibles'], ['ACTIVADO', 'Activados'], ['VENCIDO', 'Vencidos'], ['CANCELADO', 'Cancelados']];

function Settings() {
  const { user } = useAuth();
  const res = useAsync(() => api.get('/admin/gifts/settings'), []);
  const [days, setDays] = useState(null);
  const [state, setState] = useState({ busy: false, error: null, saved: false });
  const value = days ?? res.data?.redeemDays ?? '';
  const save = async () => {
    setState({ busy: true, error: null, saved: false });
    try {
      await api.put('/admin/gifts/settings', { redeemDays: Number(value) });
      setState({ busy: false, error: null, saved: true });
      res.reload();
    } catch (error) {
      setState({ busy: false, error, saved: false });
    }
  };
  return (
    <Card title={tr('Vigencia de canje')}>
      <p className="small muted">{tr('Tiempo que tiene la persona para activar un código desde que se compra. El periodo del acceso empieza cuando se activa, no cuando se compra. Aplica a los códigos nuevos.')}</p>
      <div className="inline-form">
        <Field label={tr('Días para canjear')}><Input type="number" min="7" max="1095" value={value} disabled={user?.adminLevel !== 'FULL'} onChange={(e) => setDays(e.target.value)} /></Field>
        {user?.adminLevel === 'FULL' && <Button variant="secondary" loading={state.busy} onClick={save}>{tr('Guardar')}</Button>}
        {state.saved && <span className="small">{tr('Guardado')}</span>}
      </div>
      <FormError error={state.error} />
    </Card>
  );
}

export default function AdminGifts() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [cancel, setCancel] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });
  const res = useAsync(() => api.get(`/admin/gifts${status ? `?status=${status}` : ''}`), [status]);
  const all = useAsync(() => api.get('/admin/gifts'), [res.data]);
  const count = (s) => (all.data || []).filter((g) => g.status === s).length;
  const confirm = async () => {
    setState({ busy: true, error: null });
    try {
      await api.post(`/admin/gifts/${cancel.id}/cancel`);
      setCancel(null);
      setState({ busy: false, error: null });
      res.reload();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <>
      <PageHeader kicker={tr('Comercial')} title={tr('Regalos · QLC Gift Access')} subtitle={tr('Códigos de regalo comprados, quién los compró, quién los activó y su estado.')}
        actions={<Select className="month" value={status} onChange={(e) => setStatus(e.target.value)} options={FILTERS.map(([value, label]) => ({ value, label: tr(label) }))} aria-label={tr('Estado')} />} />
      <StatGrid cols={4}>
        <StatCard label={tr('Disponibles')} value={count('DISPONIBLE')} />
        <StatCard label={tr('Activados')} value={count('ACTIVADO')} />
        <StatCard label={tr('Vencidos')} value={count('VENCIDO')} />
        <StatCard label={tr('Cancelados')} value={count('CANCELADO')} />
      </StatGrid>
      <Card>
        <FormError error={state.error} />
        <AsyncView {...res} onRetry={res.reload}>
          {(rows) => (
            <DataTable rows={rows} empty={tr('Aún no hay códigos de regalo.')} columns={[
              { key: 'code', label: tr('Código'), render: (g) => <b className="mono">{g.code}</b> },
              { key: 'product', label: tr('Producto'), render: (g) => g.product },
              { key: 'duration', label: tr('Duración'), render: (g) => tr(g.duration) },
              { key: 'purchaser', label: tr('Comprador'), render: (g) => <>{g.purchaser?.name}<span className="small block">{g.purchaser?.email}</span></> },
              { key: 'recipient', label: tr('Destinatario'), render: (g) => (g.recipient ? <>{g.recipient.name}<span className="small block">{g.recipient.email}</span></> : g.recipientName ? <span className="small">{tr('Para')} {g.recipientName}</span> : '—') },
              { key: 'createdAt', label: tr('Compra'), render: (g) => dateTime(g.createdAt) },
              { key: 'activatedAt', label: tr('Activación'), render: (g) => (g.activatedAt ? dateTime(g.activatedAt) : '—') },
              { key: 'expiresAt', label: tr('Vencimiento'), render: (g) => (g.expiresAt ? date(g.expiresAt) : <span className="small">{tr('Canje hasta {date}', { date: date(g.redeemBy) })}</span>) },
              { key: 'status', label: tr('Estado'), render: (g) => giftPill(g.status) },
              { key: 'x', label: '', align: 'right', render: (g) => user?.adminLevel === 'FULL' && g.status === 'DISPONIBLE' && <button type="button" className="btn-link danger" onClick={() => setCancel(g)}>{tr('Cancelar')}</button> },
            ]} />
          )}
        </AsyncView>
      </Card>
      <Settings />
      <ConfirmDialog open={!!cancel} danger title={tr('Cancelar código de regalo')} loading={state.busy}
        message={tr('El código {code} quedará invalidado y ya no podrá canjearse.', { code: cancel?.code })} onConfirm={confirm} onClose={() => setCancel(null)} />
    </>
  );
}

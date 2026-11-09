import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, priceMoney } from '../../utils/format.js';
import { PAYMENT_STATUS } from '../../utils/labels.js';
import { Card, PageHeader, Pill, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { BitgetReports } from '../../features/admin/BitgetReports.jsx';
import { tr } from '../../i18n/tr.js';

const statusOptions = [{ value: '', label: 'Todos' }, ...Object.entries(PAYMENT_STATUS).map(([value, label]) => ({ value, label }))];

export default function AdminPayments() {
  const [status, setStatus] = useState('');
  const res = useAsync(() => api.get(`/admin/payments${status ? `?status=${status}` : ''}`), [status]);
  const rows = res.data || [];
  const by = (s) => rows.filter((r) => r.status === s).length;
  return (
    <>
      <PageHeader
        kicker={tr('Comercial')}
        title={tr('Pagos')}
        subtitle={tr('Intentos de pago por Mercado Pago, transferencia Bitget, pasarelas anteriores o modo de prueba.')}
        actions={<Select className="month" value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} aria-label={tr('Estado')} />}
      />
      <StatGrid cols={3}>
        <StatCard label={tr('Aprobados')} value={by('APPROVED')} />
        <StatCard label={tr('Rechazados')} value={by('REJECTED')} />
        <StatCard label={tr('Pendientes')} value={by('PENDING')} />
      </StatGrid>
      <BitgetReports onChanged={res.reload} />
      <Card>
        <AsyncView {...res} onRetry={res.reload}>
          {(list) => (
            <DataTable rows={list} empty={tr('Sin intentos de pago.')} columns={[
              { key: 'createdAt', label: tr('Fecha'), render: (a) => dateTime(a.createdAt) },
              { key: 'user', label: tr('Cliente'), render: (a) => <Link to={`/admin/clientes/${a.user.id}`}>{tr(a.user.name)}<span className="small block">{a.user.email}</span></Link> },
              { key: 'offer', label: tr('Producto'), render: (a) => `${a.offer?.name || ''}${a.quantity > 1 ? ` × ${a.quantity}` : ''}${a.kind === 'GIFT' ? ` · ${tr('Regalo')}` : a.kind === 'PROMO' ? ` · ${tr('Promoción')}` : ''}` },
              { key: 'amount', label: tr('Monto'), align: 'right', render: (a) => (a.amount === null ? tr('Por definir') : `${priceMoney(a.amount)} ${a.currency}${a.chargedAmount !== null && a.chargedAmount !== undefined && a.chargedCurrency !== a.currency ? ` · ${priceMoney(a.chargedAmount)} ${a.chargedCurrency}` : ''}`) },
              { key: 'provider', label: tr('Proveedor'), render: (a) => ({ MOCK: tr('Simulado'), PAYPAL: 'PayPal', DLOCALGO: 'dLocal Go', BITGET: 'Bitget' }[a.provider] || 'Mercado Pago') },
              { key: 'status', label: tr('Estado'), render: (a) => <Pill variant={a.status === 'APPROVED' ? '' : a.status === 'REJECTED' ? 'bad' : 'warn'}>{tr(PAYMENT_STATUS[a.status])}</Pill> },
            ]} />
          )}
        </AsyncView>
      </Card>
    </>
  );
}

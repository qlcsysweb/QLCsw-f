import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, priceMoney } from '../../utils/format.js';
import { Pill } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';

export const ACTORS = { ADMIN: 'Administrador', PASARELA: 'Pasarela', SISTEMA: 'Sistema', CLIENTE: 'Cliente' };
export const CATEGORIES = { SUSCRIPCION: 'Suscripciones', PROMOCION: 'Promociones', ACCESO: 'Control de accesos', REGALO: 'Regalos', PLATAFORMA: 'Clientes y academia' };
const PERIODS = { ANUAL: 'Anual', MENSUAL: 'Mensual' };

const tone = (type) => (['PAGO_FALLIDO', 'VENCIDA', 'CANCELADA', 'ACCESO_RETIRADO', 'AUTORIZACION_FALLIDA', 'IMPORTE_NO_COINCIDE', 'AUTORIZACION_RECHAZADA', 'REGALO_CANCELADO', 'PROMOCION_CANCELADA'].includes(type)
  ? 'bad'
  : ['PAGO_PROMOCIONAL', 'VENCIMIENTO_MODIFICADO'].includes(type) ? 'warn' : '');

export function EventLog({ category = '', userId = '', fixedCategory = false, empty }) {
  const [cat, setCat] = useState(category);
  const params = new URLSearchParams({ ...(cat ? { category: cat } : {}), ...(userId ? { userId } : {}) }).toString();
  const res = useAsync(() => api.get(`/admin/events${params ? `?${params}` : ''}`), [params]);
  return (
    <>
      {!fixedCategory && (
        <div className="inline-form">
          <Select value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: '', label: tr('Todos los movimientos') }, ...Object.entries(CATEGORIES).map(([value, label]) => ({ value, label: tr(label) }))]} aria-label={tr('Tipo de movimiento')} />
        </div>
      )}
      <AsyncView {...res} onRetry={res.reload}>
        {(rows) => (
          <DataTable rows={rows} empty={empty || tr('Sin movimientos registrados.')} columns={[
            { key: 'createdAt', label: tr('Fecha'), render: (e) => dateTime(e.createdAt) },
            { key: 'label', label: tr('Evento'), render: (e) => <Pill variant={tone(e.type)}>{tr(e.label)}</Pill> },
            { key: 'user', label: tr('Usuario'), render: (e) => (e.userName ? <>{e.userName}<span className="small block">{e.userEmail}</span></> : '—') },
            { key: 'product', label: tr('Producto'), render: (e) => (e.product ? `${tr(e.product)}${e.period ? ` · ${tr(PERIODS[e.period] || e.period)}` : ''}` : '—') },
            { key: 'status', label: tr('Estado'), render: (e) => e.status || '—' },
            { key: 'amount', label: tr('Importe'), align: 'right', render: (e) => (e.amount === null ? '—' : priceMoney(e.amount)) },
            { key: 'actor', label: tr('Responsable'), render: (e) => <>{tr(ACTORS[e.actorType] || e.actorType)}<span className="small block">{e.actorName}</span></> },
            { key: 'result', label: tr('Resultado'), render: (e) => <span className="small">{e.result || '—'}</span> },
          ]} />
        )}
      </AsyncView>
    </>
  );
}

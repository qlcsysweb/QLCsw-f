import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, priceMoney } from '../../utils/format.js';
import { Card, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Select, Textarea } from '../../components/ui/Form.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { openEvidence, REPORT_VARIANT } from '../access/BitgetPayment.jsx';
import { tr } from '../../i18n/tr.js';

const OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'REVIEW', label: 'En revisión' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'REJECTED', label: 'Rechazado' },
];

export function BitgetReports({ onChanged }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [state, setState] = useState({ busy: false, error: null });
  const res = useAsync(() => api.get(`/admin/bitget-reports${status ? `?status=${status}` : ''}`), [status]);
  const full = user?.adminLevel === 'FULL';
  const canEdit = full || user?.adminLevel === 'EDIT';

  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      await fn();
      setState({ busy: false, error: null });
      setRejecting(null);
      setReason('');
      res.reload();
      onChanged?.();
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  const confirmPay = (r) => {
    if (window.confirm(tr('Se confirmará el pago de {name} y se activará su acceso. ¿Continuar?', { name: r.user.name }))) run(() => api.post(`/admin/bitget-reports/${r.id}/confirm`, {}));
  };
  const remove = (r) => {
    if (window.confirm(tr('Se borrará el reporte y sus archivos para que el cliente envíe uno nuevo. ¿Continuar?'))) run(() => api.del(`/admin/bitget-reports/${r.id}`));
  };

  return (
    <Card title={tr('Transferencias internas Bitget')}>
      <div className="stack">
        <Field label={tr('Estado')}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={OPTIONS.map((o) => ({ ...o, label: tr(o.label) }))} />
        </Field>
        <FormError error={state.error} />
        <AsyncView {...res} onRetry={res.reload}>
          {(data) => (
            <DataTable rows={data.rows} empty={tr('Sin transferencias reportadas.')} columns={[
              { key: 'createdAt', label: tr('Reportado'), render: (r) => dateTime(r.createdAt) },
              { key: 'user', label: tr('Cliente'), render: (r) => <Link to={`/admin/clientes/${r.user.id}`}>{r.user.name}<span className="small block">{r.user.email}</span></Link> },
              { key: 'product', label: tr('Producto'), render: (r) => <>{tr(r.attempt?.product || '')}<span className="small block">{`${priceMoney(r.attempt?.amount)} ${r.attempt?.currency || ''}`}</span></> },
              { key: 'order', label: tr('Comprobante'), render: (r) => <span className="wallet-order">{r.orderNumber}<span className="small block">{dateTime(r.transferredAt)}</span></span> },
              { key: 'files', label: tr('Evidencia'), render: (r) => r.files.map((file) => <button key={file.id} type="button" className="btn-link block" onClick={() => openEvidence(`/admin/bitget-files/${file.id}`)}>{file.name}</button>) },
              { key: 'status', label: tr('Estado'), render: (r) => <><Pill variant={REPORT_VARIANT[r.status]}>{tr(r.statusLabel)}</Pill>{r.rejectReason && <span className="small block">{r.rejectReason}</span>}</> },
              { key: 'actions', label: tr('Acciones'), render: (r) => (
                <div className="stack">
                  {canEdit && r.status === 'PENDING' && <Button loading={state.busy} onClick={() => run(() => api.post(`/admin/bitget-reports/${r.id}/received`, {}))}>{tr('Transferencia recibida')}</Button>}
                  {full && r.status === 'REVIEW' && <Button loading={state.busy} onClick={() => confirmPay(r)}>{tr('Confirmar pago')}</Button>}
                  {canEdit && ['PENDING', 'REVIEW'].includes(r.status) && <Button variant="secondary" loading={state.busy} onClick={() => setRejecting(r)}>{tr('Rechazar')}</Button>}
                  {canEdit && ['CONFIRMED', 'REJECTED'].includes(r.status) && <Button variant="secondary" loading={state.busy} onClick={() => run(() => api.post(`/admin/bitget-reports/${r.id}/hide`, {}))}>{tr('Borrar del historial')}</Button>}
                  {full && r.status !== 'CONFIRMED' && <Button variant="danger" loading={state.busy} onClick={() => remove(r)}>{tr('Eliminar reporte')}</Button>}
                </div>
              ) },
            ]} />
          )}
        </AsyncView>
      </div>
      <Modal
        open={!!rejecting}
        title={tr('Rechazar reporte')}
        onClose={() => setRejecting(null)}
        footer={<><Button variant="secondary" onClick={() => setRejecting(null)}>{tr('Cancelar')}</Button><Button variant="danger" loading={state.busy} onClick={() => run(() => api.post(`/admin/bitget-reports/${rejecting.id}/reject`, { reason: reason.trim() || undefined }))}>{tr('Rechazar')}</Button></>}
      >
        <Field label={tr('Motivo (opcional)')} hint={tr('El cliente lo verá para corregir su reporte.')}>
          <Textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>
    </Card>
  );
}

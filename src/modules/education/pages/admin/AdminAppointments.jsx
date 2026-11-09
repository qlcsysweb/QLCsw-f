import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { APPOINTMENT_DURATIONS, fromUtcInputs, utcDateInput, utcDateTime, utcTimeInput } from '../../utils/format.js';
import { APPOINTMENT_CHANNELS, APPOINTMENT_STATUS } from '../../utils/labels.js';
import { Card, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Field, FormError, FormGrid, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';

const statusOptions = Object.entries(APPOINTMENT_STATUS).map(([value, label]) => ({ value, label }));


function EditAppointment({ appt, onClose, onSaved }) {
  const [f, setF] = useState({ status: appt.status, date: utcDateInput(appt.scheduledAt), time: utcTimeInput(appt.scheduledAt), durationMin: appt.durationMin, adminNotes: appt.adminNotes || '' });
  const [state, setState] = useState({ busy: false, error: null });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null });
    try {
      await api.patch(`/admin/appointments/${appt.id}`, {
        status: f.status, scheduledAt: fromUtcInputs(f.date, f.time), durationMin: Number(f.durationMin), adminNotes: f.adminNotes || null,
      });
      onSaved();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Modal open title={tr('Cita de {name}', { name: appt.user.name })} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <p className="muted small">{tr(appt.reason)} · {tr(APPOINTMENT_CHANNELS[appt.channel])}{appt.notes ? ` · “${appt.notes}”` : ''}</p>
        <FormGrid>
          <Field label={tr('Estado')}><Select value={f.status} onChange={set('status')} options={statusOptions} /></Field>
          <Field label={tr('Duración')}><Select value={f.durationMin} onChange={set('durationMin')} options={APPOINTMENT_DURATIONS.map((m) => ({ value: m, label: `${m} minutos` }))} /></Field>
          <Field label={tr('Fecha')}><Input type="date" value={f.date} onChange={set('date')} /></Field>
          <Field label={tr('Hora')}><Input type="time" value={f.time} onChange={set('time')} /></Field>
          <Field label={tr('Notas del asesor')} full><Textarea value={f.adminNotes} onChange={set('adminNotes')} maxLength={1000} /></Field>
        </FormGrid>
        <FormError error={state.error} />
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button>
          <Button type="submit" loading={state.busy}>{tr('Guardar')}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminAppointments() {
  const { user } = useAuth();
  const [status, setStatus] = useState('PENDING');
  const [editing, setEditing] = useState(null);
  const res = useAsync(() => api.get(`/admin/appointments${status ? `?status=${status}` : ''}`), [status]);
  const canEdit = ['EDIT', 'FULL'].includes(user?.adminLevel);

  return (
    <>
      <PageHeader title={tr('Citas de asesoría')} subtitle={tr('Consulta y gestiona las solicitudes de los clientes')}
        actions={<Select className="month" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: tr('Todas') }, ...statusOptions]} aria-label={tr('Filtrar por estado')} />} />
      <Card>
        <AsyncView {...res} onRetry={res.reload}>
          {(list) => (
            <DataTable rows={list} empty={tr('Sin citas en este estado.')} columns={[
              { key: 'scheduledAt', label: tr('Fecha'), render: (a) => utcDateTime(a.scheduledAt) },
              { key: 'user', label: tr('Cliente'), render: (a) => <Link to={`/admin/clientes/${a.user.id}`}>{tr(a.user.name)}<span className="small block">{a.user.email}{a.user.phone ? ` · ${a.user.phone}` : ''}</span></Link> },
              { key: 'reason', label: tr('Motivo') },
              { key: 'channel', label: tr('Canal'), render: (a) => `${APPOINTMENT_CHANNELS[a.channel]} · ${a.durationMin} min` },
              { key: 'status', label: tr('Estado'), render: (a) => <Pill variant={a.status === 'PENDING' ? 'warn' : a.status === 'CANCELLED' ? 'bad' : ''}>{tr(APPOINTMENT_STATUS[a.status])}</Pill> },
              { key: 'x', label: '', render: (a) => canEdit && <button className="btn-link" onClick={() => setEditing(a)}>{tr('Gestionar')}</button> },
            ]} />
          )}
        </AsyncView>
      </Card>
      {editing && <EditAppointment appt={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); res.reload(); }} />}
    </>
  );
}

import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { APPOINTMENT_DURATIONS, fromUtcInputs, utcDateTime } from '../../utils/format.js';
import { APPOINTMENT_CHANNELS, APPOINTMENT_REASONS, APPOINTMENT_STATUS } from '../../utils/labels.js';
import { Card, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Field, FormError, FormGrid, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { DataShareCard } from '../../features/share/DataShare.jsx';
import { api as rootApi } from '../../api/client.js';
import { CheckoutModal, offerPrice } from '../../features/access/CheckoutModal.jsx';

const STATUS_VARIANT = { PENDING: 'warn', CONFIRMED: '', COMPLETED: '', CANCELLED: 'bad' };

function RequestForm({ onDone, onCancel }) {
  const { api } = useWorkspace();
  const [f, setF] = useState({ reason: APPOINTMENT_REASONS[0], date: '', time: '', durationMin: 60, notes: '' });
  const [state, setState] = useState({ saving: false, error: null });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ saving: true, error: null });
    try {
      const scheduledAt = fromUtcInputs(f.date, f.time);
      await api.post('/appointments', { reason: f.reason, scheduledAt, durationMin: Number(f.durationMin), channel: 'CHAT_INTERNO', notes: f.notes || null });
      onDone();
    } catch (error) {
      setState({ saving: false, error });
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <FormGrid>
        <Field label={tr('Motivo')} full><Select value={f.reason} onChange={set('reason')} options={APPOINTMENT_REASONS.map((r) => ({ value: r, label: r }))} /></Field>
        <Field label={tr('Fecha (UTC)')}><Input type="date" required value={f.date} onChange={set('date')} min={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label={tr('Hora (UTC, formato 24 h)')} hint={tr('Hora universal coordinada. Ahora son las {time} UTC.', { time: new Date().toISOString().slice(11, 16) })}><Input type="time" required value={f.time} onChange={set('time')} /></Field>
        <Field label={tr('Duración')} hint={tr('Cada bloque de 20 minutos usa una sesión disponible.')}><Select value={f.durationMin} onChange={set('durationMin')} options={APPOINTMENT_DURATIONS.map((m) => ({ value: m, label: `${m} minutos` }))} /></Field>
        <Field label={tr('Canal de atención')} hint={tr('La asesoría se atiende por el chat interno de la plataforma.')}><Input value={tr('Chat interno')} readOnly /></Field>
        <Field label={tr('Notas (opcional)')} full><Textarea value={f.notes} onChange={set('notes')} maxLength={1000} /></Field>
      </FormGrid>
      <FormError error={state.error} />
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>{tr('Cancelar')}</Button>
        <Button type="submit" loading={state.saving}>{tr('Solicitar cita')}</Button>
      </div>
    </form>
  );
}

export default function Advisory() {
  const { api, canEdit, isAdminView } = useWorkspace();
  const { user, accessInfo } = useAuth();
  const res = useAsync(() => api.get('/appointments'), [api]);
  const client = !isAdminView && user?.role === 'CLIENT';
  const credits = useAsync(() => (client ? rootApi.get('/payments/credits') : Promise.resolve(null)), [client]);
  const offer = (accessInfo?.offers || []).find((o) => o.code === 'ORIENTACION');
  const [open, setOpen] = useState(false);
  const [buy, setBuy] = useState(false);
  const sessions = credits.data?.ORIENTACION || 0;
  const cancel = async (a) => {
    if (!window.confirm(tr('¿Cancelar esta cita?'))) return;
    await api.post(`/appointments/${a.id}/cancel`);
    res.reload();
  };

  return (
    <>
      <PageHeader title={tr('Asesoría personalizada')} subtitle={tr('Sesiones educativas con cita')}
        actions={canEdit && <Button onClick={() => setOpen(true)} disabled={client && !sessions}>{tr('Solicitar cita')}</Button>} />
      {client && (
        <Card title={tr('Mis sesiones de orientación')}>
          <p>{tr('Tienes {n} sesión(es) de 20 minutos disponible(s).', { n: sessions })}{' '}{offer && tr('Cada sesión adicional cuesta {price}. QLC Diamond Access incluye 6 sesiones.', { price: offerPrice(offer) })}</p>
          {offer && <div className="form-actions"><Button variant="secondary" onClick={() => setBuy(true)}>{tr('Adquirir sesiones')}</Button></div>}
        </Card>
      )}
      {buy && <CheckoutModal offer={offer} onClose={() => { setBuy(false); credits.reload(); }} />}
      <div className="cards3">
        <div className="module-card"><h3>{tr('Mis finanzas')}</h3><p>{tr('Resolver dudas sobre ingresos, gastos, ahorro y estructura financiera.')}</p></div>
        <div className="module-card"><h3>{tr('Mi portafolio de inversión')}</h3><p>{tr('Revisar conceptos de diversificación, distribución y lectura de resultados.')}</p></div>
        <div className="module-card"><h3>{tr('Educación financiera')}</h3><p>{tr('Profundizar en los conceptos estudiados dentro de la academia.')}</p></div>
      </div>
      {!isAdminView && user?.role === 'CLIENT' && <DataShareCard />}
      <AsyncView {...res} onRetry={res.reload}>
        {(list) => (
          <Card title={tr('Mis citas')}>
            <DataTable rows={list} empty={tr('Sin citas solicitadas.')} columns={[
              { key: 'scheduledAt', label: tr('Fecha y hora'), render: (a) => utcDateTime(a.scheduledAt) },
              { key: 'reason', label: tr('Motivo') },
              { key: 'channel', label: tr('Canal'), render: (a) => `${APPOINTMENT_CHANNELS[a.channel]} · ${a.durationMin} min` },
              { key: 'status', label: tr('Estado'), render: (a) => <Pill variant={STATUS_VARIANT[a.status]}>{tr(APPOINTMENT_STATUS[a.status])}</Pill> },
              { key: 'adminNotes', label: tr('Notas del asesor'), render: (a) => a.adminNotes || '—' },
              { key: 'x', label: '', render: (a) => canEdit && ['PENDING', 'CONFIRMED'].includes(a.status) && <button className="btn-link danger" onClick={() => cancel(a)}>{tr('Cancelar')}</button> },
            ]} />
          </Card>
        )}
      </AsyncView>
      <p className="small muted">{tr('La asesoría es educativa y de planificación financiera dentro del alcance del servicio; no constituye recomendación de inversión.')}</p>
      <Modal open={open} title={tr('Solicitar cita')} onClose={() => setOpen(false)}>
        <RequestForm onCancel={() => setOpen(false)} onDone={() => { setOpen(false); res.reload(); credits.reload(); }} />
      </Modal>
    </>
  );
}

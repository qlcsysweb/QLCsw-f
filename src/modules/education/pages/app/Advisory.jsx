import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppointmentChat } from '../../features/appointments/AppointmentChat.jsx';
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
import { Time24 } from '../../components/ui/Time24.jsx';
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
        <Field label={tr('Hora (UTC, formato 24 h)')} hint={tr('Hora universal coordinada. Ahora son las {time} UTC.', { time: new Date().toISOString().slice(11, 16) })}><Time24 required value={f.time} onChange={(time) => setF({ ...f, time })} /></Field>
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

// Cambia la fecha y hora de una cita sin gastar otra sesión (p. ej. si no se tomó a tiempo).
function RescheduleForm({ appt, onDone, onCancel }) {
  const { api } = useWorkspace();
  const [f, setF] = useState({ date: '', time: '' });
  const [state, setState] = useState({ saving: false, error: null });
  const submit = async (e) => {
    e.preventDefault();
    setState({ saving: true, error: null });
    try {
      await api.post(`/appointments/${appt.id}/reschedule`, { scheduledAt: fromUtcInputs(f.date, f.time) });
      onDone();
    } catch (error) {
      setState({ saving: false, error });
    }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <p className="small muted">{tr('Cita actual: {date} · {n} minutos. Se usan las mismas sesiones; no se descuenta otra.', { date: utcDateTime(appt.scheduledAt), n: appt.durationMin })}</p>
      <FormGrid>
        <Field label={tr('Nueva fecha (UTC)')}><Input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} min={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label={tr('Nueva hora (UTC, formato 24 h)')} hint={tr('Hora universal coordinada. Ahora son las {time} UTC.', { time: new Date().toISOString().slice(11, 16) })}><Time24 required value={f.time} onChange={(time) => setF({ ...f, time })} /></Field>
      </FormGrid>
      <p className="small muted">{tr('La cita vuelve a quedar pendiente hasta que el equipo de QLC la confirme.')}</p>
      <FormError error={state.error} />
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>{tr('Cancelar')}</Button>
        <Button type="submit" loading={state.saving} disabled={!f.date || !f.time}>{tr('Reagendar')}</Button>
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
  const [moving, setMoving] = useState(null);
  const [params, setParams] = useSearchParams();
  const [chatId, setChatId] = useState(() => params.get('chat'));
  useEffect(() => {
    const fromUrl = params.get('chat');
    if (fromUrl) setChatId(fromUrl);
  }, [params]);
  const closeChat = () => {
    setChatId(null);
    if (params.get('chat')) setParams({}, { replace: true });
  };
  const sessions = credits.data?.ORIENTACION || 0;
  const remove = async (a) => {
    if (!window.confirm(tr('¿Borrar esta cita de tu lista? No se puede deshacer.'))) return;
    await api.del(`/appointments/${a.id}`);
    res.reload();
  };
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
              { key: 'chat', label: tr('Chat'), render: (a) => (['CONFIRMED', 'COMPLETED'].includes(a.status)
                ? <Button variant={a.status === 'CONFIRMED' ? undefined : 'secondary'} onClick={() => setChatId(a.id)}>{a.status === 'CONFIRMED' ? tr('Entrar al chat') : tr('Ver chat')}</Button>
                : a.status === 'PENDING' ? <span className="small muted">{tr('Se abre al confirmarse')}</span> : '—') },
              { key: 'x', label: '', render: (a) => canEdit && (['PENDING', 'CONFIRMED'].includes(a.status)
                ? (
                  <span className="stack-inline">
                    <button className="btn-link" onClick={() => setMoving(a)}>{new Date(a.scheduledAt).getTime() + (a.durationMin || 20) * 60000 < Date.now() ? tr('No se tomó · Reagendar') : tr('Reagendar')}</button>
                    <button className="btn-link danger" onClick={() => cancel(a)}>{tr('Cancelar')}</button>
                  </span>
                )
                : <button className="btn-link danger" onClick={() => remove(a)}>{tr('Borrar')}</button>) },
            ]} />
          </Card>
        )}
      </AsyncView>
      <p className="small muted">{tr('La asesoría es educativa y de planificación financiera dentro del alcance del servicio; no constituye recomendación de inversión.')}</p>
      {chatId && <AppointmentChat api={api} base={`/appointments/${chatId}/chat`} filePath={(id) => `/appointments/chat-files/${id}`} mine={isAdminView ? 'ADMIN' : 'CLIENT'} onClose={closeChat} />}
      <Modal open={!!moving} title={tr('Reagendar cita')} onClose={() => setMoving(null)}>
        {moving && <RescheduleForm appt={moving} onCancel={() => setMoving(null)} onDone={() => { setMoving(null); res.reload(); }} />}
      </Modal>
      <Modal open={open} title={tr('Solicitar cita')} onClose={() => setOpen(false)}>
        <RequestForm onCancel={() => setOpen(false)} onDone={() => { setOpen(false); res.reload(); credits.reload(); }} />
      </Modal>
    </>
  );
}

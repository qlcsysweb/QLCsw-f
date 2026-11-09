import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime } from '../../utils/format.js';
import { Card, PageHeader, Pill, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Field, FormError, Select, Textarea } from '../../components/ui/Form.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { tr } from '../../i18n/tr.js';

const STATUS = { PENDING: ['Por responder', 'warn'], ANSWERED: ['Respondido', ''] };
const preview = (text, n = 120) => (text.length > n ? `${text.slice(0, n)}…` : text);

function ReplyModal({ item, canEdit, onClose, onSaved }) {
  const [reply, setReply] = useState(item.adminReply || '');
  const [state, setState] = useState({ busy: false, error: null });
  const save = async () => {
    setState({ busy: true, error: null });
    try {
      await api.patch(`/admin/exercises/${item.id}`, { reply });
      onSaved();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Modal
      open
      title={tr('Módulo {n} · {name}', { n: item.moduleNumber, name: item.user.name })}
      onClose={onClose}
      footer={canEdit ? <><Button variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button><Button loading={state.busy} disabled={!reply.trim()} onClick={save}>{tr('Enviar respuesta')}</Button></> : <Button onClick={onClose}>{tr('Cerrar')}</Button>}
    >
      <div className="stack">
        <p className="small muted">{item.user.email} · {tr(item.moduleTitle)} · {dateTime(item.exerciseAt)}</p>
        <div className="exercise-message">{item.exercise}</div>
        {canEdit ? (
          <Field label={tr('Respuesta para el alumno')} hint={tr('El alumno la verá en la pestaña Ejercicio y avance de este módulo.')}>
            <Textarea rows={5} maxLength={5000} value={reply} onChange={(e) => setReply(e.target.value)} />
          </Field>
        ) : item.adminReply && <div className="exercise-reply"><b>{tr('Respuesta enviada')}</b><p>{item.adminReply}</p></div>}
        <FormError error={state.error} />
      </div>
    </Modal>
  );
}

export default function AdminExercises() {
  const { user } = useAuth();
  const [status, setStatus] = useState('PENDING');
  const [open, setOpen] = useState(null);
  const res = useAsync(() => api.get(`/admin/exercises${status ? `?status=${status}` : ''}`), [status]);
  const canEdit = user?.adminLevel === 'EDIT' || user?.adminLevel === 'FULL';

  return (
    <>
      <PageHeader kicker={tr('Panel administrativo')} title={tr('Ejercicios y dudas')} subtitle={tr('Lo que los alumnos escriben en Ejercicio y avance de cada módulo. Respóndeles por este mismo medio.')} />
      <AsyncView {...res} onRetry={res.reload}>
        {(d) => (
          <>
            <StatGrid cols={2}>
              <StatCard label={tr('Por responder')} value={d.counts.PENDING} accent />
              <StatCard label={tr('Respondidos')} value={d.counts.ANSWERED} />
            </StatGrid>
            <Card>
              <div className="form-grid cols-2">
                <Field label={tr('Estado')}><Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder={tr('Todos')} options={Object.entries(STATUS).map(([value, [label]]) => ({ value, label: tr(label) }))} /></Field>
              </div>
              <DataTable
                rows={d.items}
                empty={tr('No hay registros en este estado.')}
                columns={[
                  { key: 'exerciseAt', label: tr('Fecha'), render: (x) => dateTime(x.exerciseAt) },
                  { key: 'user', label: tr('Alumno'), render: (x) => <><Link to={`/admin/clientes/${x.user.id}`}><b>{x.user.name}</b></Link><span className="small block">{x.user.email}</span></> },
                  { key: 'module', label: tr('Módulo'), render: (x) => `M${x.moduleNumber} · ${tr(x.moduleTitle)}` },
                  { key: 'exercise', label: tr('Mensaje'), render: (x) => preview(x.exercise) },
                  { key: 'status', label: tr('Estado'), render: (x) => { const [label, variant] = STATUS[x.pending ? 'PENDING' : 'ANSWERED']; return <Pill variant={variant}>{tr(label)}</Pill>; } },
                  { key: 'x', label: '', align: 'right', render: (x) => <button type="button" className="btn-link" onClick={() => setOpen(x)}>{canEdit ? tr('Responder') : tr('Ver')}</button> },
                ]}
              />
            </Card>
          </>
        )}
      </AsyncView>
      {open && <ReplyModal item={open} canEdit={canEdit} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); res.reload(); }} />}
      <PaidQuestions canEdit={canEdit} />
    </>
  );
}

function AnswerModal({ item, canEdit, onClose, onSaved }) {
  const [answer, setAnswer] = useState(item.answer || '');
  const [state, setState] = useState({ busy: false, error: null });
  const save = async () => {
    setState({ busy: true, error: null });
    try {
      await api.patch(`/admin/questions/${item.id}`, { answer });
      onSaved();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Modal
      open
      title={tr('Consulta · Módulo {n} · {name}', { n: item.moduleNumber, name: item.user?.name })}
      onClose={onClose}
      footer={canEdit ? <><Button variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button><Button loading={state.busy} disabled={!answer.trim()} onClick={save}>{tr('Enviar respuesta')}</Button></> : <Button onClick={onClose}>{tr('Cerrar')}</Button>}
    >
      <div className="stack">
        <p className="small muted">{item.user?.email} · {dateTime(item.createdAt)}</p>
        <div className="exercise-message">{item.question}</div>
        {canEdit ? (
          <Field label={tr('Respuesta')} hint={tr('El cliente la verá en Ejercicio y avance de este módulo, dentro de Consultas al equipo QLC.')}>
            <Textarea rows={5} maxLength={5000} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </Field>
        ) : item.answer && <div className="exercise-reply"><b>{tr('Respuesta enviada')}</b><p>{item.answer}</p></div>}
        <FormError error={state.error} />
      </div>
    </Modal>
  );
}

function PaidQuestions({ canEdit }) {
  const [status, setStatus] = useState('PENDING');
  const [open, setOpen] = useState(null);
  const res = useAsync(() => api.get(`/admin/questions${status ? `?status=${status}` : ''}`), [status]);
  return (
    <Card title={tr('Consultas pagadas')}>
      <p className="small muted">{tr('Consultas pagadas que los clientes envían desde Ejercicio y avance. Se responden aquí y el cliente las ve en el mismo módulo.')}</p>
      <div className="form-grid cols-2">
        <Field label={tr('Estado')}><Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder={tr('Todos')} options={Object.entries(STATUS).map(([value, [label]]) => ({ value, label: tr(label) }))} /></Field>
      </div>
      <AsyncView {...res} onRetry={res.reload}>
        {(d) => (
          <DataTable
            rows={d.items}
            empty={tr('No hay consultas en este estado.')}
            columns={[
              { key: 'createdAt', label: tr('Fecha'), render: (x) => dateTime(x.createdAt) },
              { key: 'user', label: tr('Cliente'), render: (x) => <><Link to={`/admin/clientes/${x.user?.id}`}><b>{x.user?.name}</b></Link><span className="small block">{x.user?.email}</span></> },
              { key: 'module', label: tr('Módulo'), render: (x) => `M${x.moduleNumber}` },
              { key: 'question', label: tr('Consulta'), render: (x) => preview(x.question) },
              { key: 'status', label: tr('Estado'), render: (x) => { const [label, variant] = STATUS[x.answeredAt ? 'ANSWERED' : 'PENDING']; return <Pill variant={variant}>{tr(label)}</Pill>; } },
              { key: 'x', label: '', align: 'right', render: (x) => <button type="button" className="btn-link" onClick={() => setOpen(x)}>{canEdit ? tr('Responder') : tr('Ver')}</button> },
            ]}
          />
        )}
      </AsyncView>
      {open && <AnswerModal item={open} canEdit={canEdit} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); res.reload(); }} />}
    </Card>
  );
}

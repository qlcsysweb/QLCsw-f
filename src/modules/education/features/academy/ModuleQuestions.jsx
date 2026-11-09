import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Textarea } from '../../components/ui/Form.jsx';
import { Pill } from '../../components/ui/Card.jsx';
import { ErrorState, Loading } from '../../components/ui/States.jsx';
import { CheckoutModal, offerPrice } from '../access/CheckoutModal.jsx';
import { ToolCard } from './ResultParts.jsx';
import { dateTime } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

export function ModuleQuestions({ number }) {
  const { api, canEdit, isAdminView } = useWorkspace();
  const { accessInfo, user } = useAuth();
  const res = useAsync(() => api.get(`/academy/modules/${number}/questions`), [api, number]);
  const [text, setText] = useState('');
  const [state, setState] = useState({ busy: false, error: null, sent: false });
  const [buy, setBuy] = useState(false);
  const offer = (accessInfo?.offers || []).find((o) => o.code === 'CONSULTA');
  const client = !isAdminView && user?.role === 'CLIENT';

  if (res.loading && !res.data) return <Loading />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const { items, credits } = res.data;
  const available = credits?.CONSULTA || 0;

  const send = async () => {
    setState({ busy: true, error: null, sent: false });
    try {
      await api.post(`/academy/modules/${number}/questions`, { question: text });
      setText('');
      setState({ busy: false, error: null, sent: true });
      res.reload();
    } catch (error) {
      setState({ busy: false, error, sent: false });
    }
  };

  return (
    <ToolCard
      title={tr('Consultas al equipo QLC')}
      description={tr('Envía una consulta sobre este módulo. Cada consulta tiene un costo de {price}. El equipo QLC te responde en esta misma sección y tu historial queda guardado.', { price: offer ? offerPrice(offer) : '3 USD' })}
      aside={<Pill variant={available ? '' : 'warn'}>{tr('{n} consulta(s) disponible(s)', { n: available })}</Pill>}
    >
      {canEdit && !isAdminView && (
        <>
          <Field label={tr('Tu consulta')}>
            <Textarea rows={4} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} placeholder={tr('Escribe tu duda sobre el ejercicio o la herramienta')} />
          </Field>
          <FormError error={state.error} />
          {state.sent && <p className="small up">{tr('Consulta enviada. Te avisaremos aquí cuando el equipo responda.')}</p>}
          <div className="form-actions">
            {client && offer && <Button variant="secondary" onClick={() => setBuy(true)}>{tr('Adquirir consultas')}</Button>}
            <Button loading={state.busy} disabled={!available || text.trim().length < 5} onClick={send}>{tr('Enviar consulta')}</Button>
          </div>
        </>
      )}
      <div className="qa-list">
        {items.length === 0 && <p className="muted small">{tr('Aún no has enviado consultas en este módulo.')}</p>}
        {items.map((q) => (
          <div key={q.id} className="qa-item">
            <small className="muted">{dateTime(q.createdAt)}</small>
            <p>{q.question}</p>
            {q.answer ? (
              <div className="exercise-reply">
                <b>{tr('Respuesta del equipo QLC')}</b>
                <small>{dateTime(q.answeredAt)}</small>
                <p>{q.answer}</p>
              </div>
            ) : <Pill variant="warn">{tr('Pendiente de respuesta')}</Pill>}
          </div>
        ))}
      </div>
      {buy && <CheckoutModal offer={offer} onClose={() => { setBuy(false); res.reload(); }} />}
    </ToolCard>
  );
}

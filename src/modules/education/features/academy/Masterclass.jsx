import { Fragment, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { ErrorState, Loading } from '../../components/ui/States.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CheckoutModal, offerPrice } from '../access/CheckoutModal.jsx';
import { tr } from '../../i18n/tr.js';
import { date } from '../../utils/format.js';

function Rich({ spans = [] }) {
  return spans.map(([text, style], i) => {
    const lines = text.split('\n');
    const content = lines.map((line, k) => <Fragment key={k}>{k > 0 && <br />}{line}</Fragment>);
    if (style === 'bi') return <strong key={i}><em>{content}</em></strong>;
    if (style === 'b') return <strong key={i}>{content}</strong>;
    if (style === 'i') return <em key={i}>{content}</em>;
    return <Fragment key={i}>{content}</Fragment>;
  });
}

function McTable({ rows }) {
  const [head, ...body] = rows;
  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <thead><tr>{head.map((cell, i) => <th key={i}><Rich spans={cell} /></th>)}</tr></thead>
        <tbody>{body.map((row, r) => <tr key={r}>{row.map((cell, i) => <td key={i}><Rich spans={cell} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function McGrid({ rows }) {
  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, i) => <td key={i}><Blocks blocks={cell} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function McCallout({ label, blocks }) {
  return (
    <aside className="mc-callout">
      {label && <span className="mc-callout-label">{label}</span>}
      <Blocks blocks={blocks} />
    </aside>
  );
}

const RENDER = {
  title: (b) => <h2 className="mc-title">{b.text}</h2>,
  subtitle: (b) => <p className="mc-subtitle">{b.text}</p>,
  h1: (b) => <h3 className="mc-h1">{b.text}</h3>,
  h2: (b) => <h4 className="mc-h2">{b.text}</h4>,
  h3: (b) => <h5 className="mc-h3">{b.text}</h5>,
  h4: (b) => <h5 className="mc-h3">{b.text}</h5>,
  p: (b) => <p><Rich spans={b.text} /></p>,
  ul: (b) => <ul>{b.items.map((it, i) => <li key={i}><Rich spans={it} /></li>)}</ul>,
  ol: (b) => <ol>{b.items.map((it, i) => <li key={i}><Rich spans={it} /></li>)}</ol>,
  table: (b) => <McTable rows={b.rows} />,
  grid: (b) => <McGrid rows={b.rows} />,
  callout: (b) => <McCallout label={b.label} blocks={b.blocks} />,
};

function Blocks({ blocks = [] }) {
  return blocks.map((b, i) => <Fragment key={i}>{RENDER[b.type]?.(b) ?? null}</Fragment>);
}

function Locked({ number, status, onChange }) {
  const { user } = useAuth();
  const { isAdminView } = useWorkspace();
  const [buy, setBuy] = useState(false);
  const client = !isAdminView && user?.role === 'CLIENT';
  return (
    <div className="mc-locked">
      <span className="section-kicker">{tr('Masterclass QLC')}</span>
      <h3>{tr('Masterclass del Módulo {n}', { n: number })}</h3>
      {!status.previousDone ? (
        <p>{tr('Los módulos de la Masterclass se avanzan en orden. Primero termina el Módulo {n} para poder adquirir esta.', { n: status.previousNumber ?? number - 1 })}</p>
      ) : status.offer ? (
        <p>{tr('Cada módulo de la Masterclass se adquiere por separado con 30 días de acceso. Al terminar el periodo se bloquea y tu avance se conserva. También se incluye en QLC Premium Access y QLC Diamond Access.')}</p>
      ) : (
        <p>{tr('La Masterclass está disponible con QLC Premium Access o QLC Diamond Access.')}</p>
      )}
      {status.canBuy && client && (
        <>
          <p className="mc-price">{offerPrice(status.offer)}</p>
          <Button onClick={() => setBuy(true)}>{tr('Adquirir este módulo')}</Button>
        </>
      )}
      {buy && <CheckoutModal offer={status.offer} onClose={() => { setBuy(false); onChange?.(); }} />}
    </div>
  );
}

function Content({ number, status, onChange }) {
  const { api, canEdit, isAdminView } = useWorkspace();
  const res = useAsync(() => api.get(`/academy/modules/${number}/masterclass`), [api, number]);
  const [done, setDone] = useState(!!status?.completed);
  const [busy, setBusy] = useState(false);
  if (res.loading && !res.data) return <Loading />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const finish = async () => {
    setBusy(true);
    try {
      await api.post(`/academy/modules/${number}/masterclass/complete`, {});
      setDone(true);
      onChange?.();
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <article className="masterclass"><Blocks blocks={res.data.blocks} /></article>
      <div className="mc-done">
        {status?.expiresAt && <span className="muted small">{tr('Acceso a este módulo hasta {date}', { date: date(status.expiresAt) })}</span>}
        {done ? <span className="small up">{tr('Terminaste esta Masterclass. Ya puedes continuar con el siguiente módulo.')}</span>
          : canEdit && !isAdminView && <Button loading={busy} onClick={finish}>{tr('Terminé esta Masterclass')}</Button>}
      </div>
    </>
  );
}

export function Masterclass({ number, status, onChange }) {
  if (!status?.available) return <Locked number={number} status={status || {}} onChange={onChange} />;
  return <Content number={number} status={status} onChange={onChange} />;
}

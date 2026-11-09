import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { Masterclass } from '../../features/academy/Masterclass.jsx';
import { CheckoutModal, offerPrice } from '../../features/access/CheckoutModal.jsx';
import { date } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

const STATE_LABEL = {
  AVAILABLE: ['Disponible', ''],
  PURCHASABLE: ['Lista para adquirir', 'warn'],
  LOCKED_ORDER: ['Termina el Módulo {n}', 'bad'],
  LOCKED: ['Bloqueada', 'bad'],
};

function Catalog({ items, reload }) {
  const { basePath, isAdminView } = useWorkspace();
  const { user } = useAuth();
  const [buy, setBuy] = useState(null);
  const client = !isAdminView && user?.role === 'CLIENT';
  return (
    <>
      <div className="mc-catalog">
        {items.map((m) => {
          const [label, variant] = STATE_LABEL[m.state] || STATE_LABEL.LOCKED;
          return (
            <article key={m.number} className="module-card mc-catalog-item">
              <span className="section-kicker">{tr('Módulo {n}', { n: m.number })}</span>
              <h3>{tr(m.title)}</h3>
              <div>
                <Pill variant={m.completed ? '' : variant}>{m.completed ? tr('Terminada') : tr(label, { n: m.previousNumber })}</Pill>
                {m.optional && <>{' '}<Pill variant="muted">{tr('Opcional')}</Pill></>}
              </div>
              {m.expiresAt && <small className="muted">{tr('Acceso hasta {date}', { date: date(m.expiresAt) })}</small>}
              {m.state === 'AVAILABLE' && <Link className="btn-secondary" to={`${basePath}/masterclass/${m.number}`}>{tr('Abrir Masterclass')}</Link>}
              {m.state === 'PURCHASABLE' && m.offer && client && <Button onClick={() => setBuy(m.offer)}>{tr('Adquirir')} · {offerPrice(m.offer)}</Button>}
            </article>
          );
        })}
      </div>
      {buy && <CheckoutModal offer={buy} onClose={() => { setBuy(null); reload(); }} />}
    </>
  );
}

function Reader({ number }) {
  const { api, basePath } = useWorkspace();
  const res = useAsync(() => api.get('/academy/masterclass'), [api]);
  return (
    <>
      <PageHeader title={tr('Masterclass · Módulo {n}', { n: number })} actions={<Link className="btn-secondary" to={`${basePath}/masterclass`}>{tr('Volver a la Masterclass')}</Link>} />
      <AsyncView {...res} onRetry={res.reload}>
        {(data) => {
          const items = Array.isArray(data) ? data : data.items;
          const item = items.find((m) => m.number === number) || {};
          return <Masterclass number={number} status={{ ...item, canBuy: item.state === 'PURCHASABLE' }} onChange={res.reload} />;
        }}
      </AsyncView>
    </>
  );
}

export default function MasterclassPage() {
  const { n } = useParams();
  const { api } = useWorkspace();
  const res = useAsync(() => api.get('/academy/masterclass'), [api]);
  if (n) return <Reader number={Number(n)} />;
  return (
    <>
      <PageHeader title={tr('Masterclass QLC')} subtitle={tr('Cada módulo se adquiere por separado con 30 días de acceso o completo con QLC Premium Access y QLC Diamond Access. Se avanza en orden y tu avance se conserva. Los módulos 4, 5 y 6 son opcionales: después del Módulo 3 puedes pasar directo al Módulo 7.')} />
      <AsyncView {...res} onRetry={res.reload}>
        {(data) => <Catalog items={Array.isArray(data) ? data : data.items} reload={res.reload} />}
      </AsyncView>
    </>
  );
}

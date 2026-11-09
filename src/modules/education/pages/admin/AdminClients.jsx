import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { date, dateTime } from '../../utils/format.js';
import { ACCESS_MODES } from '../../utils/labels.js';
import { Card, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';

export const accessPill = (access) => (
  <Pill variant={access.mode === 'FULL' ? '' : access.mode === 'TOOLS' ? 'info' : 'muted'}>
    {access.mode === 'TOOLS' ? (access.tools.length === 12 ? tr('Herramientas M1–M12') : `Herramientas ${access.tools.map((t) => `M${t}`).join(', ')}`) : ACCESS_MODES[access.mode]}
  </Pill>
);

export default function AdminClients() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const clients = useAsync(() => api.get(`/admin/clients?q=${encodeURIComponent(term)}`), [term]);

  return (
    <>
      <PageHeader kicker={tr('Clientes')} title={tr('Clientes')} subtitle={tr('Selecciona un cliente para ver o gestionar su información sobre los mismos registros.')} />
      <Card title={tr('Lista de clientes')} actions={
        <form className="search" onSubmit={(e) => { e.preventDefault(); setTerm(q); }}>
          <Input placeholder={tr('Buscar por nombre o correo')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={tr('Buscar cliente')} />
        </form>
      }>
        <AsyncView {...clients} onRetry={clients.reload}>
          {(list) => (
            <DataTable rows={list} empty={tr('Sin clientes registrados.')} columns={[
              { key: 'name', label: tr('Cliente'), render: (c) => <>{tr(c.name)}<span className="small block">{c.email}</span></> },
              { key: 'access', label: tr('Acceso'), render: (c) => accessPill(c.access) },
              { key: 'dataShare', label: tr('Datos'), render: (c) => (c.dataShare ? <Pill>{tr('Compartidos')}</Pill> : <Pill variant="muted">{tr('Privados')}</Pill>) },
              { key: 'modules', label: tr('Módulos completados'), render: (c) => `${c.completedModules} / 6` },
              { key: 'periods', label: tr('Periodos / cortes'), render: (c) => `${c.counts.periods} / ${c.counts.monthlyCloses}` },
              { key: 'lastLoginAt', label: tr('Último acceso'), render: (c) => dateTime(c.lastLoginAt) },
              { key: 'createdAt', label: tr('Registro'), render: (c) => date(c.createdAt) },
              { key: 'x', label: tr('Acciones'), render: (c) => (
                <div className="row-actions">
                  <Link className="btn-link" to={`/admin/clientes/${c.id}`}>{tr('Detalle')}</Link>
                  <Link className="btn-secondary" to={`/admin/clientes/${c.id}/app`}>{tr('Ver / gestionar como cliente')}</Link>
                </div>
              ) },
            ]} />
          )}
        </AsyncView>
      </Card>
    </>
  );
}

import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { count } from '../../utils/format.js';
import { ACCESS_MODES } from '../../utils/labels.js';
import { Card, PageHeader, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { BarChart } from '../../components/charts/Charts.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';

const dayLabel = (d, i) => (i % 5 === 0 ? d.slice(8, 10) : '');
const ACCESS_LABEL = { FULL_ANNUAL: ACCESS_MODES.FULL, TOOL_ONLY: ACCESS_MODES.TOOLS };

function ModuleFunnel({ modules }) {
  const max = Math.max(1, ...modules.map((m) => m.started));
  return (
    <div className="funnel">
      {modules.map((m) => (
        <div key={m.module} className="funnel-row">
          <span className="funnel-label">M{m.module}</span>
          <div className="funnel-track">
            <span className="funnel-started" style={{ width: `${(m.started / max) * 100}%` }} />
            <span className="funnel-completed" style={{ width: `${(m.completed / max) * 100}%` }} />
          </div>
          <span className="funnel-values"><b>{tr(m.completed)}</b> / {tr(m.started)}</span>
        </div>
      ))}
      <div className="funnel-legend"><span className="lg-started" />{tr('Iniciados')}{' '}<span className="lg-completed" />{tr('Completados')}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const res = useAsync(() => api.get(`/admin/analytics?days=${days}`), [days]);
  return (
    <>
      <PageHeader
        kicker={tr('Panel administrativo')}
        title={tr('Cómo va la plataforma')}
        subtitle={tr('Métricas de uso. No incluyen datos financieros de los clientes.')}
        actions={
          <div className="segmented" role="group" aria-label={tr('Periodo')}>
            {[7, 30, 90].map((d) => <button key={d} type="button" className={days === d ? 'is-active' : ''} onClick={() => setDays(d)}>{tr(d)}{' '}{tr('días')}</button>)}
          </div>
        }
      />
      <AsyncView {...res} onRetry={res.reload}>
        {(m) => (
          <>
            <StatGrid>
              <StatCard label={tr('Usuarios totales')} value={count(m.users.total)} delta={tr('{n} nuevos en {days} días', { n: m.users.new, days: m.days })} deltaTone={m.users.new ? 'up' : ''} />
              <StatCard label={tr('Clientes con acceso activo')} value={count(m.users.activeClients)} accent />
              <StatCard label={tr('Inicios de sesión')} value={count(m.logins)} delta={tr('{n} registros', { n: m.registrations })} />
              <StatCard label={tr('Progreso promedio')} value={`${m.averageProgress}%`} delta={tr('{n} alumnos con módulos iniciados', { n: m.learners })} />
            </StatGrid>
            <StatGrid>
              <StatCard label={tr('Pagos simulados aprobados')} value={count(m.payments.approved)} deltaTone="up" />
              <StatCard label={tr('Pagos simulados rechazados')} value={count(m.payments.rejected)} />
              <StatCard label={tr('Pagos pendientes')} value={count(m.payments.pending)} />
            </StatGrid>
            <Card title={tr('Registros e inicios de sesión')}>
              <BarChart data={m.series.logins.map((d, i) => ({ label: dayLabel(d.date, i), value: d.count + m.series.registrations[i].count, hint: tr('{n} inicios · {m} registros', { n: d.count, m: m.series.registrations[i].count }) }))} format={count} />
            </Card>
            <div className="layout">
              <Card title={tr('Módulos iniciados y completados · Bloque 1')}><ModuleFunnel modules={m.modules.filter((x) => x.module <= 6)} /></Card>
              <Card title={tr('Tipo de acceso elegido')}>
                <DataTable rowKey="key" rows={m.accessTypes} empty={tr('Sin accesos activos')} columns={[
                  { key: 'key', label: tr('Modalidad'), render: (r) => ACCESS_LABEL[r.key] || r.key },
                  { key: 'count', label: tr('Accesos'), align: 'right' },
                ]} />
              </Card>
            </div>
            <StatGrid>
              <StatCard label={tr('Usuarios que llegaron al Bloque 2')} value={count(m.block2.reached)} accent />
              <StatCard label={tr('Revisiones anuales generadas')} value={count(m.block2.annualReviews)} delta={tr('Módulo 12')} />
              <StatCard label={tr('Completaron M7')} value={`${m.block2.modules[0]?.completionPct ?? 0}%`} delta={tr('De quienes llegaron al Bloque 2')} />
              <StatCard label={tr('Completaron M12')} value={`${m.block2.modules[5]?.completionPct ?? 0}%`} delta={tr('De quienes llegaron al Bloque 2')} />
            </StatGrid>
            <div className="layout">
              <Card title={tr('Módulos iniciados y completados · Bloque 2')}><ModuleFunnel modules={m.modules.filter((x) => x.module >= 7)} /></Card>
              <Card title={tr('Avance por módulo · Bloque 2')}>
                <DataTable rowKey="module" rows={m.block2.modules} columns={[
                  { key: 'module', label: tr('Módulo'), render: (r) => `M${r.module}` },
                  { key: 'started', label: tr('Iniciados'), align: 'right' },
                  { key: 'completed', label: tr('Completados'), align: 'right' },
                  { key: 'completionPct', label: tr('% completó'), align: 'right', render: (r) => `${r.completionPct}%` },
                ]} />
              </Card>
            </div>
          </>
        )}
      </AsyncView>
    </>
  );
}

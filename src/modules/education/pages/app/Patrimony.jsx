import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePeriodSummary } from '../../hooks/usePeriodSummary.js';
import { money, pct, shortMonth, signedMoney, tone } from '../../utils/format.js';
import { Card, PageHeader, Row, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { BarChart, DistributionBars } from '../../components/charts/Charts.jsx';
import { ClosedNotice, PatrimonyBreakdown, ReconciliationBanner } from '../../components/finance/Finance.jsx';
import { RequirePeriod } from '../../features/periods/PeriodControls.jsx';
import { PROTECTION_TYPES } from '../../utils/labels.js';
import { tr } from '../../i18n/tr.js';

function PatrimonyBody({ s, history }) {
  const b = s.balanceSheet;
  const years = [...new Set(history.map((h) => h.year))];
  const annual = years.map((y) => {
    const rows = history.filter((h) => h.year === y);
    const first = rows[0];
    const last = rows[rows.length - 1];
    return { year: y, opening: first.opening, final: last.final, growth: first.opening ? ((last.final - first.opening) / first.opening) * 100 : null, netWorth: last.netWorth };
  });

  return (
    <>
      <PageHeader title={tr('Patrimonio')} subtitle={tr('Activos − pasivos = patrimonio neto')} />
      <ClosedNotice />
      <StatGrid>
        <StatCard label={tr('Activos')} value={money(b.assets)} />
        <StatCard label={tr('Pasivos')} value={money(b.liabilities)} />
        <StatCard label={tr('Patrimonio neto')} value={money(b.netWorth)} accent />
        <StatCard label={tr('Variación del periodo')} value={<span className={tone(s.patrimony.variation)}>{signedMoney(s.patrimony.variation)}</span>} delta={tr('Patrimonio final − inicial')} />
      </StatGrid>
      <ReconciliationBanner reconciliation={s.reconciliation} />

      <div className="layout">
        <PatrimonyBreakdown patrimony={s.patrimony} roi={s.portfolio.global.roi} />
        <div className="stack">
          <Card title={tr('Activos')}>
            <Row label="Inversiones (Mi portafolio de inversión)" value={money(b.investments)} />
            {s.protection.byType.map((p) => <Row key={p.key} label={PROTECTION_TYPES[p.key]} value={money(p.amount)} />)}
            <Row label={tr('Total activos')} value={money(b.assets)} />
          </Card>
          <Card title={tr('Pasivos')}>
            {s.debts.items.length === 0 && <p className="muted small">{tr('Sin deudas registradas.')}</p>}
            {s.debts.items.map((d) => <Row key={d.id} label={d.name} value={money(d.balance)} />)}
            <Row label={tr('Total pasivos')} value={money(b.liabilities)} />
          </Card>
        </div>
      </div>

      <div className="layout">
        <Card title={tr('Distribución de inversiones por categoría')}>
          <DistributionBars items={s.portfolio.categories.map((c) => ({ key: c.code, label: c.name, value: c.final, share: c.share }))} />
        </Card>
        <Card title={tr('Evolución mensual del patrimonio neto')}>
          <BarChart data={history.map((h) => ({ label: `${shortMonth(h.month)} ${String(h.year).slice(2)}`, value: h.netWorth }))} />
        </Card>
      </div>

      <Card title={tr('Evolución anual')}>
        <DataTable
          rowKey="year"
          rows={annual}
          columns={[
            { key: 'year', label: tr('Año') },
            { key: 'opening', label: tr('Patrimonio inicial'), align: 'right', render: (r) => money(r.opening) },
            { key: 'final', label: tr('Patrimonio final'), align: 'right', render: (r) => money(r.final) },
            { key: 'growth', label: tr('Crecimiento'), align: 'right', render: (r) => <span className={tone(r.growth)}>{pct(r.growth, { signed: true })}</span> },
            { key: 'netWorth', label: tr('Patrimonio neto'), align: 'right', render: (r) => money(r.netWorth) },
          ]}
        />
      </Card>
    </>
  );
}

export default function Patrimony() {
  const { api } = useWorkspace();
  const res = usePeriodSummary();
  const hist = useAsync(() => api.get('/periods/history'), [api, res.period?.id]);
  return (
    <RequirePeriod>
      <AsyncView loading={res.loading || hist.loading} error={res.error || hist.error} data={res.summary && hist.data ? true : null} onRetry={res.reload}>
        {() => <PatrimonyBody s={res.summary} history={hist.data} />}
      </AsyncView>
    </RequirePeriod>
  );
}

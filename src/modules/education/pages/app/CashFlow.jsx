import { usePeriodSummary } from '../../hooks/usePeriodSummary.js';
import { money, pct } from '../../utils/format.js';
import { Card, PageHeader, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { DistributionBars } from '../../components/charts/Charts.jsx';
import { ClosedNotice } from '../../components/finance/Finance.jsx';
import { RecordManager } from '../../features/records/RecordManager.jsx';
import { RequirePeriod } from '../../features/periods/PeriodControls.jsx';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, options } from '../../utils/labels.js';
import { BudgetComparison, usePatrimonial } from '../../features/patrimonial/PatrimonialCards.jsx';
import { tr } from '../../i18n/tr.js';

const recordFields = (catOptions, labels) => [
  { name: 'category', label: tr('Categoría'), type: 'select', options: catOptions, display: (v) => labels[v] },
  { name: 'description', label: tr('Concepto') },
  { name: 'amount', label: 'Importe', type: 'money', display: money },
];
const recordColumns = (labels) => [
  { key: 'category', label: tr('Categoría'), render: (r) => labels[r.category] },
  { key: 'description', label: tr('Concepto') },
  { key: 'amount', label: 'Importe', align: 'right', render: (r) => money(r.amount) },
];
const toForm = (r) => ({ category: r.category, description: r.description, amount: Number(r.amount) });

function Body() {
  const { summary: s, reload: reloadSummary } = usePeriodSummary();
  const patrimonial = usePatrimonial();
  const reload = () => Promise.all([reloadSummary(), patrimonial.reload()]);
  const c = s?.cashflow;
  return (
    <>
      <PageHeader title={tr('Ingresos y gastos')} subtitle={tr('Conoce cómo se mueve tu dinero cada mes · Mi presupuesto mensual')} />
      <ClosedNotice />
      {c && (
        <>
          <StatGrid>
            <StatCard label={tr('Ingresos')} value={money(c.income)} />
            <StatCard label={tr('Gastos')} value={money(c.expenses)} delta={tr('Suma de todos los gastos registrados en este periodo')} />
            <StatCard label={tr('Capacidad de ahorro')} value={<span className={c.savings < 0 ? 'down' : ''}>{money(c.savings)}</span>} delta={tr('Ingresos − gastos')} accent />
            <StatCard label={tr('% ahorro')} value={pct(c.savingsRate)} />
          </StatGrid>
          <div className="layout even">
            <Card title={tr('Distribución de gastos')}>
              <DistributionBars items={c.expenseByCategory.map((e) => ({ key: e.key, label: EXPENSE_CATEGORIES[e.key], value: e.amount, share: e.share }))} emptyText={tr('Registra tus gastos para ver su distribución.')} />
            </Card>
            <Card title={tr('Origen de los ingresos')}>
              <DistributionBars items={c.incomeByCategory.map((e) => ({ key: e.key, label: INCOME_CATEGORIES[e.key], value: e.amount, share: e.share }))} emptyText={tr('Registra tus ingresos para ver su origen.')} />
            </Card>
          </div>
        </>
      )}
      {patrimonial.data && <BudgetComparison budget={patrimonial.data.budget} />}
      <div className="layout even">
        <RecordManager endpoint="/incomes" title={tr('Ingresos')} addLabel="+ Ingreso" fields={recordFields(options.income, INCOME_CATEGORIES)}
          columns={recordColumns(INCOME_CATEGORIES)} toForm={toForm} onChanged={reload} emptyText={tr('Sin ingresos registrados en este periodo.')} />
        <RecordManager endpoint="/expenses" title={tr('Gastos')} addLabel="+ Gasto" fields={recordFields(options.expense, EXPENSE_CATEGORIES)}
          columns={recordColumns(EXPENSE_CATEGORIES)} toForm={toForm} onChanged={reload} emptyText={tr('Sin gastos registrados en este periodo.')} />
      </div>
    </>
  );
}

export default function CashFlow() {
  return <RequirePeriod><Body /></RequirePeriod>;
}

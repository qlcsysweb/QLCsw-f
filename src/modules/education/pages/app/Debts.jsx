import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePeriodSummary } from '../../hooks/usePeriodSummary.js';
import { money, pct, shortMonth } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { BarChart } from '../../components/charts/Charts.jsx';
import { ClosedNotice } from '../../components/finance/Finance.jsx';
import { RecordManager } from '../../features/records/RecordManager.jsx';
import { RequirePeriod } from '../../features/periods/PeriodControls.jsx';
import { modulePath } from '../../features/academy/useAcademy.js';
import { FEES_HINT, FEES_LABEL, isDiagnosisDebt, PaymentModal } from '../../features/academy/tools/M9Obligations.jsx';
import { DEBT_TYPES, options } from '../../utils/labels.js';
import { tr } from '../../i18n/tr.js';

const STATUS = { ACTIVE: 'Activa', PAID: 'Liquidada' };

const fields = [
  { name: 'name', label: 'Obligación (hipoteca, tarjeta, crédito…)' },
  { name: 'type', label: 'Tipo', type: 'select', options: options.debtTypes, display: (v) => DEBT_TYPES[v], default: 'OTRA' },
  { name: 'customType', label: 'Escribe el tipo de obligación', required: false, maxLength: 80, when: (v) => v.type === 'OTRA' },
  { name: 'lender', label: 'Acreedor (opcional)', required: false },
  { name: 'balance', label: 'Saldo al cierre del periodo', type: 'money', display: money },
  { name: 'payment', label: 'Pago mensual planeado', type: 'money', display: money },
  { name: 'fees', label: FEES_LABEL, type: 'money', display: money, required: false, hint: tr(FEES_HINT) },
  { name: 'annualRate', label: 'Tasa anual (%)', type: 'money', display: (v) => (v === null || v === '' ? tr('Pendiente') : `${v}%`), required: false, hint: tr('Déjala vacía si no la conoces: se mostrará como pendiente, no como 0%.') },
  { name: 'status', label: 'Estado', type: 'select', options: Object.entries(STATUS).map(([value, label]) => ({ value, label })), display: (v) => STATUS[v], default: 'ACTIVE' },
];

const columns = [
  { key: 'name', label: 'Deuda', render: (d) => <>{tr(d.name)}<span className="small block">{tr(d.type === 'OTRA' && d.customType ? d.customType : DEBT_TYPES[d.type])}{d.lender ? ` · ${d.lender}` : ''}</span></> },
  { key: 'balance', label: 'Saldo', align: 'right', render: (d) => money(d.balance) },
  { key: 'payment', label: 'Pago', align: 'right', render: (d) => money(d.payment) },
  { key: 'annualRate', label: 'Tasa anual', align: 'right', render: (d) => (d.rateKnown ? pct(d.annualRate) : <Pill variant="warn">{tr('Pendiente')}</Pill>) },
  { key: 'monthlyInterest', label: 'Interés est.', align: 'right', render: (d) => (d.monthlyInterest === null ? tr('Tasa pendiente') : money(d.monthlyInterest)) },
  { key: 'fees', label: 'Comisiones y seguros', align: 'right', render: (d) => money(d.fees) },
  { key: 'principalContribution', label: 'Abono est. a capital', align: 'right', render: (d) => <span className={d.paymentBelowCost ? 'down' : ''}>{money(d.principalContribution)}</span> },
  { key: 'status', label: 'Estado', render: (d) => <Pill variant={d.status === 'PAID' ? '' : 'warn'}>{tr(STATUS[d.status])}</Pill> },
];

function Body() {
  const { api, basePath } = useWorkspace();
  const { summary: s, reload, period, data } = usePeriodSummary();
  const breakdown = data?.debtBreakdown;
  const hist = useAsync(() => api.get('/periods/history'), [api, period?.id]);
  const [paying, setPaying] = useState(null);
  const changed = () => {
    reload();
    hist.reload();
  };
  return (
    <>
      <PageHeader title={tr('Deudas')} subtitle={tr('Registro de obligaciones y costo del dinero')} />
      <ClosedNotice />
      {s?.debts.items?.some(isDiagnosisDebt) && (
        <Notice>{tr('La deuda total que declaraste en el diagnóstico aparece como «Deudas por desglosar». Cada deuda que registras se descuenta de ese renglón, así el saldo total no se duplica.')}</Notice>
      )}
      {s && (
        <StatGrid>
          <StatCard label={tr('Deuda total')} value={money(s.debts.totalBalance)} accent />
          <StatCard label={tr('Pagos del periodo')} value={money(s.debts.totalPayment)} />
          <StatCard label={tr('Costo financiero mensual estimado')} value={money(s.debts.totalMonthlyCost)} delta={s.debts.ratesIncomplete ? tr('Incompleto: hay tasas pendientes') : tr('Intereses + cargos')} />
          <StatCard label={tr('Impacto en patrimonio neto')} value={money(-s.debts.totalBalance)} delta={tr('Las deudas son pasivos, no inversiones')} />
          {breakdown && <StatCard label={tr('Saldo por desglosar')} value={money(breakdown.pendingBalance)} valueTone={breakdown.pendingBalance > 0 ? 'warn' : 'up'} delta={tr('{pct} desglosado de {declared} declarados en el Módulo 1', { pct: `${breakdown.balancePercent.toFixed(2)}%`, declared: money(breakdown.declaredBalance) })} />}
        </StatGrid>
      )}
      <RecordManager endpoint="/debts" title={tr('Obligaciones')} addLabel={tr('+ Registrar deuda')} fields={fields} columns={columns}
        select={(d) => d.items} rowId={(r) => r.balanceId} onChanged={changed}
        rowActions={(d, refresh) => {
          if (d.status !== 'ACTIVE') return null;
          if (d.paidAt) {
            return <><span className="small up">{tr('Pago confirmado')}</span><button className="btn-link" onClick={async () => { await api.del(`/debts/${d.balanceId}/payments`); await refresh(); changed(); }}>{tr('Deshacer pago')}</button></>;
          }
          return <button className="btn-link" onClick={() => setPaying({ debt: d, refresh })}>{tr('Registrar pago')}</button>;
        }}
        toForm={(d) => ({ name: d.name, type: d.type, lender: d.lender || '', balance: d.balance, payment: d.payment, fees: d.fees, annualRate: d.annualRate ?? '', status: d.status })}
        emptyText={tr('Sin deudas registradas en este periodo.')} />
      {paying && (
        <PaymentModal
          debt={paying.debt}
          endpoint="/debts"
          onClose={() => setPaying(null)}
          onDone={async () => {
            const { refresh } = paying;
            setPaying(null);
            await refresh();
          }}
        />
      )}
      <Card title={tr('Evolución de la deuda total')}>
        <BarChart data={(hist.data || []).map((h) => ({ label: `${shortMonth(h.month)} ${String(h.year).slice(2)}`, value: h.debt }))} />
      </Card>
      <Notice>{tr('Analiza tus obligaciones con el')}{' '}<Link to={modulePath(basePath, 9)}>{tr('Módulo 9')}</Link> desde la academia. Herramienta educativa y de organización. Una deuda reduce el patrimonio neto y tiene un costo financiero; el cálculo del costo mensual es una aproximación.</Notice>
    </>
  );
}

export default function Debts() {
  return <RequirePeriod><Body /></RequirePeriod>;
}

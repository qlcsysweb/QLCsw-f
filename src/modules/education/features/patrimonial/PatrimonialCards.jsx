import { Link } from 'react-router-dom';
import { customName, isCustomCategory } from '@shared/patrimonial.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, money, pct, signedMoney } from '../../utils/format.js';
import { BUDGET_LABELS, ESSENTIAL_SOURCES } from '../../utils/labels.js';
import { Card, Pill, ProgressBar, Row } from '../../components/ui/Card.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { modulePath } from '../academy/useAcademy.js';
import { tr } from '../../i18n/tr.js';

export function usePatrimonial() {
  const { api, period } = useWorkspace();
  return useAsync(() => api.get(`/periods/${period.id}/patrimonial`), [api, period?.id], { enabled: !!period });
}

const ModuleLink = ({ n, children }) => {
  const { basePath } = useWorkspace();
  return <Link className="btn-secondary" to={modulePath(basePath, n)}>{children}</Link>;
};

export function BudgetComparison({ budget }) {
  if (!budget) {
    return (
      <Card title={tr('Presupuesto del mes')} actions={<ModuleLink n={7}>Crear presupuesto (M7)</ModuleLink>}>
        <p className="muted">{tr('Aún no tienes un presupuesto para este mes. En el Módulo 7 planeas tu distribución y aquí comparas el plan con tus movimientos reales.')}</p>
      </Card>
    );
  }
  const v = budget.view;
  return (
    <Card title={tr('Presupuesto planeado vs. real')} actions={<ModuleLink n={7}>{tr('Editar en M7')}</ModuleLink>}>
      <div className="grid grid-3">
        <Row label={tr('Gasto planeado')} value={money(v.expensesPlanned)} />
        <Row label={tr('Gasto real')} value={money(v.expensesActualTotal ?? v.expensesActual)} />
        <Row label={tr('Desviación')} value={signedMoney(v.expenseDifference)} valueTone={v.expenseDifference < 0 ? 'down' : 'up'} />
        <Row label={tr('Ahorro planeado / real')} value={`${money(v.savingsPlanned)} / ${money(v.savingsActual)}`} />
        <Row label={tr('Inversión planeada / real')} value={`${money(v.investmentPlanned)} / ${money(v.investmentActual)}`} />
        <Row label={tr('Saldo estimado')} value={money(v.estimatedBalance)} sub={tr('No es saldo bancario')} />
      </div>
      <DataTable
        rowKey="category"
        rows={v.rows}
        columns={[
          { key: 'category', label: tr('Categoría'), render: (r) => (isCustomCategory(r.category) ? customName(r.category) : BUDGET_LABELS[r.category]) },
          { key: 'planned', label: tr('Planeado'), align: 'right', render: (r) => money(r.planned) },
          { key: 'actual', label: tr('Real'), align: 'right', render: (r) => money(r.actual) },
          {
            key: 'difference', label: tr('Desviación'), align: 'right', render: (r) => (
              <span className={r.kind === 'EXPENSE' ? (r.difference < 0 ? 'down' : 'up') : r.status === 'MET' ? 'up' : 'warn-text'}>
                {r.kind === 'TARGET' && r.difference > 0 ? tr('Faltan {pct}', { pct: money(r.difference) }) : signedMoney(r.difference)}
              </span>
            ),
          },
        ]}
      />
      <p className="small muted">{tr('El plan no crea movimientos: los importes reales provienen de tus ingresos, gastos y aportaciones confirmadas.')}</p>
    </Card>
  );
}

export function EmergencyFundCard({ emergency }) {
  if (!emergency?.saved) {
    return (
      <Card title={tr('Fondo de emergencia')} actions={<ModuleLink n={8}>Definir meta (M8)</ModuleLink>}>
        <p className="muted">{tr('Define en el Módulo 8 tu meta de reserva para ver aquí tu cobertura y el faltante.')}</p>
      </Card>
    );
  }
  const r = emergency.result;
  return (
    <Card title={tr('Fondo de emergencia')} actions={<ModuleLink n={8}>{tr('Ver en M8')}</ModuleLink>}>
      <Row label={tr('Liquidez disponible')} value={money(emergency.liquid.amount)} />
      {r.valid ? (
        <>
          <Row label={tr('Meta de reserva')} value={tr('{target} · {n} meses', { target: money(r.target), n: r.targetMonths })} />
          <Row label={tr('Meses cubiertos')} value={r.monthsCovered.toFixed(1)} />
          <Row label={tr('Faltante')} value={money(r.gap)} valueTone={r.gap === 0 ? 'up' : 'warn-text'} />
          <ProgressBar value={r.progressVisual} label={tr('Avance del fondo de emergencia')} />
          <p className="small muted">{r.status === 'REACHED' ? tr('Meta alcanzada.') : tr('{pct} de la meta.', { pct: pct(r.progress) })} Gastos esenciales: {ESSENTIAL_SOURCES[emergency.essentialSource]}.</p>
        </>
      ) : <p className="muted small">{tr('Registra tus gastos esenciales para calcular la cobertura.')}</p>}
    </Card>
  );
}

export function DebtCostCard({ debts }) {
  if (!debts || !debts.count) return null;
  return (
    <Card title={tr('Costo estimado de tus deudas')} actions={<ModuleLink n={9}>{tr('Panel de obligaciones (M9)')}</ModuleLink>}>
      <Row label={tr('Deuda total')} value={money(debts.balance)} />
      <Row label={tr('Pagos mensuales planeados')} value={money(debts.payments)} />
      <Row label={tr('Intereses + cargos estimados')} value={money(debts.cost)} sub={debts.incomplete ? tr('Incompleto: hay tasas pendientes') : tr('Estimación mensual')} />
      <Row label={tr('Pagos / ingreso')} value={pct(debts.paymentToIncome)} />
    </Card>
  );
}

export function Block2Summary({ patrimonial, academy }) {
  const { basePath } = useWorkspace();
  const p = patrimonial;
  const e = p.emergency?.result;
  return (
    <Card title={tr('Bloque 2 · Organización patrimonial')} actions={<Link className="btn-secondary" to={`${basePath}/academia`}>{tr('Ver módulos')}</Link>}>
      <div className="mini-steps">
        {academy.block2.map((m) => (
          <span key={m.number} className={`mini-step state-${m.state}`} title={tr(m.title)}>{m.state === 'COMPLETED' ? '✓' : m.number}</span>
        ))}
      </div>
      <ProgressBar value={academy.block2ProgressPct} label={tr('Progreso del bloque 2')} />
      <Row label={tr('Presupuesto del mes')} value={p.budget ? signedMoney(p.budget.view.expenseDifference) : tr('Sin presupuesto')} sub={p.budget ? tr('Gasto planeado ± real') : tr('Módulo 7')} valueTone={p.budget ? (p.budget.view.expenseDifference < 0 ? 'down' : 'up') : ''} />
      <Row label={tr('Fondo de emergencia')} value={e?.valid ? tr('{n} meses', { n: e.monthsCovered.toFixed(1) }) : tr('Sin datos')} sub={e?.valid ? tr('{pct} de la meta', { pct: pct(e.progressVisual) }) : tr('Módulo 8')} />
      <Row label={tr('Deuda total')} value={money(p.debts?.balance ?? 0)} sub={`Pagos planeados ${money(p.debts?.payments ?? 0)}`} />
      <Row label={tr('Ganancia neta estimada')} value={p.estimates ? money(p.estimates.net) : tr('Sin análisis')} sub={p.estimates ? tr('Estimación · no es ingreso real') : tr('Módulo 10')} />
      <Row label={tr('Escenarios de inflación')} value={tr('{n} guardados', { n: p.simulations.scenarios })} sub={tr('Simulaciones · no cambian tu patrimonio')} />
      <Row label={tr('Última revisión anual')} value={p.annualReview ? signedMoney(p.annualReview.variation) : tr('Sin revisión')} sub={p.annualReview ? `Guardada ${dateTime(p.annualReview.generatedAt)}` : tr('Módulo 12')} />
      {p.annualReview?.storedInDrive && <Pill>{tr('PDF en Google Drive')}</Pill>}
    </Card>
  );
}

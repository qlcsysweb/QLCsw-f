import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, money, pct, periodLabel, shortMonth, signedMoney, tone, utcDateTime } from '../../utils/format.js';
import { MODULE_STATE } from '../../utils/labels.js';
import { Card, PageHeader, Pill, ProgressBar, Row, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { AsyncView, Loading } from '../../components/ui/States.jsx';
import { BarChart } from '../../components/charts/Charts.jsx';
import { ReconciliationBanner } from '../../components/finance/Finance.jsx';
import { AllocationBars, READING_TONE, ReadingCard } from '../../features/academy/AllocationView.jsx';
import { modulePath } from '../../features/academy/useAcademy.js';
import { Block2Summary, EmergencyFundCard } from '../../features/patrimonial/PatrimonialCards.jsx';
import { CurrencySelect } from '../../context/CurrencyContext.jsx';
import { ProtectionReadingCard } from '../../features/patrimonial/ProtectionReading.jsx';
import { tr } from '../../i18n/tr.js';

function Onboarding({ academy }) {
  const { basePath } = useWorkspace();
  return (
    <div className="onboarding">
      <div className="section-kicker">{tr('Bienvenido')}</div>
      <h1>{tr('Comencemos por tu punto de partida')}</h1>
      <p className="subtitle">{tr('El Módulo 1 crea tu diagnóstico financiero inicial. Con él se construyen Inicio, Patrimonio, Ingresos y gastos y Mi portafolio de inversión.')}</p>
      <div className="onboarding-steps">
        {academy.block1.slice(0, 3).map((m) => (
          <div key={m.number} className={`onboarding-step state-${m.state}`}>
            <span>{m.number}</span>
            <div><b>{tr(m.title)}</b><small>{tr(MODULE_STATE[m.state].label)}</small></div>
          </div>
        ))}
      </div>
      <Link className="btn-primary" to={modulePath(basePath, 1)}>{tr('Iniciar diagnóstico financiero →')}</Link>
    </div>
  );
}

function AcademyCard({ academy }) {
  const { basePath } = useWorkspace();
  return (
    <Card title={tr('Academia · Bloque 1')} actions={<Link className="btn-secondary" to={`${basePath}/academia`}>{tr('Ver programa')}</Link>}>
      <div className="mini-steps">
        {academy.block1.map((m) => (
          <span key={m.number} className={`mini-step state-${m.state}`} title={`${tr(m.title)} · ${MODULE_STATE[m.state].label}`}>{m.state === 'COMPLETED' ? '✓' : m.number}</span>
        ))}
      </div>
      <ProgressBar value={academy.progressPct} label={tr('Progreso del bloque 1')} />
      <p className="muted small">{academy.progressPct}{tr('% completado')}{academy.next ? tr(' · Siguiente: M{n} {title}', { n: academy.next.number, title: tr(academy.next.title) }) : ''}</p>
      {academy.next && <Link className="btn-primary" to={modulePath(basePath, academy.next.number)}>{tr('Continuar')}</Link>}
    </Card>
  );
}

function GoalCard({ goal }) {
  const { basePath } = useWorkspace();
  const g = goal?.goal;
  const p = goal?.progress;
  const name = g?.name && g.name !== 'Meta patrimonial' ? g.name : null;
  return (
    <Card title={tr('Meta patrimonial')} actions={<Link className="btn-secondary" to={`${basePath}/academia/m/8`}>{g ? tr('Aportar a mi meta') : tr('Definir mi meta')}</Link>}>
      {!p ? <p className="muted">{tr('Aún no defines una meta patrimonial. Créala en el Módulo 8 para seguir su avance desde aquí.')}</p> : (
        <>
          {name && <Row label={tr('Concepto')} value={tr(name)} />}
          <Row label={tr('Meta')} value={money(p.goal)} />
          <Row label={tr('Aportado')} value={money(p.current)} valueTone={p.current > 0 ? 'up' : ''} />
          <Row label={tr('Falta')} value={money(p.remaining)} />
          <Row label={tr('Tiempo estimado')} value={p.reached ? tr('Meta alcanzada') : p.monthsToGoal === null ? tr('Define una aportación mensual') : tr('{n} meses', { n: p.monthsToGoal })} />
          <ProgressBar value={Math.min(100, p.progress || 0)} label={tr('Avance {pct}', { pct: pct(p.progress) })} />
        </>
      )}
    </Card>
  );
}

function DiagnosisCard({ diagnosis, liquidity, expenses, income, returns }) {
  const { basePath } = useWorkspace();
  if (!diagnosis) {
    return (
      <Card title={tr('Diagnóstico financiero')}>
        <p className="muted">{tr('Aún no generas tu diagnóstico inicial.')}</p>
        <Link className="btn-secondary" to={modulePath(basePath, 1)}>{tr('Ir al Módulo 1')}</Link>
      </Card>
    );
  }
  const r = diagnosis.result;
  const months = expenses > 0 ? liquidity / expenses : null;
  return (
    <Card title="Diagnóstico financiero (línea base)" actions={<span className="small muted">{dateTime(diagnosis.savedAt)}</span>}>
      <Row label={tr('Tasa de ahorro')} value={pct(r.savingRate)} sub={r.savingLevel?.label} />
      <Row label={tr('Meses de liquidez')} value={months === null ? 'N/D' : tr('{n} meses', { n: months.toFixed(1) })} sub={tr('{liquidity} de liquidez ÷ {expenses} de gastos mensuales del periodo', { liquidity: money(liquidity), expenses: money(expenses) })} />
      <Row label={tr('Inversión / patrimonio')} value={pct(r.investmentToNetWorth)} />
      {r.otherAssetsToNetWorth !== undefined && <Row label={tr('Bienes y otros activos / patrimonio')} value={pct(r.otherAssetsToNetWorth)} />}
      <Row label={tr('Deuda / patrimonio')} value={pct(r.debtToNetWorth)} />
      <Row label={tr('Flujo total de ingresos')} value={money(income + returns)} sub={tr('{income} de ingresos + {returns} de rentabilidad de inversiones', { income: money(income), returns: money(returns) })} />
    </Card>
  );
}

function DashboardBody({ d }) {
  const { period, basePath } = useWorkspace();
  const s = d.summary;
  const prev = d.history.length > 1 ? d.history[d.history.length - 2] : null;
  const debtExpenses = s.cashflow.expenseByCategory?.find((c) => c.key === 'DEUDAS')?.amount || 0;
  const liquidity = (s.portfolio.categories.find((c) => c.code === 'LIQUIDEZ')?.final || 0) + s.protection.total;
  const evolution = d.history.map((h) => ({ label: `${shortMonth(h.month)} ${String(h.year).slice(2)}`, value: h.netWorth }));

  return (
    <>
      <PageHeader title={tr('Mi situación financiera')} subtitle={tr('Resumen de tu estructura financiera · {period}', { period: periodLabel(d.period) })} actions={<CurrencySelect />} />
      {!s.reconciliation.reconciled && <ReconciliationBanner reconciliation={s.reconciliation} />}
      {!s.protection.insuranceTypes?.length && (
        <div className="notice notice-danger protection-alert">
          <b>{tr('Presta atención a tu protección patrimonial.')}</b>{' '}
          {tr('Aún no registras ningún seguro (vida, gastos médicos mayores, retiro, auto, desempleo o educativo).')}{' '}
          <Link to={`${basePath}/proteccion`}>{tr('Registrar mis seguros')}</Link>
        </div>
      )}
      <StatGrid>
        <StatCard label={tr('Ingresos mensuales')} value={money(s.cashflow.income)} delta={[s.cashflow.incomeFromPortfolio > 0 ? tr('Incluye {amount} pasados desde tu portafolio', { amount: money(s.cashflow.incomeFromPortfolio) }) : null, prev ? tr('{amount} vs. mes anterior', { amount: signedMoney(s.cashflow.income - prev.income) }) : null].filter(Boolean).join(' · ') || null} deltaTone={prev ? tone(s.cashflow.income - prev.income) : ''} />
        <StatCard label={tr('Gastos mensuales')} value={money(s.cashflow.expenses)} delta={tr('Incluye {debts} de pago de deudas · Capacidad de ahorro: {amount}', { debts: money(debtExpenses), amount: money(s.cashflow.savings) })} />
        <StatCard
          label={tr('Inversiones y activos')}
          value={money(s.portfolio.global.final + (s.patrimony.unassignedContributions || 0))}
          delta={s.patrimony.unassignedContributions > 0
            ? <Link to={`${basePath}/cartera`} className="down">{tr('{amount} sin registro de asignación en inversión en Mi portafolio de inversión', { amount: money(s.patrimony.unassignedContributions) })}</Link>
            : tr('{n} productos en Mi portafolio de inversión', { n: s.portfolio.products.length })}
        />
        <StatCard label={tr('Patrimonio neto')} value={money(s.balanceSheet.netWorth)} accent delta={prev ? tr('{amount} este mes', { amount: signedMoney(s.balanceSheet.netWorth - prev.netWorth) }) : tr('Activos − pasivos')} deltaTone={prev ? tone(s.balanceSheet.netWorth - prev.netWorth) : ''} />
      </StatGrid>
      <StatGrid>
        <StatCard label={tr('Liquidez')} value={money(liquidity)} />
        <StatCard label={tr('Deuda total')} value={money(s.debts.totalBalance)} delta={`Pagos: ${money(s.debts.totalPayment)}`} />
        <StatCard label={tr('Lectura de portafolio')} value={d.allocation?.reading ? tr(d.allocation.reading.label) : tr('Sin datos')} valueTone={READING_TONE[d.allocation?.reading?.key]} delta={d.allocation?.reading ? `${d.allocation.reading.score} / 100 · educativa` : tr('Registra productos en M2')} />
        <StatCard label={tr('Estado del periodo')} value={period?.status === 'CLOSED' ? tr('Cerrado') : tr('Abierto')} delta={s.reconciliation.reconciled ? tr('Patrimonio conciliado') : tr('Información no conciliada')} deltaTone={s.reconciliation.reconciled ? 'up' : 'down'} />
      </StatGrid>
      <div className="layout">
        <AcademyCard academy={d.academy} />
        <DiagnosisCard diagnosis={d.diagnosis} liquidity={liquidity} expenses={s.cashflow.expenses} income={s.cashflow.income - (s.cashflow.incomeFromPortfolio || 0)} returns={s.portfolio.products.reduce((acc, p) => acc + (p.incomeAmount || 0), 0)} />
      </div>
      <div className="layout">
        <Block2Summary patrimonial={d.patrimonial} academy={d.academy} />
      </div>
      <div className="layout">
        <ProtectionReadingCard protection={s.protection} monthsCovered={s.indicators.monthsCovered} />
        <EmergencyFundCard emergency={d.patrimonial.emergency} />
      </div>
      <div className="layout">
        <GoalCard goal={d.goal} />
      </div>
      <div className="layout">
        <Card title={tr('Allocation actual')}>
          {d.allocation?.total ? <AllocationBars allocation={d.allocation} /> : <p className="muted">{tr('Registra tus productos en el Módulo 2 para ver tu distribución.')}</p>}
        </Card>
        <ReadingCard reading={d.allocation?.reading} shares={d.allocation?.shares} />
      </div>
      <div className="layout">
        <Card title="Evolución patrimonial (patrimonio neto)"><BarChart data={evolution} ariaLabel={tr('Evolución del patrimonio neto')} /></Card>
        <Card title={tr('Próxima asesoría')}>
          {d.nextAppointment ? <Row label={d.nextAppointment.reason} value={utcDateTime(d.nextAppointment.scheduledAt)} /> : <p className="muted">{tr('Sin cita programada.')}</p>}
          <Pill variant="muted">{tr('Herramienta educativa: no constituye asesoría de inversión')}</Pill>
        </Card>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { api, period, periodsState } = useWorkspace();
  const res = useAsync(() => api.get(`/dashboard${period ? `?periodId=${period.id}` : ''}`), [api, period?.id], { enabled: !periodsState.loading });
  if (periodsState.loading) return <Loading />;
  return (
    <AsyncView {...res} onRetry={res.reload}>
      {(d) => (d.summary ? <DashboardBody d={d} /> : <Onboarding academy={d.academy} />)}
    </AsyncView>
  );
}

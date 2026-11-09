import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { usePeriodSummary } from '../../../hooks/usePeriodSummary.js';
import { money, pct } from '../../../utils/format.js';
import { options } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Field, FormError, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { Loading, ErrorState } from '../../../components/ui/States.jsx';
import { MetricCard, MetricGrid, RealBadge, ToolCard } from '../ResultParts.jsx';
import { tr } from '../../../i18n/tr.js';

const EMPTY = {
  income: '', expenses: '', debtPayment: '', monthlyInvestment: '',
  cash: '', investments: '', otherAssets: '', totalDebt: '',
  emergencyFund: '', riskTolerance: 'MODERADO', mainGoal: 'CONSTRUIR_PATRIMONIO', mainGoalCustom: '',
};

const GROUPS = [
  { step: '1', title: 'Flujo mensual', description: 'Tu situación mensual actual.', fields: [['income', 'Ingresos mensuales fijos', 'Solo ingresos fijos de una actividad laboral, como sueldo u honorarios. Si tus ingresos provienen únicamente de inversiones o negocios, escribe 0: en los módulos posteriores podrás añadir su rentabilidad como ingreso.'], ['expenses', 'Gastos mensuales'], ['debtPayment', 'Pago mensual de deudas'], ['monthlyInvestment', 'Aportación mensual a inversión']] },
  { step: '2', title: 'Patrimonio actual', description: 'Activos, liquidez e inversiones para obtener tu patrimonio neto.', fields: [['cash', 'Efectivo y liquidez'], ['investments', 'Inversiones'], ['otherAssets', 'Bienes y otros activos'], ['totalDebt', 'Deudas totales']] },
];

const levelTone = { GOOD: 'good', MODERATE: 'warn', REVIEW: 'bad' };
const monthsTone = (m) => (m === null ? '' : m >= 6 ? 'good' : m >= 3 ? 'warn' : 'bad');

function Results({ result }) {
  const { summary } = usePeriodSummary();
  const income = summary ? summary.cashflow.income - (summary.cashflow.incomeFromPortfolio || 0) : Number(result.income || 0);
  const returns = summary ? summary.portfolio.products.reduce((acc, p) => acc + (p.incomeAmount || 0), 0) : 0;
  return (
    <ToolCard step="4" title={tr('Resultado del diagnóstico')} description={tr('Tu línea base. Así estás hoy.')} aside={<RealBadge />}>
      <MetricGrid>
        <MetricCard
          label={tr('Tasa de ahorro')}
          value={pct(result.savingRate)}
          tone={levelTone[result.savingLevel?.key]}
          hint={result.savingLevel?.label || tr('Registra tus ingresos')}
          explanation={tr('Qué significa: de cada $100 que recibes quedan {amount} después de gastos y deudas. Por qué importa: es el motor para acumular patrimonio.', { amount: result.savingRate === null ? '—' : `$${result.savingRate.toFixed(2)}` })}
        />
        <MetricCard label={tr('Patrimonio neto')} value={money(result.netWorth)} tone={result.netWorth >= 0 ? 'good' : 'bad'} hint={tr('Activos − deudas')} explanation="Responde: si sumo todo lo que tengo y resto lo que debo, ¿cuánto realmente tengo?" />
        <MetricCard label={tr('Liquidez')} value={result.liquidityMonths === null ? 'N/D' : tr('{n} meses', { n: result.liquidityMonths.toFixed(1) })} tone={monthsTone(result.liquidityMonths)} hint={result.liquidityCash === undefined ? tr('Meses de gastos cubiertos') : tr('{cash} ÷ {expenses} de gastos mensuales y pago de deudas', { cash: money(result.liquidityCash), expenses: money(result.liquidityExpenses) })} explanation="Responde: si mañana dejo de recibir ingresos, ¿cuánto tiempo puedo pagar mis gastos? Patrimonio no es lo mismo que liquidez." />
        <MetricCard label={tr('Inversión / patrimonio')} value={pct(result.investmentToNetWorth)} hint={tr('Peso actual de inversiones')} explanation="Qué parte de tu patrimonio neto está invertida. Lo profundizarás en Allocation (Módulo 3)." />
        <MetricCard label={tr('Bienes y otros activos / patrimonio')} value={pct(result.otherAssetsToNetWorth)} hint={tr('Peso de bienes y otros activos')} explanation="Qué parte de tu patrimonio neto está en bienes como inmuebles, vehículos o negocios. Lo profundizarás en Allocation (Módulo 3)." />
        <MetricCard label={tr('Deuda / patrimonio')} value={pct(result.debtToNetWorth)} hint={tr('Nivel relativo de deuda')} explanation="Indicador educativo, no una calificación. El análisis completo de deudas requiere tasa, plazo y tipo de deuda." />
        <MetricCard label={tr('Flujo total de ingresos')} value={money(income + returns)} tone="good" hint={tr('{income} de ingresos + {returns} de rentabilidad de inversiones', { income: money(income), returns: money(returns) })} explanation="Todo el dinero que entró este mes: tus ingresos mensuales más la rentabilidad que generaron tus inversiones." />
      </MetricGrid>
    </ToolCard>
  );
}

export function M1Diagnosis({ onSaved }) {
  const { api, canEdit, basePath, reloadPeriods } = useWorkspace();
  const saved = useAsync(() => api.get('/academy/diagnosis'), [api]);
  const [form, setForm] = useState(null);
  const [result, setResult] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });

  if (saved.loading && !saved.data) return <Loading />;
  if (saved.error) return <ErrorState error={saved.error} onRetry={saved.reload} />;
  const values = form || { ...EMPTY, ...(saved.data?.input || {}) };
  const shown = result || saved.data?.result;
  const set = (k) => (e) => setForm({ ...values, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null });
    try {
      const res = await api.put('/academy/diagnosis', values);
      setResult(res.result);
      await reloadPeriods(res.periodId);
      onSaved?.();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  return (
    <form className="tool" onSubmit={submit}>
      <div className="tool-grid">
        {GROUPS.map((g) => (
          <ToolCard key={g.step} step={g.step} title={g.title} description={g.description}>
            <div className="form-grid cols-2">
              {g.fields.map(([name, label, hint]) => (
                <Field key={name} label={label} hint={hint ? tr(hint) : undefined}>
                  <MoneyInput name={name} value={values[name]} onChange={set(name)} placeholder="0" disabled={!canEdit} />
                </Field>
              ))}
            </div>
          </ToolCard>
        ))}
        <ToolCard step="3" title={tr('Liquidez y perfil')} description={tr('Cuánto tiempo podrías cubrir tus gastos y tu tolerancia al riesgo.')}>
          <div className="form-grid cols-2">
            <Field label={tr('Fondo disponible para emergencias')} hint={tr('Parte de tu efectivo reservada para imprevistos.')}>
              <MoneyInput value={values.emergencyFund} onChange={set('emergencyFund')} placeholder="0" disabled={!canEdit} />
            </Field>
            <Field label={tr('Tolerancia al riesgo')}>
              <Select value={values.riskTolerance} onChange={set('riskTolerance')} options={options.tolerance} disabled={!canEdit} />
            </Field>
            <Field label={tr('Objetivo financiero principal')} full>
              <Select value={values.mainGoal} onChange={set('mainGoal')} options={options.goals} disabled={!canEdit} />
            </Field>
            {values.mainGoal === 'OTRO' && (
              <Field label={tr('Escribe tu objetivo financiero')} full>
                <Input value={values.mainGoalCustom || ''} onChange={set('mainGoalCustom')} maxLength={120} placeholder={tr('Ej. Comprar mi casa, estudiar una maestría, retirarme a los 55')} disabled={!canEdit} />
              </Field>
            )}
          </div>
        </ToolCard>
        <ToolCard title={tr('¿A dónde va esta información?')} description={tr('No se crea una base separada: tus datos alimentan la plataforma.')}>
          <ul className="flow-links">
            <li><Link to={basePath}>{tr('Inicio')}</Link><span>{tr('Resumen de tu situación')}</span></li>
            <li><Link to={`${basePath}/ingresos-gastos`}>{tr('Ingresos y gastos')}</Link><span>{tr('Ingreso, gastos y pago de deudas')}</span></li>
            <li><Link to={`${basePath}/patrimonio`}>{tr('Patrimonio')}</Link><span>{tr('Activos, deudas y patrimonio neto')}</span></li>
            <li><Link to={`${basePath}/cartera`}>{tr('Mi portafolio de inversión')}</Link><span>{tr('Liquidez e inversiones por desglosar')}</span></li>
            <li><Link to={`${basePath}/proteccion`}>{tr('Protección')}</Link><span>{tr('Meses de liquidez')}</span></li>
          </ul>
        </ToolCard>
      </div>
      <FormError error={state.error} />
      {canEdit && (
        <div className="tool-actions">
          <Button type="submit" loading={state.busy}>{shown ? tr('Actualizar diagnóstico') : tr('Generar diagnóstico')}</Button>
        </div>
      )}
      {shown && <Results result={shown} />}
    </form>
  );
}

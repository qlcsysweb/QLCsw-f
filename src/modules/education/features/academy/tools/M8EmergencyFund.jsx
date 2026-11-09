import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { emergencyFund, RESERVE_TARGETS } from '@shared/patrimonial.js';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { date, money, pct } from '../../../utils/format.js';
import { BUDGET_LABELS, ESSENTIAL_SOURCES, PROTECTION_TYPES } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { Field, FormError, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { ProgressBar } from '../../../components/ui/Card.jsx';
import { ErrorState } from '../../../components/ui/States.jsx';
import { KindBadge, MetricCard, MetricGrid, RiskNote, SaveStatus, ToolCard, ToolSkeleton } from '../ResultParts.jsx';
import { useAction } from '../useAction.js';
import { tr } from '../../../i18n/tr.js';

const months = (n) => `${n} ${n === 1 ? tr('mes') : tr('meses')}`;

function timeText(r) {
  if (r.status === 'REACHED') return tr('Meta alcanzada');
  if (r.status === 'NEEDS_CONTRIBUTION') return tr('Define una aportación mensual');
  return months(r.monthsToGoal);
}

function Diagnosis({ result }) {
  if (!result.valid) {
    return <p className="empty-inline">{tr('Necesitamos tus gastos esenciales mensuales (mayores a cero) para calcular la cobertura. Regístralos en Ingresos y gastos, en tu presupuesto del Módulo 7 o decláralos arriba.')}</p>;
  }
  return (
    <>
      <MetricGrid>
        <MetricCard label={tr('Reserva disponible')} value={money(result.liquid)} hint={tr('Liquidez real registrada')} />
        <MetricCard label={tr('Meses cubiertos')} value={result.monthsCovered.toFixed(1)} tone={result.monthsCovered >= result.targetMonths ? 'good' : result.monthsCovered >= 1 ? 'warn' : 'bad'} hint={tr('Liquidez ÷ gastos esenciales')} />
        <MetricCard label={tr('Reserva objetivo')} value={money(result.target)} hint={tr('{months} de gastos esenciales', { months: months(result.targetMonths) })} />
        <MetricCard label={tr('Faltante')} value={money(result.gap)} tone={result.gap === 0 ? 'good' : 'warn'} hint={tr('Nunca menor que cero')} />
        <MetricCard label={tr('Meta alcanzada')} value={pct(result.progress)} hint={tr('Liquidez ÷ reserva objetivo')} />
        <MetricCard label={tr('Tiempo estimado')} value={timeText(result)} hint={tr('Con la aportación planeada')} explanation="Supone aportación constante, sin usar la reserva y sin cambios en tus gastos. Es una estimación, no una garantía." />
      </MetricGrid>
      <ProgressBar value={result.progressVisual} label={tr('Progreso hacia la meta de reserva')} />
      <p className="muted small">{tr('Tu reserva cubre aproximadamente')}{' '}{result.monthsCovered.toFixed(1)}{' '}{tr('meses de gastos esenciales. Tu meta seleccionada es de')}{' '}{months(result.targetMonths)}.</p>
    </>
  );
}

function PlanEditor({ data, reload, onSaved }) {
  const { api, canEdit, basePath } = useWorkspace();
  const action = useAction();
  const [form, setForm] = useState({
    targetMonths: data.plan?.targetMonths ?? 3,
    monthlyContribution: String(data.plan?.monthlyContribution ?? ''),
    useDeclared: data.plan?.useDeclared ?? data.autoEssential?.source === 'NONE',
    declaredEssential: String(data.plan?.declaredEssential ?? ''),
  });
  const essential = form.useDeclared ? Number(form.declaredEssential || 0) : data.autoEssential?.amount ?? 0;
  const result = useMemo(
    () => emergencyFund({ essentialExpenses: essential, liquid: data.liquid.amount, targetMonths: form.targetMonths, monthlyContribution: form.monthlyContribution }),
    [essential, data.liquid.amount, form.targetMonths, form.monthlyContribution],
  );
  const save = async () => {
    const ok = await action.run(() => api.put('/academy/emergency', {
      targetMonths: form.targetMonths,
      monthlyContribution: Number(form.monthlyContribution || 0),
      useDeclared: form.useDeclared,
      declaredEssential: form.declaredEssential === '' ? null : Number(form.declaredEssential),
    }));
    if (ok) {
      await reload();
      onSaved?.();
    }
  };

  return (
    <>
      <ToolCard step="1" title={tr('Tu situación real')} description={tr('Se reutilizan tus datos de QLC: no capturas de nuevo gastos ni liquidez.')} aside={<KindBadge kind="REAL" />}>
        <div className="source-line">
          <span>Gastos esenciales · {tr(ESSENTIAL_SOURCES[form.useDeclared ? 'DECLARED' : data.autoEssential?.source || 'NONE'])}</span>
          <b>{money(essential)}</b>
        </div>
        {!form.useDeclared && data.autoEssential?.breakdown?.length > 0 && (
          <p className="small muted">{data.autoEssential.breakdown.map((b) => `${BUDGET_LABELS[b.category]} ${money(b.amount)}`).join(' · ')}</p>
        )}
        <label className="check">
          <input type="checkbox" checked={form.useDeclared} disabled={!canEdit} onChange={(e) => setForm({ ...form, useDeclared: e.target.checked })} />
          Declarar mis gastos esenciales manualmente
        </label>
        {form.useDeclared && (
          <Field label={tr('Gastos esenciales mensuales')} hint={tr('Vivienda, alimentación, servicios y otras obligaciones básicas.')}>
            <MoneyInput value={form.declaredEssential} onChange={(e) => setForm({ ...form, declaredEssential: e.target.value })} disabled={!canEdit} placeholder="0" />
          </Field>
        )}
        <div className="source-line">
          <span>{tr('Dinero líquido disponible · Patrimonio y Protección')}</span>
          <b>{money(data.liquid.amount)}</b>
        </div>
        <p className="small muted">
          {tr('Liquidez en Mi portafolio de inversión')}{' '}{money(data.liquid.portfolio)}
          {data.liquid.byType.map((t) => ` · ${PROTECTION_TYPES[t.key] || t.key} ${money(t.amount)}`)}
          {tr('. Para corregirla edita')}{' '}<Link to={`${basePath}/proteccion`}>{tr('Protección')}</Link> {tr('o')} <Link to={`${basePath}/cartera`}>{tr('Mi portafolio de inversión')}</Link>.
        </p>
      </ToolCard>

      <ToolCard step="2" title={tr('Tu meta de reserva')} description={tr('Elige cuántos meses de gastos esenciales quieres cubrir y tu aportación mensual planeada.')} aside={<KindBadge kind="PLAN" />}>
        <div className="field">
          <span className="field-label" id="target-label">{tr('Meta de reserva')}</span>
          <div className="target-chips" role="radiogroup" aria-labelledby="target-label">
            {RESERVE_TARGETS.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={form.targetMonths === n} className={form.targetMonths === n ? 'is-active' : ''} disabled={!canEdit} onClick={() => setForm({ ...form, targetMonths: n })}>{months(n)}</button>
            ))}
          </div>
        </div>
        <Field label={tr('Aportación mensual planeada')} hint={tr('Es un objetivo: no aumenta tu liquidez hasta que la confirmes.')}>
          <MoneyInput value={form.monthlyContribution} onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })} disabled={!canEdit} placeholder="0" />
        </Field>
        <RiskNote>{tr('Las metas de 1, 3, 6, 9 y 12 meses son referencias educativas, no una regla universal. La cantidad adecuada depende de la estabilidad de tus ingresos, responsabilidades y seguros.')}</RiskNote>
        <FormError error={action.error} />
        {canEdit && (
          <div className="form-actions">
            <SaveStatus action={action} savedText={tr('Meta guardada. Protección patrimonial ya la muestra.')} />
            <Button onClick={save} loading={action.busy}>{data.saved ? tr('Actualizar meta') : tr('Guardar meta')}</Button>
          </div>
        )}
      </ToolCard>

      <ToolCard step="3" title={tr('Tu diagnóstico de liquidez')} description={tr('Se recalcula al cambiar tu meta o tus datos.')}>
        <Diagnosis result={result} />
      </ToolCard>
    </>
  );
}

const GOAL_CONCEPTS = ['Ahorro', 'Vacaciones', 'Inversión', 'Comprar casa', 'Comprar auto', 'Educación', 'Retiro'];
const OTHER = '__OTHER__';
const DESTINATIONS = { FONDO_EMERGENCIA: 'Fondo de emergencia', META_PATRIMONIAL: 'Meta patrimonial', AHORRO: 'Ahorro' };
const DEFAULT_TEXT = { FONDO_EMERGENCIA: 'Aportación al fondo de emergencia', META_PATRIMONIAL: 'Aportación a mi meta patrimonial' };

function GoalEditor({ data, reload }) {
  const { api, canEdit } = useWorkspace();
  const action = useAction();
  const current = data.goal?.goal;
  const savedName = current?.name && current.name !== 'Meta patrimonial' ? current.name : '';
  const [f, setF] = useState({
    concept: savedName ? (GOAL_CONCEPTS.includes(savedName) ? savedName : OTHER) : '',
    custom: savedName && !GOAL_CONCEPTS.includes(savedName) ? savedName : '',
    target: String(current?.targetAmount ?? ''),
    monthly: String(current?.monthlyContribution ?? ''),
  });
  const name = f.concept === OTHER ? f.custom.trim() : f.concept;
  const save = async () => {
    if (await action.run(() => api.put('/academy/emergency/goal', { name: name || null, targetAmount: Number(f.target), monthlyContribution: f.monthly === '' ? null : Number(f.monthly) }))) await reload();
  };
  const p = data.goal?.progress;
  return (
    <ToolCard step="4" title={tr('Tu meta patrimonial')} description={tr('Define para qué ahorras, cuánto quieres juntar y cuánto aportarás al mes. Las aportaciones a tu meta se registran aparte y se suman a tu patrimonio.')} aside={<KindBadge kind="PLAN" />}>
      <div className="inline-form">
        <Field label={tr('Concepto de la meta')}>
          <Select value={f.concept} disabled={!canEdit} onChange={(e) => setF({ ...f, concept: e.target.value })} placeholder={tr('Selecciona…')} options={[...GOAL_CONCEPTS.map((c) => ({ value: c, label: c })), { value: OTHER, label: tr('Otro (escríbelo)') }]} />
        </Field>
        {f.concept === OTHER && (
          <Field label={tr('Escribe tu meta')}><Input value={f.custom} maxLength={120} disabled={!canEdit} onChange={(e) => setF({ ...f, custom: e.target.value })} placeholder={tr('Ej. Boda, negocio propio')} /></Field>
        )}
        <Field label={tr('Monto de la meta')}><MoneyInput min="0.01" value={f.target} disabled={!canEdit} onChange={(e) => setF({ ...f, target: e.target.value })} placeholder="0" /></Field>
        <Field label={tr('Aportación mensual planeada')} hint={tr('Es un objetivo: solo cuenta lo que confirmes abajo.')}><MoneyInput value={f.monthly} disabled={!canEdit} onChange={(e) => setF({ ...f, monthly: e.target.value })} placeholder="0" /></Field>
      </div>
      <FormError error={action.error} />
      {canEdit && (
        <div className="form-actions">
          <SaveStatus action={action} savedText={tr('Meta guardada.')} />
          <Button onClick={save} loading={action.busy} disabled={!Number(f.target) || (f.concept === OTHER && !f.custom.trim())}>{current ? tr('Actualizar meta') : tr('Guardar meta')}</Button>
        </div>
      )}
      {p && (
        <>
          <MetricGrid>
            <MetricCard label={tr('Meta')} value={money(p.goal)} hint={savedName ? tr(savedName) : tr('Meta patrimonial')} />
            <MetricCard label={tr('Aportado a la meta')} value={money(p.current)} hint={tr('Aportaciones confirmadas')} />
            <MetricCard label={tr('Falta')} value={money(p.remaining)} tone={p.remaining === 0 ? 'good' : 'warn'} />
            <MetricCard label={tr('Avance')} value={pct(p.progress)} tone={p.reached ? 'good' : ''} />
            <MetricCard label={tr('Tiempo estimado')} value={p.reached ? tr('Meta alcanzada') : p.monthsToGoal === null ? tr('Define una aportación mensual') : months(p.monthsToGoal)} hint={tr('Con la aportación planeada')} />
          </MetricGrid>
          <ProgressBar value={Math.min(100, p.progress || 0)} label={tr('Avance de la meta patrimonial')} />
        </>
      )}
    </ToolCard>
  );
}

function Contributions({ data, reload }) {
  const { api, canEdit } = useWorkspace();
  const action = useAction();
  const [f, setF] = useState({ destination: 'FONDO_EMERGENCIA', source: '', amount: '', description: DEFAULT_TEXT.FONDO_EMERGENCIA });
  const sources = useAsync(() => (data.period?.status === 'OPEN' ? api.get(`/portfolio/income-uses?periodId=${data.period.id}`).catch(() => null) : Promise.resolve(null)), [api, data.period?.id, data.contributions.length]);
  const available = sources.data?.month || [];
  const chosen = available.find((m) => m.positionId === f.source);
  const setDestination = (destination) => setF({ ...f, destination, description: Object.values(DEFAULT_TEXT).includes(f.description) ? DEFAULT_TEXT[destination] : f.description });
  const add = async (e) => {
    e.preventDefault();
    const ok = await action.run(() => (f.source
      ? api.post(`/portfolio/positions/${f.source}/use-income`, { origin: 'MONTH', kind: 'SAVE', destination: f.destination, amount: Number(f.amount), description: f.description })
      : api.post('/academy/emergency/contributions', { destination: f.destination, amount: Number(f.amount), description: f.description })));
    if (ok) {
      setF({ ...f, amount: '', source: '' });
      await reload();
      await sources.reload();
    }
  };
  const remove = async (id) => {
    if (await action.run(() => api.del(`/academy/emergency/contributions/${id}`))) await reload();
  };
  return (
    <ToolCard step="5" title={tr('Aportación realizada')} description={tr('Confirma un depósito real a tu fondo de emergencia o a tu meta patrimonial. Cada uno lleva su propio registro y se suma a tu patrimonio una sola vez.')} aside={<KindBadge kind="REAL" />}>
      {canEdit && (
        <form className="inline-form" onSubmit={add}>
          <Field label={tr('Destino')}>
            <Select value={f.destination} onChange={(e) => setDestination(e.target.value)} options={[{ value: 'FONDO_EMERGENCIA', label: tr('Fondo de emergencia') }, ...(data.goal?.goal ? [{ value: 'META_PATRIMONIAL', label: tr('Meta patrimonial') }] : [])]} />
          </Field>
          <Field label={tr('¿De dónde sale el dinero?')} hint={chosen ? tr('Disponible de la rentabilidad de este mes: {amount}', { amount: money(chosen.available) }) : tr('Elige una inversión si quieres tomarlo de su rentabilidad por decidir.')}>
            <Select value={f.source} onChange={(e) => {
              const pick = available.find((m) => m.positionId === e.target.value);
              setF({ ...f, source: e.target.value, amount: pick ? String(pick.available) : f.amount });
            }} options={[{ value: '', label: tr('Dinero nuevo (ahorro de este mes)') }, ...available.map((m) => ({ value: m.positionId, label: tr('Rentabilidad de {name} · {amount}', { name: m.name, amount: money(m.available) }) }))]} />
          </Field>
          <Field label={tr('Importe aportado')}><MoneyInput required min="0.01" max={chosen ? chosen.available : undefined} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label={tr('Concepto')}><Input required maxLength={200} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Button type="submit" loading={action.busy}>{tr('Confirmar aportación')}</Button>
        </form>
      )}
      <FormError error={action.error} />
      <DataTable
        rows={data.contributions}
        empty={tr('Sin aportaciones confirmadas en el periodo actual.')}
        columns={[
          { key: 'date', label: tr('Fecha'), render: (c) => date(c.date) },
          { key: 'destination', label: tr('Destino'), render: (c) => tr(DESTINATIONS[c.destination] || c.destination) },
          { key: 'description', label: tr('Concepto') },
          { key: 'amount', label: 'Importe', align: 'right', render: (c) => money(c.amount) },
          ...(canEdit ? [{ key: 'x', label: '', align: 'right', render: (c) => <button type="button" className="btn-link danger" onClick={() => remove(c.id)}>{tr('Eliminar')}</button> }] : []),
        ]}
      />
    </ToolCard>
  );
}

export function M8EmergencyFund({ onSaved }) {
  const { api } = useWorkspace();
  const res = useAsync(() => api.get('/academy/emergency'), [api]);
  if (res.loading && !res.data) return <ToolSkeleton />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const data = res.data;
  return (
    <div className="tool">
      <PlanEditor key={`${data.plan?.updatedAt || 'new'}-${data.liquid.amount}`} data={data} reload={res.reload} onSaved={onSaved} />
      <GoalEditor key={`goal-${data.goal?.goal?.updatedAt || 'new'}`} data={data} reload={res.reload} />
      {data.period ? <Contributions data={data} reload={res.reload} /> : <p className="empty-inline">{tr('Completa tu diagnóstico (Módulo 1) para registrar tu liquidez real.')}</p>}
    </div>
  );
}

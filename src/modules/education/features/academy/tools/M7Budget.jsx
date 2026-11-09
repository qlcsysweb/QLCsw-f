import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUDGET_EXPENSE_CATEGORIES, BUDGET_OPTIONAL_CATEGORIES, budgetView, CUSTOM_NAME_MAX, customCategory, customName, isCustomCategory } from '@shared/patrimonial.js';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { dateTime, money, pct, periodLabel } from '../../../utils/format.js';
import { BUDGET_LABELS } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { Field, FormError, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { Notice, ProgressBar } from '../../../components/ui/Card.jsx';
import { ErrorState } from '../../../components/ui/States.jsx';
import { KindBadge, MetricCard, MetricGrid, RiskNote, SaveStatus, ToolCard, ToolSkeleton } from '../ResultParts.jsx';
import { useAction } from '../useAction.js';
import { tr } from '../../../i18n/tr.js';

const STATUS = {
  OVER: ['Superó el plan', 'bad'],
  WITHIN: ['Dentro del plan', 'good'],
  MET: ['Objetivo cumplido', 'good'],
  PENDING: ['Objetivo pendiente', 'warn'],
};
const STEPS = [
  ['¿Cuánto dinero recibes?', 'Escribe tu ingreso mensual neto.'],
  ['¿Cómo quieres distribuirlo?', 'Asigna un porcentaje o un importe a cada categoría.'],
  ['¿Qué ocurrió realmente?', 'Anota lo que realmente gastaste, ahorraste o invertiste.'],
  ['¿Cómo terminaste el mes?', 'Revisa excesos de gasto y metas pendientes.'],
];
const pad = (n) => String(n).padStart(2, '0');
const toInput = ({ year, month }) => `${year}-${pad(month)}`;
const fromInput = (v) => {
  const [year, month] = v.split('-').map(Number);
  return { year, month };
};
const today = () => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const CUSTOM_OPTION = '__custom';
const categoryLabel = (c) => (isCustomCategory(c) ? customName(c) : tr(BUDGET_LABELS[c]));
const actualOptions = (lines) => [
  ...BUDGET_EXPENSE_CATEGORIES.filter((c) => c !== 'DEUDAS').map((c) => ({ value: c, label: BUDGET_LABELS[c] })),
  ...lines.filter((l) => isCustomCategory(l.category)).map((l) => ({ value: l.category, label: customName(l.category) })),
  { value: 'AHORRO', label: BUDGET_LABELS.AHORRO },
];
const sameLines = (a, b) => a.length === b.length && a.every((l) => Number(l.percent || 0) === b.find((x) => x.category === l.category)?.percent);

function differenceText(row) {
  if (row.kind !== 'EXPENSE') return row.difference > 0 ? tr('Faltan {amount} para la meta', { amount: money(row.difference) }) : tr('Meta cumplida (+{amount})', { amount: money(Math.abs(row.difference)) });
  return row.difference < 0 ? tr('{amount} por encima del plan', { amount: money(Math.abs(row.difference)) }) : tr('{amount} de margen', { amount: money(row.difference) });
}

function RealCell({ row, month, editable, action, onSaved }) {
  const { api } = useWorkspace();
  const [value, setValue] = useState(String(row.actual || ''));
  const changed = Number(value || 0) !== row.actual;
  const save = async () => {
    const ok = await action.run(() => api.put('/academy/budget/actuals', { ...month, category: row.category, amount: Number(value || 0) }));
    if (ok) onSaved();
    else setValue(String(row.actual || ''));
  };
  if (row.kind === 'FREE') return <span>{money(row.actual)}<span className="small block muted">{tr('Se calcula solo')}</span></span>;
  if (!editable) return money(row.actual);
  return (
    <div className="real-cell">
      <MoneyInput
        className="input amount-input"
        aria-label={tr('Importe real de {category}', { category: categoryLabel(row.category) })}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && changed) { e.preventDefault(); save(); } }}
        placeholder="0"
      />
      {changed && <button type="button" className="btn-link" onClick={save} disabled={action.busy}>{tr('Guardar')}</button>}
    </div>
  );
}

function RealMovementForm({ month, lines, onRecorded, disabled }) {
  const { api } = useWorkspace();
  const action = useAction();
  const [f, setF] = useState({ category: 'VIVIENDA', amount: '', description: '' });
  const submit = async (e) => {
    e.preventDefault();
    const ok = await action.run(() => api.post('/academy/budget/actuals', { ...month, ...f }));
    if (ok) {
      setF({ ...f, amount: '', description: '' });
      onRecorded();
    }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <div className="inline-form">
        <Field label={tr('Categoría')}><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={actualOptions(lines)} disabled={disabled} /></Field>
        <Field label={tr('Importe real')}><MoneyInput required min="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} disabled={disabled} /></Field>
        <Field label={tr('Concepto')}><Input required maxLength={200} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={tr('Ej. Renta de octubre')} disabled={disabled} /></Field>
        <Button type="submit" variant="secondary" loading={action.busy} disabled={disabled}>{tr('Agregar movimiento')}</Button>
      </div>
      <FormError error={action.error} />
      <SaveStatus action={action} savedText={tr('Movimiento registrado una sola vez en tu información real.')} />
    </form>
  );
}

function AddCategory({ available, lines, onAdd }) {
  const [choice, setChoice] = useState('');
  const [name, setName] = useState('');
  const custom = choice === CUSTOM_OPTION;
  const category = custom ? customCategory(name) : choice;
  const duplicate = custom && lines.some((l) => l.category.toLowerCase() === category.toLowerCase());
  const valid = custom ? name.trim().length > 0 && !duplicate : !!choice;
  const add = () => {
    onAdd(category);
    setChoice('');
    setName('');
  };
  return (
    <div className="stack">
      <div className="inline-form">
        <Field label={tr('Agregar categoría')} hint={tr('Elige una sugerencia o escribe la tuya.')}>
          <Select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            options={[...available.map((c) => ({ value: c, label: BUDGET_LABELS[c] })), { value: CUSTOM_OPTION, label: 'Otra: escribir mi categoría…' }]}
            placeholder={tr('Selecciona')}
          />
        </Field>
        {custom && (
          <Field label={tr('Nombre de tu categoría')} error={duplicate ? tr('Esa categoría ya está en tu presupuesto.') : null}>
            <Input autoFocus maxLength={CUSTOM_NAME_MAX} value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('Ej. Mascotas, gimnasio, regalos')} onKeyDown={(e) => { if (e.key === 'Enter' && valid) { e.preventDefault(); add(); } }} />
          </Field>
        )}
        <Button type="button" variant="secondary" disabled={!valid} onClick={add}>{tr('Agregar')}</Button>
      </div>
    </div>
  );
}

function BudgetEditor({ data, history, reload, onSaved, monthField }) {
  const { api, canEdit, basePath } = useWorkspace();
  const action = useAction();
  const realAction = useAction();
  const [netIncome, setNetIncome] = useState(String(data.netIncome || ''));
  const [lines, setLines] = useState(data.lines.map((l) => ({ ...l, percent: String(l.percent) })));
  const [drafts, setDrafts] = useState({});
  const [template, setTemplate] = useState('');
  const view = useMemo(() => budgetView({ netIncome, lines, actuals: data.actuals }), [netIncome, lines, data.actuals]);
  const month = { year: data.year, month: data.month };
  const closed = data.period?.status === 'CLOSED';
  const editable = canEdit && !closed;
  const income = Number(netIncome || 0);
  const available = BUDGET_OPTIONAL_CATEGORIES.filter((c) => !lines.some((l) => l.category === c));
  const setPercent = (category, percent) => setLines(lines.map((l) => (l.category === category ? { ...l, percent } : l)));
  const setPlanned = (category, amount) => {
    setDrafts({ ...drafts, [category]: amount });
    setPercent(category, amount === '' ? '' : String(round((Number(amount) / income) * 100, 4)));
  };
  const addLine = (category, percent = '0') => {
    const tail = lines.findIndex((l) => ['FLUJO_DISPONIBLE', 'AHORRO', 'INVERSION'].includes(l.category));
    const isTarget = ['FLUJO_DISPONIBLE', 'AHORRO', 'INVERSION'].includes(category);
    if (isTarget || tail < 0) return setLines([...lines, { category, percent }]);
    setLines([...lines.slice(0, tail), { category, percent }, ...lines.slice(tail)]);
  };
  const surplusAction = useAction();
  const [split, setSplit] = useState(null);
  const surplus = round(view.tableBalance, 2);
  const parts = split || { AHORRO: String(surplus), INVERSION: '0' };
  const partsTotal = round(Number(parts.AHORRO || 0) + Number(parts.INVERSION || 0), 2);
  const assignSurplus = async () => {
    const ok = await surplusAction.run(async () => {
      if (Number(parts.AHORRO) > 0) await api.put('/academy/budget/actuals', { ...month, category: 'AHORRO', amount: round(view.savingsActual + Number(parts.AHORRO), 2) });
      if (Number(parts.INVERSION) > 0) await api.put('/academy/budget/actuals', { ...month, category: 'INVERSION', amount: round(view.investmentActual + Number(parts.INVERSION), 2) });
    });
    if (ok) {
      setSplit(null);
      await reload();
    }
  };
  const locked = !data.saved;
  const dirty = data.saved ? income !== data.netIncome || !sameLines(lines, data.lines) : true;
  const templates = history.filter((h) => h.year !== data.year || h.month !== data.month);
  const applyTemplate = () => {
    const chosen = templates.find((h) => `${h.year}-${h.month}` === template);
    if (!chosen) return;
    setLines(chosen.lines.map((l) => ({ ...l, percent: String(l.percent) })));
    setDrafts({});
    setTemplate('');
  };
  const over = view.rows.filter((r) => r.status === 'OVER');
  const sumOf = (rows, key) => rows.reduce((acc, r) => acc + r[key], 0);
  const expenseRows = view.rows.filter((r) => r.kind === 'EXPENSE');
  const fixedRows = view.rows.filter((r) => r.kind !== 'FREE');
  const outside = view.unbudgetedExpenses + view.diagnosisPending;
  const debtRow = { planned: view.debtPlanned, actual: view.debtPayments };
  const totalRow = (label, rows, plannedText) => (
    <tr className="table-total">
      <td data-label={tr('Categoría')}><b>{tr(label)}</b></td>
      <td data-label={tr('Planeado')} className="right"><b>{plannedText ?? money(sumOf(rows, 'planned'))}</b></td>
      <td data-label={tr('Real')} className="right"><b>{money(sumOf(rows, 'actual'))}</b></td>
      <td data-label={tr('Diferencia')} className="right"><b>{plannedText ? '—' : money(sumOf(rows, 'planned') - sumOf(rows, 'actual'))}</b></td>
      <td />
    </tr>
  );
  const confirmAction = useAction();
  const confirmReal = async () => {
    if (await confirmAction.run(() => api.post('/academy/budget/confirm-real', month))) await reload();
  };
  const pending = view.rows.filter((r) => r.status === 'PENDING' && r.planned > 0);

  const save = async () => {
    const ok = await action.run(() => api.put('/academy/budget', { ...month, netIncome: income, lines: lines.map((l) => ({ category: l.category, percent: Number(l.percent || 0) })) }));
    if (ok) {
      await reload();
      onSaved?.();
    }
  };

  return (
    <>
      <ToolCard step="1" title={tr('¿Cuánto dinero recibes?')} description={tr('Elige el mes y escribe tu ingreso mensual neto: lo que realmente recibes después de impuestos y deducciones.')}>
        <div className="form-grid cols-2">
          {monthField}
          <Field label={tr('Ingreso mensual neto')} hint={tr('Ingreso real registrado en Ingresos y gastos para {period}: {amount}', { period: periodLabel(month), amount: money(data.realIncome) })}>
            <MoneyInput value={netIncome} onChange={(e) => setNetIncome(e.target.value)} disabled={!editable} placeholder="0" />
          </Field>
        </div>
        {data.incomeFromPortfolio > 0 && <p className="small muted">{tr('Incluye {amount} pasados desde tu portafolio de inversión.', { amount: money(data.incomeFromPortfolio) })}</p>}
        {income === 0 && data.realIncome === 0 && editable && (
          <Notice variant="gold">{tr('Si vives de tus inversiones, ve a Mi portafolio de inversión y usa «Pasar a ingresos» en la rentabilidad que quieras desglosar. Ese monto aparecerá aquí para que puedas distribuirlo.')} <Link to={`${basePath}/cartera`}>{tr('Ir a Mi portafolio de inversión')}</Link></Notice>
        )}
        {data.realIncome > 0 && income !== data.realIncome && editable && (
          <Button type="button" variant="secondary" onClick={() => setNetIncome(String(data.realIncome))}>{tr('Usar el ingreso registrado ({amount})', { amount: money(data.realIncome) })}</Button>
        )}
      </ToolCard>

      <ToolCard step="2" title={tr('¿Cómo quieres distribuirlo?')} description={tr('Asigna un porcentaje o escribe directamente el importe planeado; el otro valor se calcula solo. Las categorías que ves son un ejemplo: puedes llenarlas, quitar las que no uses con «Quitar» y agregar las tuyas propias con «Agregar categoría». Distribuir el 100% no significa que el dinero ya se gastó: solo le das un destino.')} aside={<KindBadge kind="PLAN" />}>
        <DataTable
          rowKey="category"
          rows={view.rows}
          columns={[
            { key: 'category', label: tr('Categoría'), render: (r) => <b>{categoryLabel(r.category)}</b> },
            {
              key: 'percent', label: tr('% del ingreso'), align: 'right', render: (r) => (
                <input
                  className="input pct-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  aria-label={tr('Porcentaje de {category}', { category: categoryLabel(r.category) })}
                  value={lines.find((l) => l.category === r.category).percent}
                  onChange={(e) => { setDrafts({ ...drafts, [r.category]: undefined }); setPercent(r.category, e.target.value); }}
                  disabled={!editable}
                />
              ),
            },
            {
              key: 'planned', label: tr('Importe planeado'), align: 'right', render: (r) => (editable && income > 0 ? (
                <MoneyInput
                  className="input amount-input"
                  aria-label={tr('Importe planeado de {category}', { category: categoryLabel(r.category) })}
                  value={drafts[r.category] ?? String(round(r.planned, 2))}
                  onChange={(e) => setPlanned(r.category, e.target.value)}
                  onBlur={() => setDrafts({ ...drafts, [r.category]: undefined })}
                />
              ) : money(r.planned)),
            },
            ...(editable ? [{ key: 'x', label: '', align: 'right', render: (r) => <button type="button" className="btn-link danger" onClick={() => setLines(lines.filter((l) => l.category !== r.category))} aria-label={tr('Quitar {label}', { label: categoryLabel(r.category) })}>{tr('Quitar')}</button> }] : []),
          ]}
        />
        <div className="budget-debt">
          <b>{tr('Pagos de deudas (pago mensual del Módulo 9)')}</b>
          <span>{pct(view.debtPercent)}</span>
          <span>{money(view.debtPlanned)}</span>
          <small className="muted">
            {view.debtPlanned > 0
              ? tr('Se suma solo: toma el pago mensual de deudas que declaraste en el Módulo 1 y, cuando las desgloses una por una en el Módulo 9, se actualiza con el pago de cada obligación. Cuenta dentro del 100%.')
              : tr('Sin deudas registradas: queda en $0. Se suma solo con el pago mensual de deudas que declares en el Módulo 1 y después con el desglose de cada obligación en el Módulo 9.')}
            {' '}<Link to={`${basePath}/academia/m/9`}>{tr('Ir al Módulo 9')}</Link>
          </small>
          {data.debtBreakdown && data.debtBreakdown.declaredBalance > 0 && (
            <div className="debt-breakdown">
              <ProgressBar value={data.debtBreakdown.balancePercent} label={tr('Deudas desglosadas en el Módulo 9')} />
              <small className={data.debtBreakdown.pendingBalance > 0 ? 'warn-text' : 'up'}>
                {data.debtBreakdown.pendingBalance > 0
                  ? tr('{pct} desglosado en el Módulo 9 · faltan {amount} de {declared}', { pct: pct(data.debtBreakdown.balancePercent), amount: money(data.debtBreakdown.pendingBalance), declared: money(data.debtBreakdown.declaredBalance) })
                  : tr('100% desglosado en el Módulo 9')}
              </small>
            </div>
          )}
        </div>
        <div className="budget-total">
          <ProgressBar value={Math.min(100, view.percentTotal)} label={tr('Ingreso distribuido')} />
          <b className={view.complete ? '' : 'is-off'}>{pct(view.percentTotal)} · {money(view.totalPlanned)}</b>
          {!view.complete && <span className="warn-text small">{view.percentGap > 0 ? tr('Faltan {pct} por asignar', { pct: pct(view.percentGap) }) : tr('Te pasaste por {pct}', { pct: pct(Math.abs(view.percentGap)) })}</span>}
        </div>
        {editable && <AddCategory available={available} lines={lines} onAdd={(c) => addLine(c)} />}
        {editable && templates.length > 0 && (
          <div className="inline-form">
            <Field label={tr('Copiar la distribución de otro mes')}>
              <Select value={template} onChange={(e) => setTemplate(e.target.value)} options={templates.map((h) => ({ value: `${h.year}-${h.month}`, label: periodLabel(h) }))} placeholder={tr('Selecciona un mes guardado')} />
            </Field>
            <Button type="button" variant="secondary" disabled={!template} onClick={applyTemplate}>{tr('Copiar distribución')}</Button>
          </div>
        )}
        <RiskNote>{tr('Los porcentajes iniciales son un ejemplo educativo editable, no una regla universal. El ahorro y la inversión planeados son metas: no crean ahorro acumulado ni activos.')}</RiskNote>
        <FormError error={action.error} />
        {data.saved && (
          <p className="budget-saved small">
            {tr('Presupuesto de {period} guardado en tu cuenta ({date}). Puedes cambiar el ingreso o los porcentajes y pulsar «Actualizar presupuesto» cuantas veces lo necesites mientras el mes no tenga un corte cerrado. Tus presupuestos guardados aparecen al final de esta página.', { period: periodLabel(month), date: dateTime(data.updatedAt) })}
          </p>
        )}
        {editable && (
          <div className="form-actions">
            <SaveStatus action={action} savedText={tr('Presupuesto guardado para este mes.')} />
            {!view.complete && <span className="small muted">{tr('Para guardar, la distribución debe sumar 100%.')}</span>}
            <Button onClick={save} loading={action.busy} disabled={!view.complete || !dirty}>{data.saved ? tr('Actualizar presupuesto') : tr('Guardar presupuesto')}</Button>
          </div>
        )}
        {closed && <Notice variant="gold">{tr('Este mes tiene un corte cerrado: el presupuesto se conserva en el historial y no se modifica.')}</Notice>}
      </ToolCard>

      <ToolCard step="3" title={tr('¿Qué ocurrió realmente?')} description={tr('El importe real se toma de Ingresos y gastos. Puedes corregirlo aquí: escribe el total real de la categoría y pulsa Guardar; el ajuste se registra una sola vez en tu información real.')} aside={<KindBadge kind="REAL" />}>
        {locked ? (
          <div className="locked-step">
            <b>{tr('Primero guarda tu presupuesto')}</b>
            <p className="small">{tr('Completa el paso 2 hasta sumar 100% y pulsa «Guardar presupuesto». Después podrás registrar aquí lo que ocurrió realmente en el mes.')}</p>
          </div>
        ) : !data.period ? (
          <p className="empty-inline">{tr('Este mes aún no tiene periodo en')}{' '}<Link to={`${basePath}/ingresos-gastos`}>{tr('Ingresos y gastos')}</Link>{tr('. Crea el periodo para registrar movimientos reales.')}</p>
        ) : (
          <>
            <DataTable
              rowKey="category"
              rows={view.rows}
              columns={[
                { key: 'category', label: tr('Categoría'), render: (r) => <b>{categoryLabel(r.category)}</b> },
                { key: 'planned', label: tr('Planeado'), align: 'right', render: (r) => money(r.planned) },
                { key: 'actual', label: tr('Real'), align: 'right', render: (r) => <RealCell key={`${r.category}-${r.actual}`} row={r} month={month} editable={editable} action={realAction} onSaved={reload} /> },
                { key: 'difference', label: tr('Diferencia'), align: 'right', render: (r) => <span className={r.status === 'OVER' ? 'down' : r.status === 'PENDING' ? 'warn-text' : 'up'}>{differenceText(r)}</span> },
                { key: 'status', label: tr('Estado'), render: (r) => <span className={`status-chip tone-${STATUS[r.status][1]}`}>{tr(STATUS[r.status][0])}</span> },
              ]}
              footer={(
                <>
                  {totalRow('Total de gastos', expenseRows)}
                  {view.debtPayments > 0 && totalRow('Pagos de deudas (pago mensual del Módulo 9)', [debtRow])}
                  {totalRow('Total con deudas, ahorro e inversión', [...fixedRows, debtRow])}
                </>
              )}
            />
            <FormError error={realAction.error} />
            <SaveStatus action={realAction} savedText={tr('Importe real actualizado.')} />
            {view.tableBalance > 0.004 && (
              <div className="surplus-alert">
                <b>{tr('Te sobran {amount} este mes (saldo estimado).', { amount: money(view.tableBalance) })}</b>
                <p className="small">{tr('Es la diferencia positiva entre tu ingreso y todo lo que registraste en tu tabla. Decide cuánto mandas a ahorro y cuánto a inversión; puedes repartirlo o mandar todo a uno solo. Lo que mandes a ahorro se suma a tu liquidez; lo que mandes a inversión lo asignarás después a un producto en Mi portafolio de inversión.')}</p>
                {editable && (
                  <div className="inline-form">
                    <Field label={tr('A Ahorro')}><MoneyInput value={parts.AHORRO} onChange={(e) => setSplit({ ...parts, AHORRO: e.target.value })} /></Field>
                    <Field label={tr('A Inversión')}><MoneyInput value={parts.INVERSION} onChange={(e) => setSplit({ ...parts, INVERSION: e.target.value })} /></Field>
                    <Button type="button" variant="secondary" loading={surplusAction.busy} disabled={partsTotal <= 0 || partsTotal > surplus + 0.004} onClick={assignSurplus}>{tr('Asignar')}</Button>
                  </div>
                )}
                {partsTotal > surplus + 0.004 && <span className="small down">{tr('Te pasaste por {amount}.', { amount: money(partsTotal - surplus) })}</span>}
                <FormError error={surplusAction.error} />
              </div>
            )}
            {view.investmentActual > 0 && (
              <p className="small warn-text">{tr('Registraste {amount} de inversión real.', { amount: money(view.investmentActual) })}{' '}<Link to={`${basePath}/cartera`}>{tr('Dirígete a Mi portafolio de inversión')}</Link>{' '}{tr('para registrar en qué producto la invertiste. Mientras no la asignes, Inicio te mostrará el aviso.')}</p>
            )}
            {Math.abs(view.debtRecorded - view.debtPayments) > 0.005 && view.debtPayments > 0 && (
              <p className="small warn-text">{tr('El renglón de deudas usa el pago mensual planeado del Módulo 9 ({plan}). En Ingresos y gastos hay {recorded} registrados este mes en la categoría Deudas (pagos confirmados y, si existe, el pago declarado en el diagnóstico). Revisa esa lista por si hay pagos duplicados.', { plan: money(view.debtPayments), recorded: money(view.debtRecorded) })}</p>
            )}
            <p className="small muted">{tr('Diferencia = planeado − real. En gastos, un número positivo es margen y uno negativo es exceso. En ahorro e inversión indica cuánto falta para la meta. La inversión real que escribas aquí se registra como aportación en')}{' '}<Link to={`${basePath}/movimientos`}>{tr('Movimientos')}</Link>{tr('; agrega o actualiza el producto en')}{' '}<Link to={`${basePath}/cartera`}>{tr('Mi portafolio de inversión')}</Link>{' '}{tr('para mantenerla conciliada.')}</p>
            {view.diagnosisPending > 0 && (
              <div className="pending-diagnosis">
                <b>{tr('Gasto del diagnóstico por desglosar: {amount}', { amount: money(view.diagnosisPending) })}</b>
                <p className="small">{tr('Es el gasto mensual global que declaraste en el Módulo 1. Se reduce automáticamente cada vez que registras un gasto real por categoría. Cuando termines de anotar tus gastos reales, confírmalos para que Inicio e Ingresos y gastos usen solo tus cifras reales.')}</p>
                {editable && <Button type="button" variant="secondary" loading={confirmAction.busy} onClick={confirmReal}>{tr('Confirmar mis gastos reales del mes')}</Button>}
                <FormError error={confirmAction.error} />
              </div>
            )}
            {view.unbudgeted.length > 0 && (
              <div className="unbudgeted">
                <b>{tr('Gastos reales fuera de tu presupuesto: {amount}', { amount: money(view.unbudgetedExpenses) })}</b>
                <p className="small">{tr('Estos gastos ya están registrados en Ingresos y gastos, pero su categoría no está en tu distribución. Sí se descuentan del saldo estimado. Agrégalas al presupuesto para controlarlas.')}</p>
                <ul>
                  {view.unbudgeted.map((u) => (
                    <li key={u.category}>
                      <span>{categoryLabel(u.category)}</span>
                      <b>{money(u.actual)}</b>
                      {editable && <button type="button" className="btn-link" onClick={() => addLine(u.category, income > 0 ? String(round((u.actual / income) * 100, 4)) : '0')}>{tr('Agregar al presupuesto')}</button>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <details className="more-actions">
              <summary>{tr('Agregar un movimiento con concepto')}</summary>
              <RealMovementForm month={month} lines={lines} onRecorded={reload} disabled={!editable} />
            </details>
          </>
        )}
      </ToolCard>

      <ToolCard step="4" title={tr('¿Cómo terminaste el mes?')} description={tr('Resumen del mes con todos los importes reales registrados, incluidos los que están fuera de tu presupuesto.')}>
        {locked ? <p className="empty-inline">{tr('Disponible cuando guardes tu presupuesto.')}</p> : (
        <>
        <MetricGrid>
          <MetricCard label={tr('Ingreso mensual neto')} value={money(view.netIncome)} />
          <MetricCard label={tr('Gastos planeados')} value={money(view.expensesPlanned)} hint={tr('Categorías de gasto de tu tabla')} />
          <MetricCard label={tr('Gastos reales')} value={money(view.expensesActual)} tone={view.expensesActual > view.expensesPlanned ? 'bad' : 'good'} hint={[tr('Suma de las categorías de gasto de tu tabla.'), view.debtPayments > 0 ? tr('Además pagas {amount} de deudas (Módulo 9).', { amount: money(view.debtPayments) }) : '', outside > 0 ? tr('No incluye {amount} fuera de tus categorías o por desglosar.', { amount: money(outside) }) : ''].filter(Boolean).join(' ')} />
          <MetricCard label={tr('Ahorro real')} value={money(view.savingsActual)} hint={tr('Meta: {amount}', { amount: money(view.savingsPlanned) })} tone={view.savingsPlanned > 0 && view.savingsActual >= view.savingsPlanned ? 'good' : 'warn'} />
          <MetricCard label={tr('Inversión real')} value={money(view.investmentActual)} hint={tr('Meta: {amount}', { amount: money(view.investmentPlanned) })} tone={view.investmentPlanned > 0 && view.investmentActual >= view.investmentPlanned ? 'good' : 'warn'} />
          <MetricCard
            label={tr('Saldo estimado')}
            value={money(view.tableBalance)}
            tone={view.tableBalance < 0 ? 'bad' : ''}
            hint={tr('{income} − {actual} de gastos, deudas, ahorro e inversión', { income: money(view.netIncome), actual: money(view.netIncome - view.tableBalance) })}
            explanation="Ingreso menos el total real de tu tabla: gastos de tus categorías, pagos de deudas, ahorro e inversión. Es igual a tu flujo disponible real. Es una estimación: no equivale a tu saldo bancario ni a tu patrimonio neto."
          />
        </MetricGrid>
        <div className="month-close">
          {over.length === 0 && pending.length === 0 && view.unbudgeted.length === 0 ? (
            <p className="up">{tr('Cumpliste tu presupuesto: ningún gasto superó el plan y tus metas están cubiertas.')}</p>
          ) : (
            <ul>
              {over.map((r) => <li key={r.category} className="down">{tr('{category}: gastaste {amount} más de lo planeado.', { category: categoryLabel(r.category), amount: money(Math.abs(r.difference)) })}</li>)}
              {pending.map((r) => <li key={r.category} className="warn-text">{tr('{category}: faltan {amount} para tu meta.', { category: categoryLabel(r.category), amount: money(r.difference) })}</li>)}
              {view.unbudgeted.length > 0 && <li className="warn-text">{tr('Tienes {amount} en gastos sin presupuesto.', { amount: money(view.unbudgetedExpenses) })}</li>}
            </ul>
          )}
          <p className="small muted">{tr('Usa este resultado para ajustar el presupuesto del próximo mes.')}</p>
        </div>
        </>
        )}
      </ToolCard>
    </>
  );
}

function BudgetHistory({ history, current, onSelect }) {
  const { api } = useWorkspace();
  const [error, setError] = useState(null);
  if (!history.length) return null;
  const download = (h) => api.download(`/academy/budget/pdf?year=${h.year}&month=${h.month}`, `QLC_Presupuesto_${h.year}_${String(h.month).padStart(2, '0')}.pdf`).catch(setError);
  return (
    <ToolCard title={tr('Presupuestos guardados')} description={tr('Cada presupuesto se guarda por mes en tu cuenta. Abre uno para revisarlo, corregirlo o copiar su distribución a otro mes.')}>
      <DataTable
        rowKey="key"
        rows={history.map((h) => ({ ...h, key: `${h.year}-${h.month}` }))}
        columns={[
          { key: 'month', label: tr('Mes'), render: (h) => <b>{periodLabel(h)}</b> },
          { key: 'netIncome', label: tr('Ingreso neto'), align: 'right', render: (h) => money(h.netIncome) },
          { key: 'lines', label: tr('Distribución'), render: (h) => <span className="small">{h.lines.map((l) => `${categoryLabel(l.category)} ${pct(l.percent)}`).join(' · ')}</span> },
          { key: 'updatedAt', label: tr('Guardado'), render: (h) => <span className="small">{dateTime(h.updatedAt)}</span> },
          { key: 'x', label: '', align: 'right', render: (h) => (
            <span className="row-actions">
              <button type="button" className="btn-link" onClick={() => download(h)}>{tr('Descargar PDF')}</button>
              {h.year === current.year && h.month === current.month ? <span className="small muted">{tr('Abierto')}</span> : <button type="button" className="btn-link" onClick={() => onSelect({ year: h.year, month: h.month })}>{tr('Abrir')}</button>}
            </span>
          ) },
        ]}
      />
      <FormError error={error} />
    </ToolCard>
  );
}

export function M7Budget({ onSaved }) {
  const { api, period } = useWorkspace();
  const [month, setMonth] = useState(() => (period ? { year: period.year, month: period.month } : today()));
  const res = useAsync(() => api.get(`/academy/budget?year=${month.year}&month=${month.month}`), [api, month.year, month.month]);
  const history = useAsync(() => api.get('/academy/budget/history'), [api]);
  const reloadAll = async () => {
    await Promise.all([res.reload(), history.reload()]);
  };
  const monthField = (
    <Field label={tr('Mes del presupuesto')} hint={res.data ? (res.data.saved ? tr('Presupuesto guardado') : tr('Sin presupuesto guardado: distribución inicial de ejemplo')) : null}>
      <Input type="month" required value={toInput(month)} onChange={(e) => e.target.value && setMonth(fromInput(e.target.value))} />
    </Field>
  );

  return (
    <div className="tool">
      <Notice>
        <b>{tr('Para qué sirve:')}</b>{' '}{tr('planear qué harás con tu dinero, anotar lo que realmente pasó y comprobar si cumpliste tu plan. Es una herramienta de organización personal, no de inversión.')}
        <ol className="m7-steps">{STEPS.map(([title, text]) => <li key={title}><b>{tr(title)}</b> {tr(text)}</li>)}</ol>
      </Notice>
      {res.loading && !res.data && (
        <>
          <ToolCard step="1" title={tr('¿Cuánto dinero recibes?')}><div className="form-grid cols-2">{monthField}</div></ToolCard>
          <ToolSkeleton />
        </>
      )}
      {res.error && <ErrorState error={res.error} onRetry={res.reload} />}
      {res.data && !res.error && (
        <BudgetEditor key={`${toInput(month)}-${res.data.updatedAt || 'new'}`} data={res.data} history={history.data || []} reload={reloadAll} onSaved={onSaved} monthField={monthField} />
      )}
      <BudgetHistory history={history.data || []} current={month} onSelect={(m) => { setMonth(m); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    </div>
  );
}

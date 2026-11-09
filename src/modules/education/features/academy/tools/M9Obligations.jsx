import { useState } from 'react';
import { Link } from 'react-router-dom';
import { debtPayment } from '@shared/patrimonial.js';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { money, pct } from '../../../utils/format.js';
import { DEBT_TYPES, options } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { Field, FormError, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { ConfirmDialog, Modal } from '../../../components/ui/Modal.jsx';
import { Notice, Pill, ProgressBar } from '../../../components/ui/Card.jsx';
import { ErrorState } from '../../../components/ui/States.jsx';
import { ExplainRows, KindBadge, MetricCard, MetricGrid, RiskNote, SaveStatus, ToolCard, ToolSkeleton } from '../ResultParts.jsx';
import { useAction } from '../useAction.js';
import { tr } from '../../../i18n/tr.js';

const EMPTY = { name: '', type: 'TARJETA_CREDITO', customType: '', balance: '', annualRate: '', payment: '', fees: '' };
const toForm = (d) => ({ name: d.name, type: d.type, customType: d.customType || '', balance: d.balance, annualRate: d.annualRate ?? '', payment: d.payment, fees: d.fees });
export const debtTypeLabel = (d) => (d.type === 'OTRA' && d.customType ? d.customType : DEBT_TYPES[d.type]);
const toBody = (f) => ({ ...f, balance: Number(f.balance || 0), payment: Number(f.payment || 0), fees: Number(f.fees || 0), annualRate: f.annualRate === '' ? null : Number(f.annualRate) });
const DIAGNOSIS_DEBTS = ['Deudas por desglosar (diagnóstico)', 'Deudas totales (diagnóstico)'];
export const isDiagnosisDebt = (d) => DIAGNOSIS_DEBTS.includes(d.name);
export const FEES_LABEL = 'Comisiones y seguros incluidos en el pago';
export const FEES_HINT = 'Solo la parte del pago mensual que no es interés ni capital. No repitas aquí el pago.';

function ratioText(ratio) {
  if (ratio === null) return tr('Registra ingresos del periodo en Ingresos y gastos para calcular la proporción.');
  if (ratio <= 10) return tr('Los pagos registrados representan una proporción baja del ingreso declarado según este indicador ilustrativo.');
  if (ratio <= 25) return tr('Los pagos registrados representan una proporción moderada del ingreso declarado según este indicador ilustrativo.');
  return tr('Los pagos registrados representan una proporción elevada del ingreso declarado según este indicador ilustrativo.');
}

function DebtForm({ initial, onSubmit, onCancel, busy, error, disabled }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); onSubmit(toBody(f)); }}>
      <div className="form-grid cols-3">
        <Field label={tr('Nombre / entidad')}><Input required maxLength={200} value={f.name} onChange={set('name')} placeholder={tr('Ej. Crédito automotriz')} disabled={disabled} /></Field>
        <Field label={tr('Tipo de obligación')}><Select value={f.type} onChange={set('type')} options={options.debtTypes.map((o) => (o.value === 'OTRA' ? { ...o, label: tr('Otra: escribir mi tipo…') } : o))} disabled={disabled} /></Field>
        {f.type === 'OTRA' && <Field label={tr('Escribe el tipo de obligación')}><Input maxLength={80} value={f.customType} onChange={set('customType')} placeholder={tr('Ej. Préstamo de un familiar, crédito escolar')} disabled={disabled} /></Field>}
        <Field label={tr('Saldo pendiente')}><MoneyInput required value={f.balance} onChange={set('balance')} placeholder="0" disabled={disabled} /></Field>
        <Field label="Tasa anual (%)" hint={tr('Déjala vacía si no la conoces: se mostrará como tasa pendiente, no como 0%.')}>
          <input className="input" type="number" inputMode="decimal" min="0" max="1000" step="0.01" value={f.annualRate} onChange={set('annualRate')} placeholder={tr('Si se conoce')} disabled={disabled} />
        </Field>
        <Field label={tr('Pago mensual planeado')}><MoneyInput required value={f.payment} onChange={set('payment')} placeholder="0" disabled={disabled} /></Field>
        <Field label={tr(FEES_LABEL)} hint={tr(FEES_HINT)}><MoneyInput value={f.fees} onChange={set('fees')} placeholder="0" disabled={disabled} /></Field>
      </div>
      <FormError error={error} />
      <div className="form-actions">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>{tr('Cancelar')}</Button>}
        <Button type="submit" loading={busy} disabled={disabled}>{onCancel ? tr('Guardar cambios') : tr('Registrar obligación')}</Button>
      </div>
    </form>
  );
}

export function PaymentModal({ debt, endpoint = '/academy/obligations', onClose, onDone }) {
  const { api } = useWorkspace();
  const action = useAction();
  const [f, setF] = useState({ amount: String(debt.payment || ''), newBalance: '' });
  const preview = debtPayment({ balance: debt.balance, annualRate: debt.annualRate, fees: debt.fees, amount: f.amount });
  const submit = async () => {
    const body = { amount: Number(f.amount), newBalance: f.newBalance === '' ? null : Number(f.newBalance) };
    if (await action.run(() => api.post(`${endpoint}/${debt.balanceId}/payments`, body))) onDone();
  };
  return (
    <Modal
      open
      title={tr('Confirmar pago · {name}', { name: debt.name })}
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button><Button loading={action.busy} onClick={submit} disabled={!Number(f.amount)}>{tr('Confirmar pago real')}</Button></>}
    >
      <div className="stack">
        <p className="muted small">{tr('Se registrará un gasto real de la categoría Deudas en Ingresos y gastos. Del pago se descuentan primero los intereses y cargos estimados; el resto se abona a capital y reduce el saldo.')}</p>
        <Field label={tr('Importe pagado')}><MoneyInput required min="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <ExplainRows
          title={tr('Cómo se aplica este pago')}
          rows={[
            ['Saldo actual', money(preview.previousBalance)],
            [preview.rateKnown ? 'Interés estimado del mes' : 'Interés (tasa pendiente: no se descuenta)', money(preview.interest)],
            ['Comisiones y seguros', money(preview.fees)],
            ['Abono a capital', money(preview.principal)],
          ]}
          final={{ label: tr('Nuevo saldo estimado'), value: money(preview.newBalance), tone: 'up' }}
        />
        <Field label="Saldo según tu estado de cuenta (opcional)" hint={tr('Si tu banco indica otro saldo, escríbelo y se usará en lugar del estimado.')}>
          <MoneyInput value={f.newBalance} onChange={(e) => setF({ ...f, newBalance: e.target.value })} placeholder={money(preview.newBalance)} />
        </Field>
        <FormError error={action.error} />
      </div>
    </Modal>
  );
}

export function M9Obligations({ onSaved }) {
  const { api, canEdit, basePath } = useWorkspace();
  const res = useAsync(() => api.get('/academy/obligations'), [api]);
  const action = useAction();
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [paying, setPaying] = useState(null);
  const [formKey, setFormKey] = useState(0);

  if (res.loading && !res.data) return <ToolSkeleton />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const { items, totals, period, breakdown } = res.data;
  const closed = period?.status === 'CLOSED';
  const editable = canEdit && !closed;
  const pendingDebt = items.find(isDiagnosisDebt);

  const refresh = async () => {
    await res.reload();
    onSaved?.();
  };
  const create = async (body) => {
    if (await action.run(() => api.post('/academy/obligations', body))) {
      setFormKey((k) => k + 1);
      await refresh();
    }
  };
  const update = async (body) => {
    if (await action.run(() => api.put(`/academy/obligations/${editing.balanceId}`, body))) {
      setEditing(null);
      await refresh();
    }
  };
  const undo = async (d) => {
    if (await action.run(() => api.del(`/academy/obligations/${d.balanceId}/payments`))) await refresh();
  };
  const remove = async () => {
    if (await action.run(() => api.del(`/academy/obligations/${removing.balanceId}`))) {
      setRemoving(null);
      await refresh();
    }
  };

  return (
    <div className="tool">
      {totals && (
        <MetricGrid>
          <MetricCard label={tr('Saldo total de obligaciones')} value={money(totals.balance)} hint={tr('{n} obligaciones · pasivo en Patrimonio', { n: totals.count })} />
          {breakdown && <MetricCard label={tr('Saldo por desglosar')} value={money(breakdown.pendingBalance)} tone={breakdown.pendingBalance > 0 ? 'warn' : 'good'} hint={tr('De {declared} declarados en el Módulo 1 llevas {registered} · {pct}', { declared: money(breakdown.declaredBalance), registered: money(breakdown.registeredBalance), pct: pct(breakdown.balancePercent) })} />}
          <MetricCard label={tr('Pagos mensuales planeados')} value={money(totals.payments)} hint={tr('Al confirmar un pago, su abono a capital reduce el saldo')} />
          <MetricCard label={tr('Intereses mensuales estimados')} value={money(totals.interest)} tone={totals.incomplete ? 'warn' : ''} hint={totals.incomplete ? tr('Incompleto: hay tasas pendientes') : tr('Saldo × tasa anual / 12')} />
          <MetricCard label={tr('Pagos / ingreso mensual')} value={pct(totals.paymentToIncome)} hint={totals.paymentToIncome === null ? tr('N/D · sin ingreso registrado') : tr('Indicador descriptivo')} />
        </MetricGrid>
      )}

      {breakdown && (
        <div className="budget-total">
          <ProgressBar value={breakdown.balancePercent} label={tr('Deuda desglosada')} />
          <b>{pct(breakdown.balancePercent)} {tr('desglosado')}</b>
          {breakdown.pendingBalance > 0 && <span className="warn-text small">{tr('Faltan {amount} por desglosar de la deuda que declaraste en el Módulo 1', { amount: money(breakdown.pendingBalance) })}</span>}
        </div>
      )}
      {items.some(isDiagnosisDebt) && (
        <Notice>{tr('La deuda total que declaraste en el diagnóstico aparece como «Deudas por desglosar». Cada obligación que registras se descuenta de ese renglón, así el saldo total no se duplica.')}</Notice>
      )}

      {editable && (
        <ToolCard step="1" title={tr('Registrar obligación')} description={tr('Se guarda como deuda real: aparece en Patrimonio como pasivo, sin duplicarse.')} aside={<KindBadge kind="REAL" />}>
          <DebtForm key={formKey} initial={EMPTY} onSubmit={create} busy={action.busy && !editing} error={!editing && !removing ? action.error : null} />
        </ToolCard>
      )}

      <ToolCard step="2" title={tr('Obligaciones registradas')} description={tr('Los intereses, el costo y la aportación a capital son estimaciones educativas.')} aside={<KindBadge kind="ESTIMATE" />}>
        <DataTable
          rowKey="balanceId"
          rows={items}
          empty={tr('No hay obligaciones registradas. Agrega una para comenzar.')}
          columns={[
            { key: 'name', label: 'Obligación', render: (d) => <><b>{tr(d.name)}</b><span className="small block">{tr(debtTypeLabel(d))}</span></> },
            { key: 'balance', label: tr('Saldo'), align: 'right', render: (d) => money(d.balance) },
            { key: 'annualRate', label: tr('Tasa anual'), align: 'right', render: (d) => (d.rateKnown ? pct(d.annualRate) : <Pill variant="warn">{tr('Tasa pendiente')}</Pill>) },
            { key: 'payment', label: tr('Pago planeado'), align: 'right', render: (d) => <>{money(d.payment)}{d.payment > 0 && <span className="small block muted">{tr('Interés {interest} · capital {capital}', { interest: money(d.monthlyInterest ?? 0), capital: money(Math.max(0, d.principalContribution)) })}</span>}</> },
            { key: 'monthlyInterest', label: tr('Interés est.'), align: 'right', render: (d) => (d.monthlyInterest === null ? tr('Tasa pendiente') : money(d.monthlyInterest)) },
            { key: 'fees', label: tr('Comisiones y seguros'), align: 'right', render: (d) => money(d.fees) },
            { key: 'principalContribution', label: tr('Aporte est. a capital'), align: 'right', render: (d) => <span className={d.paymentBelowCost ? 'down' : ''}>{money(d.principalContribution)}</span> },
            ...(editable ? [{
              key: 'x', label: tr('Acciones'), align: 'right', render: (d) => (
                <div className="row-actions">
                  {d.paidAt
                    ? <><span className="small up">{tr('Pago confirmado')}</span><button type="button" className="btn-link" onClick={() => undo(d)}>{tr('Deshacer pago')}</button></>
                    : <button type="button" className="btn-link" onClick={() => setPaying(d)}>{tr('Confirmar pago')}</button>}
                  <button type="button" className="btn-link" onClick={() => setEditing(d)}>{tr('Editar')}</button>
                  <button type="button" className="btn-link danger" onClick={() => setRemoving(d)}>{tr('Eliminar')}</button>
                </div>
              ),
            }] : []),
          ]}
        />
        {items.some((d) => d.paymentBelowCost) && (
          <RiskNote>{tr('Bajo los supuestos introducidos, al menos un pago planeado podría no cubrir el costo mensual estimado (intereses + cargos). La deuda podría no disminuir.')}</RiskNote>
        )}
        {closed && <p className="small muted">{tr('El periodo actual está cerrado. Abre el siguiente periodo para registrar cambios.')}</p>}
      </ToolCard>

      {editing && (
        <ToolCard title={tr('Editar · {title}', { title: editing.name })}>
          <DebtForm initial={toForm(editing)} onSubmit={update} onCancel={() => setEditing(null)} busy={action.busy} error={action.error} />
        </ToolCard>
      )}

      {totals && (
        <div className="split-panel">
          <ToolCard title={tr('Resumen global de obligaciones')}>
            <ExplainRows
              title={tr('Costo del dinero')}
              rows={[
                ['Número de obligaciones', totals.count],
                ['Saldo total pendiente', money(totals.balance)],
                ...(breakdown ? [
                  ['Deuda declarada en el Módulo 1', money(breakdown.declaredBalance)],
                  ['Saldo ya desglosado', money(breakdown.registeredBalance)],
                  ['Saldo pendiente por desglosar', money(breakdown.pendingBalance), 'warn-text'],
                ] : pendingDebt ? [
                  ['Saldo ya desglosado', money(totals.balance - pendingDebt.balance)],
                  ['Saldo pendiente por desglosar (diagnóstico)', money(pendingDebt.balance), 'warn-text'],
                ] : []),
                ['Pago mensual planeado', money(totals.payments)],
                ...(breakdown ? [
                  ['Pago ya desglosado', money(breakdown.registeredPayment)],
                  ['Pago pendiente por desglosar', money(breakdown.pendingPayment), 'warn-text'],
                ] : pendingDebt ? [
                  ['Pago ya desglosado', money(totals.payments - pendingDebt.payment)],
                  ['Pago pendiente por desglosar (diagnóstico)', money(pendingDebt.payment), 'warn-text'],
                ] : []),
                ['Intereses estimados', money(totals.interest)],
                ['Comisiones y seguros', money(totals.fees)],
              ]}
              final={{ label: tr('Aportación estimada a capital'), value: money(totals.principalContribution), tone: totals.principalContribution < 0 ? 'down' : 'up' }}
            />
            <p className="small muted">{tr('Es una aproximación. Cada pago confirmado reduce el saldo por su abono estimado a capital; puedes corregirlo con el saldo de tu estado de cuenta.')}</p>
          </ToolCard>
          <ToolCard title={tr('Comparación con tus ingresos')}>
            <div className="source-line"><span>{tr('Ingreso mensual neto · Ingresos y gastos')}</span><b>{money(totals.income)}</b></div>
            <ProgressBar value={Math.min(100, totals.paymentToIncome || 0)} label={tr('Pagos sobre ingreso')} />
            <p className="small">{ratioText(totals.paymentToIncome)}</p>
            <p className="small muted">{tr('No es una calificación crediticia ni una recomendación. Para ajustar el ingreso registra tus movimientos en')}{' '}<Link to={`${basePath}/ingresos-gastos`}>{tr('Ingresos y gastos')}</Link>.</p>
          </ToolCard>
        </div>
      )}

      <RiskNote>{tr('La fórmula de interés es simplificada y no necesariamente coincide con tu estado de cuenta. Registrar una deuda no es registrar un gasto y planear un pago no reduce el saldo: solo los pagos confirmados se registran como gasto real y reducen el saldo por su abono a capital.')}</RiskNote>
      <SaveStatus action={action} />

      {paying && <PaymentModal debt={paying} onClose={() => setPaying(null)} onDone={async () => { setPaying(null); await refresh(); }} />}
      <ConfirmDialog
        open={!!removing}
        title={`Eliminar ${removing?.name || ''}`}
        message={tr('La obligación se quitará del periodo actual y de tu patrimonio. Los pagos ya registrados en Ingresos y gastos se conservan.')}
        danger
        confirmLabel={tr('Eliminar')}
        loading={action.busy}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      >
        <FormError error={removing ? action.error : null} />
      </ConfirmDialog>
    </div>
  );
}

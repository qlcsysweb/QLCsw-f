import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { monthName, periodLabel } from '../../utils/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Field, FormError, FormGrid, MoneyInput, Select } from '../../components/ui/Form.jsx';
import { Empty, ErrorState, Loading } from '../../components/ui/States.jsx';
import { tr } from '../../i18n/tr.js';

const YEARS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 3 + i);

function nextPeriod(periods) {
  const last = periods[0];
  if (!last) {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return last.month === 12 ? { year: last.year + 1, month: 1 } : { year: last.year, month: last.month + 1 };
}

export function NewPeriodModal({ open, onClose }) {
  const { api, periods, reloadPeriods } = useWorkspace();
  const first = periods.length === 0;
  const [form, setForm] = useState(() => ({ ...nextPeriod(periods), openingNetWorth: '' }));
  const [state, setState] = useState({ saving: false, error: null });

  const submit = async (e) => {
    e.preventDefault();
    setState({ saving: true, error: null });
    try {
      const body = { year: form.year, month: form.month };
      if (first && form.openingNetWorth !== '') body.openingNetWorth = form.openingNetWorth;
      const p = await api.post('/periods', body);
      await reloadPeriods(p.id);
      onClose();
    } catch (error) {
      setState({ saving: false, error });
    }
  };

  return (
    <Modal open={open} title={first ? tr('Crear tu primer periodo') : tr('Nuevo periodo mensual')} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <p className="muted small">
          {first
            ? tr('Cada registro patrimonial pertenece a un periodo mensual. Registra tu patrimonio inicial o déjalo vacío para calcularlo desde el capital inicial de tus productos.')
            : tr('El nuevo periodo toma como referencia el patrimonio final del periodo anterior y arrastra tus productos, protección y deudas activas.')}
        </p>
        <FormGrid>
          <Field label={tr('Mes')}>
            <Select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) }))} />
          </Field>
          <Field label={tr('Año')}>
            <Select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              options={YEARS.map((y) => ({ value: y, label: String(y) }))} />
          </Field>
          {first && (
            <Field label={tr('Patrimonio inicial (opcional)')} full hint={tr('Valor total de tus inversiones al inicio del periodo.')}>
              <MoneyInput value={form.openingNetWorth} onChange={(e) => setForm({ ...form, openingNetWorth: e.target.value })} />
            </Field>
          )}
        </FormGrid>
        <FormError error={state.error} />
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button>
          <Button type="submit" loading={state.saving}>{tr('Crear periodo')}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function PeriodSelector() {
  const { periods, period, selectPeriod, canEdit } = useWorkspace();
  const [open, setOpen] = useState(false);
  return (
    <div className="period-selector">
      {periods.length > 0 && (
        <select className="month" value={period?.id || ''} onChange={(e) => selectPeriod(e.target.value)} aria-label={tr('Periodo')}>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              Periodo · {periodLabel(p)} {p.status === 'CLOSED' ? tr('· cerrado') : ''}
            </option>
          ))}
        </select>
      )}
      {canEdit && <Button variant="secondary" onClick={() => setOpen(true)}>{tr('+ Periodo')}</Button>}
      {open && <NewPeriodModal open onClose={() => setOpen(false)} />}
    </div>
  );
}

export function RequirePeriod({ children }) {
  const { period, periodsState, reloadPeriods, canEdit } = useWorkspace();
  const [open, setOpen] = useState(false);
  if (periodsState.loading) return <Loading />;
  if (periodsState.error) return <ErrorState error={periodsState.error} onRetry={() => reloadPeriods()} />;
  if (!period) {
    return (
      <>
        <Empty
          title={tr('Comienza tu primer periodo')}
          text={tr('Para registrar y calcular tu información financiera necesitas un periodo mensual. El sistema conservará el historial de cada mes.')}
          action={canEdit && <Button onClick={() => setOpen(true)}>{tr('Crear primer periodo')}</Button>}
        />
        {open && <NewPeriodModal open onClose={() => setOpen(false)} />}
      </>
    );
  }
  return children;
}

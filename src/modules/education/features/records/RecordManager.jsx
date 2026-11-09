import { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog, Modal } from '../../components/ui/Modal.jsx';
import { Field, FormError, FormGrid, Input, MoneyInput, Select, Textarea } from '../../components/ui/Form.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { ErrorState, Loading } from '../../components/ui/States.jsx';
import { tr } from '../../i18n/tr.js';

const emptyValues = (fields) => Object.fromEntries(fields.map((f) => [f.name, f.default ?? '']));

function FieldInput({ field, value, onChange }) {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value), required: field.required !== false, name: field.name };
  if (field.type === 'select') return <Select {...common} options={field.options} placeholder={tr('Selecciona…')} />;
  if (field.type === 'money') return <MoneyInput {...common} />;
  if (field.type === 'textarea') return <Textarea {...common} required={false} />;
  if (field.type === 'file') return <input className="input" type="file" accept={field.accept} name={field.name} onChange={(e) => onChange(e.target.files?.[0] || null)} />;
  return <Input type={field.type || 'text'} maxLength={field.maxLength || 200} step={field.step} min={field.min} max={field.max} {...common} />;
}

const describeChanges = (fields, before, after) =>
  fields
    .filter((f) => String(before[f.name] ?? '') !== String(after[f.name] ?? ''))
    .map((f) => ({ field: f.label, from: f.display?.(before[f.name]) ?? String(before[f.name] ?? '—'), to: f.display?.(after[f.name]) ?? String(after[f.name] ?? '—') }));

export function RecordForm({ fields, initial, onSubmit, onCancel, submitLabel = 'Guardar' }) {
  const [values, setValues] = useState(initial);
  const [state, setState] = useState({ saving: false, error: null });

  const submit = async (e) => {
    e.preventDefault();
    setState({ saving: true, error: null });
    try {
      const visible = Object.fromEntries(Object.entries(values).map(([k, v]) => {
        const field = fields.find((f) => f.name === k);
        if (field?.when && !field.when(values)) return [k, ''];
        if (field?.compute && field.compute(values) !== null) return [k, field.compute(values)];
        return [k, v];
      }));
      await onSubmit(visible);
    } catch (error) {
      setState({ saving: false, error });
      return;
    }
    setState({ saving: false, error: null });
  };

  return (
    <form onSubmit={submit} className="stack">
      <FormGrid>
        {fields.filter((f) => !f.when || f.when(values)).map((f) => (
          <Field key={f.name} label={typeof f.label === 'function' ? f.label(values) : f.label} hint={typeof f.hint === 'function' ? f.hint(values) : f.hint} full={f.full || f.type === 'textarea'}>
            {f.compute && f.compute(values) !== null
              ? <Input value={f.display ? f.display(f.compute(values)) : f.compute(values)} readOnly />
              : <FieldInput field={f} value={values[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />}
          </Field>
        ))}
      </FormGrid>
      <FormError error={state.error} />
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>{tr('Cancelar')}</Button>
        <Button type="submit" loading={state.saving}>{tr(submitLabel)}</Button>
      </div>
    </form>
  );
}

export function RecordManager({ endpoint, title, addLabel = "+ Agregar", fields, columns, toForm = (r) => r, onChanged, emptyText, select = (d) => d, rowId = (r) => r.id, rowActions, afterSave, openNew }) {
  const { api, period, canEdit } = useWorkspace();
  const list = useAsync(async () => select(await api.get(`${endpoint}?periodId=${period.id}`)), [api, endpoint, period?.id]);
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState(null);
  const writable = canEdit && period.status === 'OPEN';
  useEffect(() => {
    if (openNew && writable) setEditing({ row: null });
  }, [openNew, writable]);

  const refresh = async () => {
    await list.reload();
    onChanged?.();
  };

  const save = async (values) => {

    const fileFields = fields.filter((f) => f.type === 'file').map((f) => f.name);
    const clean = Object.fromEntries(Object.entries(values).filter(([k]) => !fileFields.includes(k)).map(([k, v]) => [k, v === '' ? null : v]));
    const body = { ...clean, periodId: period.id };
    if (!editing.row) {
      const created = await api.post(endpoint, body);
      if (afterSave) await afterSave(created, values);
      setEditing(null);
      return refresh();
    }
    const changes = describeChanges(fields.filter((f) => f.type !== 'file'), toForm(editing.row), values);
    if (!changes.length) {
      if (afterSave && fileFields.some((k) => values[k])) {
        await afterSave(editing.row, values);
        setEditing(null);
        return refresh();
      }
      return setEditing(null);
    }
    setPending({ kind: 'update', row: editing.row, body, changes, values });
  };

  const confirm = async () => {
    setConfirming(true);
    setActionError(null);
    try {
      if (pending.kind === 'update') {
        const updated = await api.put(`${endpoint}/${rowId(pending.row)}`, pending.body);
        if (afterSave) await afterSave(updated, pending.values);
      }
      else await api.del(`${endpoint}/${rowId(pending.row)}`);
      setPending(null);
      setEditing(null);
      await refresh();
    } catch (error) {
      setActionError(error);
    } finally {
      setConfirming(false);
    }
  };

  const actionCol = writable
    ? [{
        key: '_actions',
        label: tr('Acciones'),
        align: 'right',
        render: (r) => (
          <div className="row-actions">
            {rowActions?.(r, refresh)}
            <button className="btn-link" onClick={() => setEditing({ row: r })}>{tr('Editar')}</button>
            <button className="btn-link danger" onClick={() => setPending({ kind: 'delete', row: r })}>{tr('Eliminar')}</button>
          </div>
        ),
      }]
    : [];

  return (
    <section className="card">
      <header className="card-head">
        <h3 className="section-title">{tr(title)}</h3>
        {writable && <Button onClick={() => setEditing({ row: null })}>{tr(addLabel)}</Button>}
      </header>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : (
        <DataTable columns={[...columns, ...actionCol]} rows={list.data || []} empty={emptyText} />
      )}
      {actionError && <FormError error={actionError} />}

      {editing && !pending && (
        <Modal open title={editing.row ? tr('Editar · {title}', { title: title }) : tr('Agregar · {title}', { title: title })} onClose={() => setEditing(null)}>
          <RecordForm fields={fields} initial={editing.row ? toForm(editing.row) : emptyValues(fields)} onSubmit={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      <ConfirmDialog
        open={!!pending}
        title={pending?.kind === 'delete' ? tr('Eliminar registro') : tr('Confirmar modificación')}
        message={pending?.kind === 'delete'
          ? tr('Esta acción elimina el registro y recalcula todos los indicadores del periodo.')
          : tr('Revisa los cambios. Al guardar se recalcularán los indicadores del periodo.')}
        details={pending?.changes}
        danger={pending?.kind === 'delete'}
        confirmLabel={pending?.kind === 'delete' ? tr('Eliminar') : tr('Guardar cambios')}
        loading={confirming}
        onConfirm={confirm}
        onClose={() => { setPending(null); setActionError(null); }}
      />
    </section>
  );
}

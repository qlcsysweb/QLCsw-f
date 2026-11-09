import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { money } from '../../../utils/format.js';
import { HORIZONS, LIQUIDITY_LEVELS, options, PERCEIVED_RISK, PRODUCT_TYPES } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../../components/ui/Modal.jsx';
import { Field, FormError, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { Pill } from '../../../components/ui/Card.jsx';
import { ErrorState, Loading } from '../../../components/ui/States.jsx';
import { MetricCard, MetricGrid, RealBadge, ToolCard } from '../ResultParts.jsx';
import { tr } from '../../../i18n/tr.js';

const EMPTY = { name: '', productType: 'RENTA_FIJA', capital: '', horizon: 'MEDIANO', liquidityLevel: 'MEDIA', perceivedRisk: 'MEDIO' };
const RISK_TONE = { BAJO: '', MEDIO: 'warn', ALTO: 'bad', MUY_ALTO: 'purple' };

function ProductForm({ initial, onSubmit, onCancel, busy, error }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
      <div className="form-grid cols-3">
        <Field label={tr('Nombre del producto')}><Input required maxLength={120} placeholder={tr('Ej. BONOS DEL TESORO, BTC, CASA, NEGOCIO')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value.toUpperCase() })} /></Field>
        <Field label={tr('Tipo')}><Select value={f.productType} onChange={set('productType')} options={options.productTypes.filter((o) => !['LIQUIDEZ', 'FONDOS', 'ACCIONES'].includes(o.value) || f.productType === o.value)} /></Field>
        <Field label={tr('Capital actual')}><MoneyInput required min="0.01" value={f.capital} onChange={set('capital')} placeholder="0" /></Field>
        <Field label={tr('Horizonte')}><Select value={f.horizon} onChange={set('horizon')} options={options.horizons} /></Field>
        <Field label={tr('Liquidez')}><Select value={f.liquidityLevel} onChange={set('liquidityLevel')} options={options.liquidity} /></Field>
        <Field label={tr('Riesgo percibido')}><Select value={f.perceivedRisk} onChange={set('perceivedRisk')} options={options.risk} /></Field>
      </div>
      <FormError error={error} />
      <div className="form-actions">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>{tr('Cancelar')}</Button>}
        <Button type="submit" loading={busy}>{onCancel ? tr('Guardar cambios') : tr('Agregar a mi mapa')}</Button>
      </div>
    </form>
  );
}

export function M2ProductMap({ onSaved }) {
  const { api, canEdit, basePath } = useWorkspace();
  const res = useAsync(() => api.get('/academy/products'), [api]);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [state, setState] = useState({ busy: false, error: null });

  if (res.loading && !res.data) return <Loading />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const { products, pending } = res.data;
  const total = products.reduce((a, p) => a + p.capital, 0);
  const pendingInvestments = (pending?.M1_INVESTMENTS || 0) + (pending?.M1_OTHER_ASSETS || 0);

  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      await fn();
      await res.reload();
      onSaved?.();
      setState({ busy: false, error: null });
      return true;
    } catch (error) {
      setState({ busy: false, error });
      return false;
    }
  };

  const add = async (f) => {
    if (await run(() => api.post('/academy/products', f))) setFormKey((k) => k + 1);
  };
  const update = async (f) => {
    if (await run(() => api.put(`/academy/products/${editing.assetId}`, f))) setEditing(null);
  };
  const remove = async () => {
    if (await run(() => api.del(`/academy/products/${removing.assetId}`))) setRemoving(null);
  };

  return (
    <div className="tool">
      {canEdit && (
        <ToolCard step="1" title={tr('Agregar producto o activo')} description={tr('Registra cada producto individualmente. Alimentará Mi portafolio de inversión, Allocation y Patrimonio.')} aside={<RealBadge />}>
          <ProductForm key={formKey} initial={EMPTY} onSubmit={add} busy={state.busy && !editing} error={!editing ? state.error : null} />
        </ToolCard>
      )}
      <MetricGrid>
        <MetricCard label={tr('Productos registrados')} value={products.length} />
        <MetricCard label={tr('Capital identificado')} value={money(total)} />
        <MetricCard
          label={tr('Inversiones por desglosar')}
          value={money(pendingInvestments)}
          tone={pendingInvestments > 0 ? 'warn' : 'good'}
          hint={pending ? tr('Inversiones {a} · Bienes y otros activos {b}', { a: money(pending.M1_INVESTMENTS || 0), b: money(pending.M1_OTHER_ASSETS || 0) }) : tr('Completa el Módulo 1 para comparar')}
          explanation="El Módulo 1 registró tus inversiones, bienes raíces y otros activos como cifras globales. Aquí las descompones en productos sin duplicarlas."
        />
      </MetricGrid>
      <ToolCard step="2" title={tr('Mapa de productos registrados')} description={tr('Producto individual → categoría → Mi portafolio de inversión → Allocation → Patrimonio.')}>
        <DataTable
          rowKey="assetId"
          rows={products}
          empty={tr('Aún no registras productos. Agrega el primero para construir tu mapa.')}
          columns={[
            { key: 'name', label: tr('Producto'), render: (p) => <b>{tr(p.name)}</b> },
            { key: 'productType', label: tr('Tipo'), render: (p) => PRODUCT_TYPES[p.productType] },
            { key: 'capital', label: tr('Capital'), align: 'right', render: (p) => money(p.capital) },
            { key: 'horizon', label: tr('Horizonte'), render: (p) => HORIZONS[p.horizon] },
            { key: 'liquidityLevel', label: tr('Liquidez'), render: (p) => LIQUIDITY_LEVELS[p.liquidityLevel] },
            { key: 'perceivedRisk', label: 'Riesgo', render: (p) => <Pill variant={RISK_TONE[p.perceivedRisk]}>{tr(PERCEIVED_RISK[p.perceivedRisk])}</Pill> },
            ...(canEdit ? [{ key: 'x', label: tr('Acciones'), align: 'right', render: (p) => (
              <div className="row-actions">
                <button type="button" className="btn-link" onClick={() => setEditing(p)}>{tr('Editar')}</button>
                <button type="button" className="btn-link danger" onClick={() => setRemoving(p)}>{tr('Eliminar')}</button>
              </div>
            ) }] : []),
          ]}
        />
        <p className="small muted">{tr('Estos productos ya aparecen en')}{' '}<Link to={`${basePath}/cartera`}>{tr('Mi portafolio de inversión')}</Link>{' '}{tr('y en')}{' '}<Link to={`${basePath}/allocation`}>{tr('Allocation')}</Link>.</p>
      </ToolCard>
      {editing && (
        <ToolCard title={tr('Editar · {title}', { title: editing.name })}>
          <ProductForm
            initial={{ name: editing.name, productType: editing.productType, capital: editing.capital, horizon: editing.horizon, liquidityLevel: editing.liquidityLevel, perceivedRisk: editing.perceivedRisk }}
            onSubmit={update}
            onCancel={() => setEditing(null)}
            busy={state.busy}
            error={state.error}
          />
        </ToolCard>
      )}
      <ConfirmDialog
        open={!!removing}
        title={`Eliminar ${removing?.name || ''}`}
        message={tr('El producto se quitará de tu mapa, de Mi portafolio de inversión y de Allocation del periodo actual.')}
        danger
        confirmLabel={tr('Eliminar')}
        loading={state.busy}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      >
        <FormError error={removing ? state.error : null} />
      </ConfirmDialog>
    </div>
  );
}

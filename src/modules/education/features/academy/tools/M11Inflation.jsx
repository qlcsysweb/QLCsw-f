import { useMemo, useState } from 'react';
import { inflationScenario } from '@shared/patrimonial.js';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { money, pct } from '../../../utils/format.js';
import { options, SCENARIO_TYPES } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { Field, FormError, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { ConfirmDialog } from '../../../components/ui/Modal.jsx';
import { ErrorState } from '../../../components/ui/States.jsx';
import { ExplainRows, KindBadge, MetricCard, MetricGrid, RiskNote, ToolCard, ToolSkeleton } from '../ResultParts.jsx';
import { useAction } from '../useAction.js';
import { tr } from '../../../i18n/tr.js';

const EMPTY = { name: '', type: 'AHORRO', capital: '', years: '10', inflationRate: '4', nominalRate: '0', source: '' };
const toBody = (f) => ({
  name: f.name,
  type: f.type,
  capital: Number(f.capital || 0),
  years: Number(f.years || 0),
  inflationRate: Number(f.inflationRate || 0),
  nominalRate: Number(f.nominalRate || 0),
  sourceAssetId: f.source.startsWith('A:') ? f.source.slice(2) : null,
  sourceGoalId: f.source.startsWith('G:') ? f.source.slice(2) : null,
});
const toForm = (s) => ({
  name: s.name, type: s.type, capital: String(s.capital), years: String(s.years), inflationRate: String(s.inflationRate), nominalRate: String(s.nominalRate),
  source: s.sourceAssetId ? `A:${s.sourceAssetId}` : s.sourceGoalId ? `G:${s.sourceGoalId}` : '',
});
const rateInput = { type: 'number', inputMode: 'decimal', step: '0.01', min: '-99.99', max: '1000' };

const INDICATORS = [
  ['Capital actual', 'Valor del capital inicial utilizado para realizar la simulación.'],
  ['Valor futuro nominal', 'Valor estimado del capital al finalizar el periodo, suponiendo que los rendimientos se reinvierten y se mantiene la tasa anual indicada, antes de descontar la inflación.'],
  ['Valor futuro en pesos de hoy', 'Valor futuro del capital expresado en poder adquisitivo actual, descontando la inflación supuesta durante el periodo.'],
  ['Costo futuro de una compra de hoy', 'Costo estimado que tendrá en el futuro un bien o servicio que hoy tiene ese precio, suponiendo que los precios aumentan según la inflación indicada.'],
  ['Valor real del capital sin rendimiento', 'Poder adquisitivo que conservaría el capital inicial al finalizar el periodo si no generara rendimientos, considerando la inflación supuesta.'],
  ['Pérdida estimada de poder adquisitivo', 'Disminución estimada del poder de compra del capital inicial debido a la inflación, suponiendo que no genera rendimientos.'],
  ['Rendimiento real anual supuesto', 'Tasa anual estimada de crecimiento del capital después de descontar el efecto de la inflación.'],
];

function ScenarioForm({ initial, sources, onSubmit, onCancel, busy, error }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const preview = useMemo(() => inflationScenario(toBody(f)), [f]);
  const sourceOptions = [
    ...sources.assets.map((a) => ({ value: `A:${a.id}`, label: tr('Inversión · {name} ({amount})', { name: a.name, amount: money(a.capital) }) })),
    ...sources.goals.map((g) => ({ value: `G:${g.id}`, label: tr('Meta · {name} ({amount})', { name: g.name, amount: money(g.targetAmount) }) })),
  ];
  const pickSource = (e) => {
    const value = e.target.value;
    const asset = sources.assets.find((a) => `A:${a.id}` === value);
    const goal = sources.goals.find((g) => `G:${g.id}` === value);
    setF({
      ...f,
      source: value,
      name: f.name || asset?.name || goal?.name || '',
      type: asset ? 'INVERSION' : goal ? 'META' : f.type,
      capital: asset ? String(asset.capital) : goal ? String(goal.targetAmount) : f.capital,
    });
  };
  return (
    <div className="split-panel">
      <form className="stack" onSubmit={(e) => { e.preventDefault(); onSubmit(toBody(f)); }}>
        <div className="form-grid cols-2">
          <Field label="Cargar desde mis datos (opcional)" hint={tr('Solo lectura: el escenario nunca modifica tu inversión o meta.')}>
            <Select value={f.source} onChange={pickSource} options={sourceOptions} placeholder={tr('Capturar manualmente')} />
          </Field>
          <Field label={tr('Nombre del escenario')}><Input required maxLength={120} value={f.name} onChange={set('name')} placeholder={tr('Ej. Ahorro para vivienda')} /></Field>
          <Field label={tr('Tipo')}><Select value={f.type} onChange={set('type')} options={options.scenarioTypes} /></Field>
          <Field label={tr('Capital actual')}><MoneyInput value={f.capital} onChange={set('capital')} placeholder="0" /></Field>
          <Field label="Horizonte (años)"><input className="input" type="number" inputMode="numeric" min="0" max="100" step="1" value={f.years} onChange={set('years')} /></Field>
          <Field label="Inflación anual supuesta (%)"><input className="input" {...rateInput} value={f.inflationRate} onChange={set('inflationRate')} /></Field>
          <Field label="Rendimiento anual nominal supuesto (%)"><input className="input" {...rateInput} value={f.nominalRate} onChange={set('nominalRate')} /></Field>
        </div>
        <FormError error={error} />
        <div className="form-actions">
          {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>{tr('Cancelar')}</Button>}
          <Button type="submit" loading={busy}>{onCancel ? tr('Guardar cambios') : tr('Guardar escenario')}</Button>
        </div>
      </form>
      <ExplainRows
        title={tr('Resultado del escenario')}
        rows={[
          ['Capital actual', money(preview.capital)],
          ['Valor futuro nominal', money(preview.nominalFuture)],
          ['Valor futuro en pesos de hoy', money(preview.realFuture)],
          ['Costo futuro de una compra de hoy', money(preview.futureCost)],
          ['Valor real del capital sin rendimiento', money(preview.realCapital)],
          ['Pérdida estimada de poder adquisitivo', money(preview.purchasingPowerLoss)],
        ]}
        final={{ label: tr('Rendimiento real anual supuesto'), value: pct(preview.realRate), tone: preview.realRate < 0 ? 'down' : 'up' }}
      />
    </div>
  );
}

export function M11Inflation({ onSaved }) {
  const { api, canEdit } = useWorkspace();
  const res = useAsync(() => api.get('/academy/scenarios'), [api]);
  const action = useAction();
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [formKey, setFormKey] = useState(0);

  if (res.loading && !res.data) return <ToolSkeleton />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const { items, totals, sources } = res.data;
  const refresh = async () => {
    await res.reload();
    onSaved?.();
  };
  const create = async (body) => {
    if (await action.run(() => api.post('/academy/scenarios', body))) {
      setFormKey((k) => k + 1);
      await refresh();
    }
  };
  const update = async (body) => {
    if (await action.run(() => api.put(`/academy/scenarios/${editing.id}`, body))) {
      setEditing(null);
      await refresh();
    }
  };
  const remove = async () => {
    if (await action.run(() => api.del(`/academy/scenarios/${removing.id}`))) {
      setRemoving(null);
      await refresh();
    }
  };

  return (
    <div className="tool">
      <div className="badge-row"><KindBadge kind="SIMULATION" /></div>
      <MetricGrid>
        <MetricCard label={tr('Escenarios guardados')} value={totals.count} />
        <MetricCard label={tr('Capital inicial total')} value={money(totals.capital)} hint={tr('Suma de los escenarios')} />
        <MetricCard label={tr('Valor futuro nominal')} value={money(totals.nominalFuture)} hint={tr('Proyección con supuestos')} />
        <MetricCard label={tr('Valor futuro en pesos de hoy')} value={money(totals.realFuture)} hint={tr('Estimación del poder adquisitivo')} />
      </MetricGrid>

      {canEdit && (
        <ToolCard step="1" title={tr('Agregar escenario')} description={tr('Inflación y rendimiento son supuestos educativos constantes durante el horizonte.')}>
          <ScenarioForm key={formKey} initial={EMPTY} sources={sources} onSubmit={create} busy={action.busy && !editing} error={!editing && !removing ? action.error : null} />
        </ToolCard>
      )}

      <ToolCard step="2" title={tr('Mis escenarios')} description={tr('Simulaciones guardadas en tu perfil. No se integran a Patrimonio, Mi portafolio de inversión ni Cortes.')}
        aside={items.length > 0 && <Button variant="secondary" onClick={() => api.download('/academy/scenarios/pdf', 'QLC_Simulacion_Inflacion.pdf').catch(() => null)}>{tr('Descargar PDF')}</Button>}>
        <DataTable
          rows={items}
          empty={tr('Aún no guardas escenarios. Crea el primero para comparar el valor nominal con el valor real.')}
          columns={[
            { key: 'name', label: 'Escenario', render: (s) => <><b>{tr(s.name)}</b><span className="small block">{tr(SCENARIO_TYPES[s.type])}</span></> },
            { key: 'capital', label: tr('Capital'), align: 'right', render: (s) => money(s.capital) },
            { key: 'years', label: tr('Años'), align: 'right' },
            { key: 'inflationRate', label: 'Inflación', align: 'right', render: (s) => pct(s.inflationRate) },
            { key: 'nominalRate', label: 'Rendimiento', align: 'right', render: (s) => pct(s.nominalRate) },
            { key: 'nominal', label: tr('Valor nominal'), align: 'right', render: (s) => money(s.result.nominalFuture) },
            { key: 'real', label: tr('Valor real'), align: 'right', render: (s) => money(s.result.realFuture) },
            ...(canEdit ? [{
              key: 'x', label: tr('Acciones'), align: 'right', render: (s) => (
                <div className="row-actions">
                  <button type="button" className="btn-link" onClick={() => setEditing(s)}>{tr('Editar')}</button>
                  <button type="button" className="btn-link danger" onClick={() => setRemoving(s)}>{tr('Eliminar')}</button>
                </div>
              ),
            }] : []),
          ]}
        />
      </ToolCard>

      {editing && (
        <ToolCard title={tr('Editar · {title}', { title: editing.name })}>
          <ScenarioForm initial={toForm(editing)} sources={sources} onSubmit={update} onCancel={() => setEditing(null)} busy={action.busy} error={action.error} />
        </ToolCard>
      )}

      <ToolCard title={tr('Fórmulas utilizadas')}>
        <ExplainRows
          title={tr('Supuestos constantes')}
          rows={[
            ['Valor futuro nominal', 'Capital × (1 + rendimiento)^años'],
            ['Valor futuro real', 'Valor nominal ÷ (1 + inflación)^años'],
            ['Costo futuro equivalente', 'Capital × (1 + inflación)^años'],
            ['Rendimiento real', '(1 + rendimiento) ÷ (1 + inflación) − 1'],
          ]}
        />
      </ToolCard>
      <ToolCard title={tr('¿Qué significa cada indicador?')} description={tr('Descripciones de los indicadores del simulador QLC.')}>
        <dl className="indicator-glossary">
          {INDICATORS.map(([term, text]) => (
            <div key={term}>
              <dt>{tr(term)}</dt>
              <dd>{tr(text)}</dd>
            </div>
          ))}
        </dl>
      </ToolCard>

      <RiskNote>{tr('La inflación y el rendimiento son supuestos, no pronósticos. Los valores futuros son proyecciones y estimaciones de un escenario: no incluyen aportaciones adicionales, comisiones ni impuestos.')}</RiskNote>

      <ConfirmDialog
        open={!!removing}
        title={`Eliminar ${removing?.name || ''}`}
        message={tr('Se eliminará solo este escenario de simulación.')}
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

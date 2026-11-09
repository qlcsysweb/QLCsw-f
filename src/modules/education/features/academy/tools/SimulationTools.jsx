import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { dateTime, pct, signedUsd, usd } from '../../../utils/format.js';
import { options } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Field, FormError, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { ExplainRows, MetricCard, MetricGrid, RiskNote, SimBadge, ToolCard } from '../ResultParts.jsx';
import { useSimulation } from '../useSimulation.js';
import { MultiPositionLab } from './MultiPositionLab.jsx';
import { tr } from '../../../i18n/tr.js';

const toneOf = (v) => (v === null || v === undefined || v === 0 ? '' : v > 0 ? 'up' : 'down');
const signedPct = (v) => (v === null || v === undefined ? 'N/D' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%`);

function SimForm({ sim, children, saveLabel = 'Guardar simulación' }) {
  const { canEdit } = useWorkspace();
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); sim.run(false); }}>
      {children}
      <FormError error={sim.error} />
      <div className="form-actions">
        {canEdit && <Button type="button" variant="secondary" loading={sim.busy} onClick={() => sim.run(true)}>{tr(saveLabel)}</Button>}
        <Button type="submit" loading={sim.busy}>{tr('Simular')}</Button>
      </div>
      {sim.savedAt && <p className="small up">{tr('Simulación guardada en tu historial educativo. No se modificó tu patrimonio.')}</p>}
    </form>
  );
}

function History({ sim, columns }) {
  if (!sim.history.length) return null;
  return (
    <ToolCard title={tr('Historial de simulaciones guardadas')} description={tr('Pertenece a tu progreso educativo, no a tu situación financiera real.')}>
      <DataTable rows={sim.history.slice(0, 8)} columns={[{ key: 'createdAt', label: tr('Fecha'), render: (s) => dateTime(s.createdAt) }, ...columns]} />
    </ToolCard>
  );
}

const M4_DEFAULT = { capital: 1000, direction: 'LONG', leverage: 10, movePct: 2, favorable: true };

export function M4RiskSimulator() {
  const sim = useSimulation(4, M4_DEFAULT);
  const r = sim.result;
  return (
    <div className="tool">
      <div className="tool-grid">
        <ToolCard step="1" title={tr('Construye el escenario')} description={tr('Capital/margen, dirección, apalancamiento y movimiento del mercado.')} aside={<SimBadge />}>
          <SimForm sim={sim}>
            <div className="form-grid cols-2">
              <Field label="Capital utilizado como margen (USD)"><MoneyInput value={sim.input.capital} onChange={sim.set('capital')} /></Field>
              <Field label={tr('Dirección')}><Select value={sim.input.direction} onChange={sim.set('direction')} options={[{ value: 'LONG', label: 'LONG' }, { value: 'SHORT', label: 'SHORT' }]} /></Field>
              <Field label={tr('Apalancamiento')}><Select value={sim.input.leverage} onChange={sim.set('leverage', Number)} options={options.leverage} /></Field>
              <Field label="Movimiento del precio (%)"><Input type="number" step="0.1" min="0" max="100" value={sim.input.movePct} onChange={sim.set('movePct')} /></Field>
              <Field label={tr('Resultado del movimiento')} full>
                <Select value={sim.input.favorable ? 'yes' : 'no'} onChange={(e) => sim.setInput({ ...sim.input, favorable: e.target.value === 'yes' })} options={[{ value: 'yes', label: tr('A favor de la operación') }, { value: 'no', label: tr('En contra de la operación') }]} />
              </Field>
            </div>
          </SimForm>
        </ToolCard>
        {r && (
          <ToolCard step="2" title={tr('Lectura educativa')} description={tr('El apalancamiento no crea rentabilidad: amplifica el efecto del movimiento sobre el margen.')}>
            <MetricGrid cols={2}>
              <MetricCard label={tr('Resultado sobre el margen')} value={signedUsd(r.result)} tone={r.result >= 0 ? 'good' : 'bad'} hint={signedPct(r.resultOnMargin)} />
              <MetricCard label={tr('Exposición nominal')} value={usd(r.exposure)} hint={`${usd(r.capital)} × ${r.leverage}x`} />
            </MetricGrid>
            <ExplainRows rows={[
              ['Tú aportas (capital / margen)', usd(r.capital)],
              ['El apalancamiento crea (exposición)', usd(r.exposure)],
              ['El mercado se mueve', signedPct(r.movePct), toneOf(r.movePct)],
              ['Efecto sobre tu exposición', signedUsd(r.result), toneOf(r.result)],
            ]} final={{ label: tr('Sobre tus {amount}', { amount: usd(r.capital) }), value: signedPct(r.resultOnMargin), tone: toneOf(r.resultOnMargin) }} />
          </ToolCard>
        )}
      </div>
      {r && (
        <ToolCard title={tr('Mismo movimiento, distinta exposición')} description={tr('El movimiento del mercado no cambió. Lo que cambió fue la exposición.')}>
          <DataTable rowKey="leverage" rows={r.comparison} columns={[
            { key: 'leverage', label: tr('Apalancamiento'), render: (c) => `${c.leverage}x` },
            { key: 'exposure', label: 'Exposición', align: 'right', render: (c) => usd(c.exposure) },
            { key: 'result', label: 'Resultado', align: 'right', render: (c) => <span className={toneOf(c.result)}>{signedUsd(c.result)}</span> },
          ]} />
        </ToolCard>
      )}
      <RiskNote>{tr('El apalancamiento aumenta tanto la sensibilidad a movimientos favorables como a movimientos adversos. Una operación apalancada puede generar pérdidas significativas sobre el margen utilizado.')}</RiskNote>
      <History sim={sim} columns={[
        { key: 'lev', label: tr('Apalancamiento'), render: (s) => `${s.input.leverage}x` },
        { key: 'mov', label: 'Movimiento', render: (s) => signedPct(s.result.movePct) },
        { key: 'res', label: 'Resultado', align: 'right', render: (s) => <span className={toneOf(s.result.result)}>{signedUsd(s.result.result)}</span> },
      ]} />
    </div>
  );
}

const M5_DEFAULT = { capital: 1000, direction: 'LONG', leverage: 10, entryPrice: 100000, exitPrice: 102000, costPct: 0.1 };

export function M5TradeSimulator() {
  const sim = useSimulation(5, M5_DEFAULT);
  const r = sim.result;
  return (
    <div className="tool">
      <div className="tool-grid">
        <ToolCard step="1" title={tr('Construye tu operación')} description={tr('Entrada, salida, dirección, apalancamiento y costos simulados.')} aside={<SimBadge />}>
          <SimForm sim={sim}>
            <div className="form-grid cols-2">
              <Field label="Capital utilizado como margen (USD)"><MoneyInput value={sim.input.capital} onChange={sim.set('capital')} /></Field>
              <Field label={tr('Dirección')}><Select value={sim.input.direction} onChange={sim.set('direction')} options={[{ value: 'LONG', label: tr('LONG — esperas una subida') }, { value: 'SHORT', label: tr('SHORT — esperas una caída') }]} /></Field>
              <Field label={tr('Apalancamiento')}><Select value={sim.input.leverage} onChange={sim.set('leverage', Number)} options={options.leverage} /></Field>
              <Field label="Costo simulado de operación (%)" hint={tr('Comisiones, spread, funding y otros, agrupados.')}><Input type="number" step="0.01" min="0" max="10" value={sim.input.costPct} onChange={sim.set('costPct')} /></Field>
              <Field label={tr('Precio de entrada')}><MoneyInput value={sim.input.entryPrice} onChange={sim.set('entryPrice')} /></Field>
              <Field label={tr('Precio de salida')}><MoneyInput value={sim.input.exitPrice} onChange={sim.set('exitPrice')} /></Field>
            </div>
          </SimForm>
        </ToolCard>
        {r && (
          <ToolCard step="2" title={tr('Resultado educativo')} aside={<span className={`pill ${r.favorable ? '' : 'bad'}`}>{r.favorable ? tr('Escenario favorable') : tr('Escenario adverso')}</span>}>
            <MetricGrid cols={2}>
              <MetricCard label={tr('Resultado neto simulado')} value={signedUsd(r.netResult)} tone={r.netResult >= 0 ? 'good' : 'bad'} hint={tr('{pct} sobre el margen', { pct: signedPct(r.resultOnMargin) })} />
              <MetricCard label={tr('Exposición nominal')} value={usd(r.exposure)} hint={`Movimiento ${signedPct(r.movePct)}`} />
            </MetricGrid>
            <ExplainRows rows={[
              ['Tú aportas (capital / margen)', usd(r.capital)],
              ['El apalancamiento crea (exposición nominal)', usd(r.exposure)],
              ['El mercado se mueve', signedPct(r.movePct), toneOf(r.movePct)],
              ['Tu exposición gana o pierde (resultado bruto)', signedUsd(r.grossResult), toneOf(r.grossResult)],
              ['Costos simulados (comisiones, spread, tasa de mantenimiento, etc.)', `−${usd(r.costs)}`, 'warn-text'],
              ['Resultado neto', signedUsd(r.netResult), toneOf(r.netResult)],
            ]} final={{ label: tr('Sobre tus {amount}', { amount: usd(r.capital) }), value: signedPct(r.resultOnMargin), tone: toneOf(r.resultOnMargin) }} />
          </ToolCard>
        )}
      </div>
      <RiskNote>{tr('Una simulación favorable no significa que una operación real sea segura, rentable o repetible. En un exchange real intervienen comisiones, spread, funding, slippage, precio de liquidación y reglas específicas.')}</RiskNote>
      <History sim={sim} columns={[
        { key: 'dir', label: tr('Dirección'), render: (s) => s.input.direction },
        { key: 'lev', label: tr('Apalancamiento'), render: (s) => `${s.input.leverage}x` },
        { key: 'net', label: tr('Resultado neto'), align: 'right', render: (s) => <span className={toneOf(s.result.netResult)}>{signedUsd(s.result.netResult)}</span> },
        { key: 'roi', label: tr('Sobre margen'), align: 'right', render: (s) => signedPct(s.result.resultOnMargin) },
      ]} />
    </div>
  );
}

export function M6ProfessionalSimulator() {
  return (
    <div className="tool">
      <MultiPositionLab />
    </div>
  );
}

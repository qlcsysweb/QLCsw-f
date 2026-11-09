import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { useAsync } from '../../../hooks/useAsync.js';
import { date, dateTime, money, pct, signedMoney } from '../../../utils/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { Field, FormError, Textarea } from '../../../components/ui/Form.jsx';
import { Pill, ProgressBar } from '../../../components/ui/Card.jsx';
import { DistributionBars } from '../../../components/charts/Charts.jsx';
import { ErrorState } from '../../../components/ui/States.jsx';
import { ExplainRows, KindBadge, MetricCard, MetricGrid, RiskNote, SaveStatus, ToolCard, ToolSkeleton } from '../ResultParts.jsx';
import { useAction } from '../useAction.js';
import { tr } from '../../../i18n/tr.js';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const longDate = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
};
const toneOf = (v, inverse = false) => (v === 0 ? '' : (v > 0) !== inverse ? 'good' : 'bad');

function GoalCard({ report }) {
  const { basePath } = useWorkspace();
  const name = report.goal?.name && report.goal.name !== 'Meta patrimonial' ? report.goal.name : '';
  const g = report.goalProgress;
  return (
    <ToolCard title={tr('Meta patrimonial')} description={tr('Resultado de tu meta hasta hoy. La meta y sus aportaciones se registran en el Módulo 8 · Fondo de emergencia, Meta patrimonial y Liquidez.')} aside={<KindBadge kind="REAL" />}>
      {g ? (
        <>
          <ExplainRows
            title={tr('Avance al {date}', { date: date(g.asOf) })}
            rows={[
              ...(name ? [['Concepto de la meta', tr(name)]] : []),
              ['Meta patrimonial', money(g.goal)],
              ['Aportado a la meta', money(g.current)],
              [g.reached ? tr('Meta superada por') : tr('Falta para la meta'), money(Math.abs(g.distance))],
            ]}
            final={{ label: tr('Avance de la meta'), value: pct(g.progress), tone: g.reached ? 'up' : '' }}
          />
          <ProgressBar value={Math.min(100, g.progress || 0)} label={tr('Avance de la meta patrimonial')} />
        </>
      ) : (
        <p className="empty-inline">{tr('Aún no registras una meta patrimonial.')}</p>
      )}
      <p className="small muted"><Link to={`${basePath}/academia/m/8`}>{tr('Ir al Módulo 8 para definir tu meta o registrar aportaciones')}</Link></p>
    </ToolCard>
  );
}

function NotesCard({ report }) {
  const { api, canEdit } = useWorkspace();
  const action = useAction();
  const [note, setNote] = useState(report.note?.note || '');
  return (
    <ToolCard title={tr('Notas de revisión anual')} description={tr('Tus notas se guardan aquí mismo, en el Módulo 12, para la revisión de este año. También aparecen en la sección «Notas» del informe en PDF («Guardar informe en PDF») y en cada revisión de tu historial. No modifican datos financieros.')}>
      {report.note?.updatedAt && <p className="small muted">{tr('Última vez guardadas: {date}', { date: dateTime(report.note.updatedAt) })}</p>}
      <Field label={tr('Notas')}>
        <Textarea maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} disabled={!canEdit} placeholder={tr('Ej. Reducir deuda y aumentar liquidez')} />
      </Field>
      <FormError error={action.error} />
      {canEdit && (
        <div className="form-actions">
          <SaveStatus action={action} savedText="Notas guardadas." />
          <Button variant="secondary" loading={action.busy} onClick={() => action.run(() => api.put('/academy/annual-review/note', { note }))}>{tr('Guardar notas')}</Button>
        </div>
      )}
    </ToolCard>
  );
}

function History({ reloadKey }) {
  const { api } = useWorkspace();
  const res = useAsync(() => api.get('/academy/annual-review/history'), [api, reloadKey]);
  const [error, setError] = useState(null);
  return (
    <ToolCard title={tr('Historial de revisiones')} description={tr('Cada revisión guardada conserva sus cifras aunque cambien tus datos actuales.')}>
      <DataTable
        rows={res.data || []}
        empty={res.loading ? tr('Cargando historial…') : tr('Aún no guardas revisiones anuales.')}
        columns={[
          { key: 'period', label: tr('Periodo'), render: (r) => `${date(r.periodStart)} – ${date(r.periodEnd)}` },
          { key: 'finalNetWorth', label: tr('Patrimonio final'), align: 'right', render: (r) => money(r.finalNetWorth) },
          { key: 'variation', label: tr('Variación'), align: 'right', render: (r) => <span className={r.variation < 0 ? 'down' : 'up'}>{signedMoney(r.variation)}</span> },
          { key: 'complete', label: tr('Información'), render: (r) => <Pill variant={r.complete ? '' : 'warn'}>{r.complete ? 'Completa' : 'Incompleta'}</Pill> },
          { key: 'x', label: 'PDF', align: 'right', render: (r) => <button type="button" className="btn-link" onClick={() => api.download(`/academy/annual-review/history/${r.id}/pdf`).catch(setError)}>{tr('Descargar')}</button> },
        ]}
      />
      <FormError error={error} />
    </ToolCard>
  );
}

function Evolution({ report }) {
  const c = report.change;
  return (
    <>
      <MetricGrid cols={2}>
        <MetricCard label={tr('Patrimonio inicial')} value={money(c.initialNetWorth)} hint={`Activos − deudas · ${report.initialRef.label}`} />
        <MetricCard label={tr('Patrimonio final')} value={money(c.finalNetWorth)} hint={`Activos − deudas · ${report.finalRef.label}`} />
        <MetricCard label={tr('Variación patrimonial')} value={signedMoney(c.variation)} tone={toneOf(c.variation)} hint={tr('Final − inicial')} />
        <MetricCard label={tr('Variación porcentual')} value={c.variationPercent === null ? 'N/D' : pct(c.variationPercent, { signed: true })} tone={toneOf(c.variation)} hint={c.variationPercent === null ? tr('Patrimonio inicial en cero') : tr('Variación ÷ patrimonio inicial')} />
      </MetricGrid>
      <div className="split-panel">
        <ToolCard title={tr('Resumen del periodo')}>
          <ExplainRows
            title={tr('Activos y deudas')}
            rows={[
              ['Activos iniciales', money(c.initialAssets)],
              ['Activos finales', money(c.finalAssets)],
              ['Variación de activos', signedMoney(c.assetsChange), toneOf(c.assetsChange) === 'good' ? 'up' : toneOf(c.assetsChange) ? 'down' : ''],
              ['Deudas iniciales', money(c.initialDebts)],
              ['Deudas finales', money(c.finalDebts)],
              ['Variación de deudas', signedMoney(c.debtsChange), c.debtsChange < 0 ? 'up' : c.debtsChange > 0 ? 'down' : ''],
            ]}
          />
          <p className="small muted">{tr('Patrimonio neto = activos − deudas. Reducir deudas puede mejorar el patrimonio aunque los activos no aumenten.')}</p>
        </ToolCard>
        <ToolCard title={tr('Distribución final por categoría')} description={tr('Total de activos: {amount}', { amount: money(c.finalAssets) })}>
          <DistributionBars items={report.distribution.map((d) => ({ key: d.category, label: d.category, value: d.amount, share: d.share }))} />
        </ToolCard>
      </div>
      <ToolCard title={tr('Activos')} description={tr('Un aumento puede venir de aportaciones, compras, revalorizaciones o rendimientos: no todo es rentabilidad.')}>
        <DataTable
          rowKey="key"
          rows={report.assets}
          empty={tr('Sin activos registrados en el periodo.')}
          columns={[
            { key: 'name', label: tr('Activo'), render: (a) => <b>{tr(a.name)}</b> },
            { key: 'category', label: tr('Categoría') },
            { key: 'initial', label: tr('Valor inicial'), align: 'right', render: (a) => money(a.initial) },
            { key: 'final', label: tr('Valor final'), align: 'right', render: (a) => money(a.final) },
            { key: 'change', label: tr('Variación'), align: 'right', render: (a) => <span className={a.change < 0 ? 'down' : a.change > 0 ? 'up' : ''}>{signedMoney(a.change)}</span> },
            { key: 'changePercent', label: tr('Variación %'), align: 'right', render: (a) => pct(a.changePercent) },
          ]}
        />
      </ToolCard>
      <ToolCard title={tr('Deudas y obligaciones')} description={tr('Saldos al inicio y al cierre del periodo, sin contar dos veces los pagos.')}>
        <DataTable
          rowKey="key"
          rows={report.debts}
          empty={tr('Sin deudas registradas en el periodo.')}
          columns={[
            { key: 'name', label: 'Obligación', render: (d) => <b>{tr(d.name)}</b> },
            { key: 'initial', label: tr('Saldo inicial'), align: 'right', render: (d) => money(d.initial) },
            { key: 'final', label: tr('Saldo final'), align: 'right', render: (d) => money(d.final) },
            { key: 'change', label: tr('Variación'), align: 'right', render: (d) => <span className={d.change > 0 ? 'down' : d.change < 0 ? 'up' : ''}>{signedMoney(d.change)}</span> },
          ]}
        />
      </ToolCard>
    </>
  );
}

export function M12AnnualReview({ onSaved }) {
  const { api, canEdit } = useWorkspace();
  const res = useAsync(() => api.get('/academy/annual-review'), [api]);
  const save = useAction();
  const download = useAction();
  const [historyKey, setHistoryKey] = useState(0);

  if (res.loading && !res.data) return <ToolSkeleton />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const report = res.data;
  const saveReview = async () => {
    if (await save.run(() => api.post('/academy/annual-review/save', {}))) {
      await res.reload();
      setHistoryKey((k) => k + 1);
      onSaved?.();
    }
  };

  return (
    <div className="tool">
      <div className="period-band">
        <div>
          <span className="section-kicker">{tr('Periodo automático · últimos 12 meses completos')}</span>
          <strong>{longDate(report.window.startDate)} – {longDate(report.window.endDate)}</strong>
          <small>{tr('El mes en curso no se incluye. Moneda:')}{' '}{report.currency}{tr('. El PDF usa exactamente este periodo.')}</small>
        </div>
        <div className="row-actions">
          <Pill variant={report.complete ? '' : 'warn'}>{report.complete ? tr('Información completa') : tr('Información histórica incompleta')}</Pill>
          <Button variant="secondary" loading={download.busy} onClick={() => download.run(() => api.download('/academy/annual-review/pdf'))}>{tr('Guardar informe en PDF')}</Button>
        </div>
      </div>
      <FormError error={download.error} />

      {report.warnings.length > 0 && (
        <div className="warning-list">{report.warnings.map((w) => <RiskNote key={w.code}>{tr(w.message)}</RiskNote>)}</div>
      )}

      {report.hasData ? <Evolution report={report} /> : (
        <p className="empty-inline">{tr('Cuando registres y cierres tus periodos mensuales, aquí verás la evolución de tu patrimonio. No se muestran cifras de demostración.')}</p>
      )}

      <div className="split-panel">
        <GoalCard report={report} />
        <NotesCard key={`note-${report.note?.updatedAt || 'none'}`} report={report} />
      </div>

      <ToolCard title={tr('¿Qué cambió durante el año?')} description={tr('Lectura educativa generada con reglas a partir de tus datos. No es una recomendación de inversión.')} aside={<KindBadge kind="REAL" />}>
        {report.changes.length ? (
          <ul className="change-list">{report.changes.map((c) => <li key={c.key} className={`tone-${c.tone}`}>{tr(c.text)}</li>)}</ul>
        ) : <p className="empty-inline">{tr('Sin información suficiente para describir cambios.')}</p>}
      </ToolCard>

      <ToolCard title={tr('Guardar revisión anual')} description={tr('Conserva un snapshot del informe de este periodo. No se recalcula con datos posteriores.')}>
        {report.saved ? (
          <p className="small">{tr('Revisión de este periodo guardada el')}{' '}{dateTime(report.saved.generatedAt)}{report.saved.driveFileId ? tr(' · PDF almacenado en Google Drive') : ''}.</p>
        ) : canEdit ? (
          <div className="form-actions">
            <SaveStatus action={save} savedText={tr('Revisión guardada en tu historial.')} />
            <Button loading={save.busy} onClick={saveReview}>{tr('Guardar revisión anual')}</Button>
          </div>
        ) : <p className="small muted">{tr('Sin revisión guardada para este periodo.')}</p>}
        <FormError error={save.error} />
      </ToolCard>

      <History reloadKey={historyKey} />
    </div>
  );
}

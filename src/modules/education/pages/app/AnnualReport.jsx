import { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, money, pct, shortMonth, tone } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FormError } from '../../components/ui/Form.jsx';
import { AsyncView, Empty, ErrorState, Loading } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { BarChart, DistributionBars } from '../../components/charts/Charts.jsx';
import { Money, Roi } from '../../components/finance/Finance.jsx';
import { tr } from '../../i18n/tr.js';

function Report({ report }) {
  const s = report.snapshot;
  return (
    <>
      <StatGrid>
        <StatCard label={tr('Patrimonio inicial anual')} value={money(s.patrimony.opening)} />
        <StatCard label={tr('Patrimonio final anual')} value={money(s.patrimony.final)} accent />
        <StatCard label={tr('Variación')} value={<Money value={s.patrimony.variation} signed />} />
        <StatCard label={tr('Crecimiento')} value={<span className={tone(s.patrimony.growth)}>{pct(s.patrimony.growth, { signed: true })}</span>} />
      </StatGrid>
      <StatGrid>
        <StatCard label={tr('Ingresos acumulados')} value={money(s.cashflow.income)} />
        <StatCard label={tr('Gastos acumulados')} value={money(s.cashflow.expenses)} />
        <StatCard label={tr('Ahorro acumulado')} value={money(s.cashflow.savings)} delta={tr('{pct} de los ingresos', { pct: pct(s.cashflow.savingsRate) })} />
        <StatCard label={tr('Rentabilidad acumulada')} value={<Money value={s.patrimony.profitability} signed />} delta={`Aportaciones ${money(s.patrimony.contributions)} · Deducciones ${money(s.patrimony.withdrawals)}`} />
      </StatGrid>
      <StatGrid cols={2}>
        <StatCard label={tr('Evolución de deuda')} value={`${money(s.debt.start)} → ${money(s.debt.end)}`} />
        <StatCard label={tr('Evolución de liquidez')} value={`${money(s.liquidity.start)} → ${money(s.liquidity.end)}`} />
      </StatGrid>

      <Card title={tr('¿Qué cambió durante el año?')}>
        <ul className="observations">{s.observations.map((o, i) => <li key={i}>{tr(o)}</li>)}</ul>
        <p className="small muted">{tr('Observaciones generadas a partir de tus datos registrados. No constituyen asesoría ni proyección de rendimientos.')}</p>
      </Card>

      <div className="layout">
        <Card title={tr('Evolución mensual del patrimonio final')}>
          <BarChart data={s.monthly.map((m) => ({ label: shortMonth(m.month), value: m.final }))} />
        </Card>
        <Card title={tr('Distribución al cierre')}>
          <DistributionBars items={s.distribution.map((d) => ({ key: d.code, label: d.name, value: d.final, share: d.share }))} />
        </Card>
      </div>

      <Card title={tr('Resultados por categoría')}>
        <DataTable rowKey="code" rows={s.categories} columns={[
          { key: 'name', label: tr('Categoría') },
          { key: 'result', label: tr('Resultado acumulado'), align: 'right', render: (c) => <Money value={c.result} signed /> },
          { key: 'finalCapital', label: tr('Capital al cierre'), align: 'right', render: (c) => money(c.finalCapital) },
          { key: 'share', label: tr('% portafolio'), align: 'right', render: (c) => pct(c.share) },
        ]} />
      </Card>
      {s.products?.length > 0 && (
        <Card title={tr('Resultados por inversión')}>
          <DataTable rowKey="assetId" rows={s.products} columns={[
            { key: 'name', label: tr('Producto') },
            { key: 'categoryName', label: tr('Categoría') },
            { key: 'result', label: tr('Resultado acumulado'), align: 'right', render: (p) => <Money value={p.result} signed /> },
            { key: 'finalCapital', label: tr('Capital al cierre'), align: 'right', render: (p) => money(p.finalCapital) },
          ]} />
        </Card>
      )}
      <Card title={tr('Evolución mensual')}>
        <DataTable rowKey="month" rows={s.monthly} columns={[
          { key: 'label', label: tr('Mes') },
          { key: 'opening', label: tr('P. inicial'), align: 'right', render: (m) => money(m.opening) },
          { key: 'contributions', label: tr('Aportaciones'), align: 'right', render: (m) => money(m.contributions) },
          { key: 'withdrawals', label: tr('Deducciones'), align: 'right', render: (m) => money(m.withdrawals) },
          { key: 'profitability', label: tr('Rentabilidad'), align: 'right', render: (m) => <Money value={m.profitability} signed /> },
          { key: 'final', label: tr('P. final'), align: 'right', render: (m) => money(m.final) },
          { key: 'roi', label: 'ROI', align: 'right', render: (m) => <Roi value={m.roi} /> },
        ]} />
      </Card>
    </>
  );
}

export default function AnnualReport() {
  const { api, canEdit } = useWorkspace();
  const years = useAsync(() => api.get('/annual-reports/years'), [api]);
  const reports = useAsync(() => api.get('/annual-reports'), [api]);
  const [year, setYear] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!year && years.data?.length) setYear(years.data[0].year);
  }, [years.data, year]);

  const report = useAsync(() => api.get(`/annual-reports/${year}`), [api, year], { enabled: !!year });
  const info = years.data?.find((y) => y.year === year);

  const generate = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/annual-reports/${year}/generate`);
      await Promise.all([report.reload(), reports.reload()]);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={tr('Informe patrimonial anual')}
        subtitle={tr('Consolidación de los cortes mensuales del año')}
        actions={years.data?.length > 0 && (
          <select className="month" value={year || ''} onChange={(e) => setYear(Number(e.target.value))} aria-label={tr('Año')}>
            {years.data.map((y) => <option key={y.year} value={y.year}>{tr('Año')}{' '}{y.year} · {y.monthsClosed}/12 cortes</option>)}
          </select>
        )}
      />
      <AsyncView {...years} onRetry={years.reload} isEmpty={(d) => d.length === 0}
        empty={<Empty title={tr('Aún no hay cortes mensuales')} text={tr('El informe anual se construye con los periodos cerrados. Después de 12 cortes obtendrás tu informe completo.')} />}>
        {() => (
          <>
            {info && (
              <Card>
                <div className="row">
                  <span>
                    {info.monthsClosed === 12 ? <Pill>{tr('Año completo · 12 de 12 periodos')}</Pill> : <Pill variant="warn">Informe parcial · {tr(info.monthsClosed)}{' '}{tr('de 12 periodos')}</Pill>}
                    {report.data && <span className="small block">{tr('Generado el')}{' '}{dateTime(report.data.generatedAt)}</span>}
                  </span>
                  <span className="row-actions">
                    {canEdit && <Button loading={busy} onClick={generate}>{report.data ? tr('Actualizar informe') : tr('Generar informe')}</Button>}
                    {report.data && <Button variant="secondary" onClick={() => api.download(`/annual-reports/${year}/pdf`).catch(setErr)}>{tr('Descargar PDF')}</Button>}
                  </span>
                </div>
                <FormError error={err} />
              </Card>
            )}
            {report.loading ? <Loading /> : report.error?.status === 404 ? (
              <Empty title={tr('Informe {year} aún no generado', { year: year })} text={tr('Genera el informe para consolidar los cortes cerrados del año.')} />
            ) : report.error ? <ErrorState error={report.error} onRetry={report.reload} /> : report.data && <Report report={report.data} />}
          </>
        )}
      </AsyncView>

      {reports.data?.length > 0 && (
        <Card title={tr('Historial anual')}>
          <DataTable rowKey="id" rows={reports.data} columns={[
            { key: 'year', label: tr('Año') },
            { key: 'o', label: tr('Patrimonio inicial'), align: 'right', render: (r) => money(r.snapshot.patrimony.opening) },
            { key: 'f', label: tr('Patrimonio final'), align: 'right', render: (r) => money(r.snapshot.patrimony.final) },
            { key: 'g', label: tr('Crecimiento'), align: 'right', render: (r) => <span className={tone(r.snapshot.patrimony.growth)}>{pct(r.snapshot.patrimony.growth, { signed: true })}</span> },
            { key: 'm', label: 'Periodos', render: (r) => `${r.snapshot.monthsClosed}/12` },
          ]} />
        </Card>
      )}
      <Notice>{tr('El informe se genera desde los snapshots de los cortes cerrados, por lo que conserva la información histórica aunque cambien datos posteriores.')}</Notice>
    </>
  );
}

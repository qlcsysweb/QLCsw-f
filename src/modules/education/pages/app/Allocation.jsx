import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { usePeriodSummary } from '../../hooks/usePeriodSummary.js';
import { money, pct } from '../../utils/format.js';
import { Card, PageHeader } from '../../components/ui/Card.jsx';
import { AsyncView, Empty } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { RequirePeriod } from '../../features/periods/PeriodControls.jsx';
import { AllocationBars, ReadingCard } from '../../features/academy/AllocationView.jsx';
import { modulePath } from '../../features/academy/useAcademy.js';
import { tr } from '../../i18n/tr.js';

function Body({ s, allocation }) {
  const { basePath } = useWorkspace();
  if (!s.portfolio.products.length) {
    return (
      <Empty
        title={tr('Sin distribución todavía')}
        text={tr('Registra tus productos en el Módulo 2 o en Mi portafolio de inversión para ver cómo está distribuido tu patrimonio.')}
        action={<Link className="btn-primary" to={modulePath(basePath, 2)}>{tr('Ir al mapa de productos')}</Link>}
      />
    );
  }
  return (
    <>
      <div className="layout">
        <Card title={tr('Distribución por categoría · {total}', { total: money(allocation.total) })}>
          <AllocationBars allocation={allocation} />
          {allocation.pendingBreakdown > 0 && <p className="small muted">{money(allocation.pendingBreakdown)}{' '}{tr('del diagnóstico aún no están desglosados en productos.')}</p>}
        </Card>
        <ReadingCard reading={allocation.reading} shares={allocation.shares} />
      </div>
      <Card title={tr('Detalle por producto')}>
        <DataTable
          rowKey="positionId"
          rows={[...s.portfolio.products].sort((a, b) => b.final - a.final)}
          columns={[
            { key: 'name', label: tr('Producto') },
            { key: 'categoryName', label: tr('Categoría') },
            { key: 'final', label: tr('Capital'), align: 'right', render: (p) => money(p.final) },
            { key: 'share', label: tr('% del portafolio'), align: 'right', render: (p) => pct(p.share) },
          ]}
        />
      </Card>
      <p className="small muted">{tr('Un portafolio no debe evaluarse únicamente por rendimiento potencial: también importan su liquidez, riesgo, horizonte y función dentro del patrimonio.')}</p>
    </>
  );
}

export default function Allocation() {
  const res = usePeriodSummary();
  return (
    <RequirePeriod>
      <PageHeader title={tr('Allocation / distribución patrimonial')} subtitle={tr('¿De dónde proviene tu patrimonio?')} />
      <AsyncView {...res} data={res.data} onRetry={res.reload}>{(d) => <Body s={d.summary} allocation={d.allocation} />}</AsyncView>
    </RequirePeriod>
  );
}

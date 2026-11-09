import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { usePeriodSummary } from '../../hooks/usePeriodSummary.js';
import { money } from '../../utils/format.js';
import { Notice, PageHeader, StatCard, StatGrid } from '../../components/ui/Card.jsx';
import { Empty } from '../../components/ui/States.jsx';
import { ClosedNotice, Money } from '../../components/finance/Finance.jsx';
import { RecordManager } from '../../features/records/RecordManager.jsx';
import { RequirePeriod } from '../../features/periods/PeriodControls.jsx';
import { tr } from '../../i18n/tr.js';

function Body() {
  const { basePath } = useWorkspace();
  const { summary: s, reload } = usePeriodSummary();
  if (!s) return null;
  const businesses = s.portfolio.products.filter((p) => p.categoryCode === 'NEGOCIOS');
  const capitalOf = (assetId) => businesses.find((b) => b.assetId === assetId)?.final;
  const nameOf = (assetId) => businesses.find((b) => b.assetId === assetId)?.name || '—';

  return (
    <>
      <PageHeader title={tr('Negocios y flujo de efectivo')} subtitle={tr('Diversificación más allá de los mercados financieros')} />
      <Notice>{tr('Este módulo es solo para tu control interno: los ingresos, gastos y flujo que registras aquí no modifican Mi portafolio de inversión ni tu patrimonio.')}</Notice>
      <ClosedNotice />
      <StatGrid>
        <StatCard label={tr('Negocios registrados')} value={businesses.length} />
        <StatCard label={tr('Capital en negocios')} value={money(businesses.reduce((a, b) => a + b.final, 0))} />
        <StatCard label={tr('Ingresos de negocios')} value={money(s.business.revenue)} />
        <StatCard label={tr('Flujo neto')} value={<Money value={s.business.net} signed />} accent delta={tr('Ingresos − gastos del negocio')} />
      </StatGrid>
      {businesses.length === 0 ? (
        <Empty title={tr('Aún no tienes negocios registrados')}
          text={tr('Registra primero tu negocio en Mi portafolio de inversión, categoría Negocios (capital invertido). Después podrás registrar aquí su flujo mensual.')}
          action={<Link className="btn-primary" to={`${basePath}/cartera`}>{tr('Ir a Mi portafolio de inversión')}</Link>} />
      ) : (
        <RecordManager endpoint="/business" title={tr('Flujo mensual por negocio')} addLabel="+ Registrar flujo" onChanged={reload}
          fields={[
            { name: 'assetId', label: 'Negocio', type: 'select', options: businesses.map((b) => ({ value: b.assetId, label: b.name })), display: nameOf },
            { name: 'revenue', label: tr('Ingresos del negocio'), type: 'money', display: money },
            { name: 'costs', label: tr('Gastos del negocio'), type: 'money', display: money },
            { name: 'notes', label: tr('Notas'), type: 'textarea', required: false },
          ]}
          toForm={(f) => ({ assetId: f.assetId, revenue: Number(f.revenue), costs: Number(f.costs), notes: f.notes || '' })}
          columns={[
            { key: 'assetId', label: 'Negocio', render: (f) => nameOf(f.assetId) },
            { key: 'capital', label: tr('Capital'), align: 'right', render: (f) => money(capitalOf(f.assetId)) },
            { key: 'revenue', label: tr('Ingresos'), align: 'right', render: (f) => <span className="up">+{money(f.revenue)}</span> },
            { key: 'costs', label: tr('Gastos'), align: 'right', render: (f) => <span className="down">−{money(f.costs)}</span> },
            { key: 'net', label: tr('Flujo neto'), align: 'right', render: (f) => <Money value={Number(f.revenue) - Number(f.costs)} signed /> },
          ]}
          emptyText={tr('Sin flujo registrado en este periodo.')} />
      )}
      <div className="hero">
        <h2>{tr('Un negocio también puede ser parte de la estructura patrimonial')}</h2>
        <p>{tr('Un negocio físico puede aportar flujo de efectivo vinculado a una actividad productiva, pero no es automáticamente seguro: tiene riesgos de demanda, competencia, gastos, personal, inventario y capital inmovilizado. El flujo del negocio se mantiene separado de tu presupuesto personal.')}</p>
      </div>
    </>
  );
}

export default function Business() {
  return <RequirePeriod><Body /></RequirePeriod>;
}

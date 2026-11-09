import { Link, useParams } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { date, money, periodLabel, shortMonth } from '../../utils/format.js';
import { Card, PageHeader } from '../../components/ui/Card.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { BarChart } from '../../components/charts/Charts.jsx';
import { Money, Roi } from '../../components/finance/Finance.jsx';
import { MOVEMENT_TYPES } from '../../utils/labels.js';
import { tr } from '../../i18n/tr.js';

export default function AssetDetail() {
  const { assetId } = useParams();
  const { api, basePath } = useWorkspace();
  const res = useAsync(() => api.get(`/portfolio/assets/${assetId}`), [api, assetId]);

  return (
    <AsyncView {...res} onRetry={res.reload}>
      {(a) => (
        <>
          <Link className="btn-secondary back" to={`${basePath}/cartera`}>{tr('← Mi portafolio de inversión')}</Link>
          <PageHeader kicker={tr('Mi portafolio de inversión · {category}', { category: tr(a.category.name) })} title={a.name} subtitle={a.institution || tr('Historial del producto por periodo')} />
          <Card title={tr('Capital final por periodo')}>
            <BarChart data={a.history.map((h) => ({ label: `${shortMonth(h.month)} ${String(h.year).slice(2)}`, value: h.final }))} />
          </Card>
          <Card title={tr('Historial')}>
            <DataTable
              rowKey="positionId"
              rows={[...a.history].reverse()}
              columns={[
                { key: 'p', label: tr('Periodo'), render: (h) => periodLabel(h) },
                { key: 'initial', label: tr('Capital inicial'), align: 'right', render: (h) => money(h.initial) },
                { key: 'final', label: tr('Capital final'), align: 'right', render: (h) => money(h.final) },
                { key: 'result', label: 'Resultado', align: 'right', render: (h) => <Money value={h.result} signed /> },
                { key: 'roi', label: 'ROI', align: 'right', render: (h) => <Roi value={h.roi} /> },
              ]}
            />
          </Card>
          {a.movements.length > 0 && (
            <Card title={tr('Movimientos patrimoniales asociados')}>
              <DataTable
                rows={a.movements}
                columns={[
                  { key: 'date', label: tr('Fecha'), render: (m) => date(m.date) },
                  { key: 'type', label: tr('Tipo'), render: (m) => MOVEMENT_TYPES[m.type] },
                  { key: 'description', label: tr('Descripción') },
                  { key: 'amount', label: tr('Monto'), align: 'right', render: (m) => money(m.amount) },
                ]}
              />
            </Card>
          )}
          {a.notes && <Card title={tr('Notas')}><p className="muted">{tr(a.notes)}</p></Card>}
        </>
      )}
    </AsyncView>
  );
}

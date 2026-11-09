import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePeriodSummary } from '../../hooks/usePeriodSummary.js';
import { dateTime, money, periodLabel } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { FormError } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Money, ReconciliationBanner, Roi } from '../../components/finance/Finance.jsx';
import { NewPeriodModal, RequirePeriod } from '../../features/periods/PeriodControls.jsx';
import { tr } from '../../i18n/tr.js';

function CurrentPeriodClose({ onClosed }) {
  const { api, period, canEdit, isFullAdmin, reloadPeriods } = useWorkspace();
  const { summary: s } = usePeriodSummary();
  const [dialog, setDialog] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });
  const [newOpen, setNewOpen] = useState(false);
  if (!s) return null;
  const closed = period.status === 'CLOSED';

  const run = async () => {
    setState({ busy: true, error: null });
    try {
      if (dialog === 'close') await api.post(`/periods/${period.id}/close`);
      else await api.post(`/periods/${period.id}/reopen`);
      setDialog(null);
      await reloadPeriods(period.id);
      onClosed();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  return (
    <Card title={`Periodo seleccionado · ${periodLabel(period)}`} actions={<Pill variant={closed ? '' : 'warn'}>{closed ? tr('Cerrado') : tr('Abierto')}</Pill>}>
      <div className="totals">
        <div className="total"><span>{tr('Patrimonio inicial')}</span><strong>{money(s.patrimony.opening)}</strong></div>
        <div className="total"><span>{tr('Patrimonio final')}</span><strong>{money(s.patrimony.final)}</strong></div>
        <div className="total"><span>{tr('Variación')}</span><strong><Money value={s.patrimony.variation} signed /></strong></div>
        <div className="total"><span>{tr('ROI portafolio')}</span><strong><Roi value={s.portfolio.global.roi} /></strong></div>
      </div>
      <ReconciliationBanner reconciliation={s.reconciliation} />
      <div className="form-actions">
        {!closed && canEdit && (
          <Button onClick={() => setDialog('close')} disabled={!s.reconciliation.reconciled}
            title={s.reconciliation.reconciled ? '' : tr('Concilia el periodo antes de cerrarlo')}>{tr('Realizar corte mensual')}</Button>
        )}
        {closed && canEdit && <Button variant="secondary" onClick={() => setNewOpen(true)}>{tr('Iniciar siguiente periodo')}</Button>}
        {closed && isFullAdmin && <Button variant="secondary" onClick={() => setDialog('reopen')}>{tr('Reabrir para corrección')}</Button>}
      </div>
      {!closed && !s.reconciliation.reconciled && <p className="small down">{tr('El periodo debe estar conciliado para poder cerrarse.')}</p>}
      <FormError error={state.error} />

      <ConfirmDialog
        open={dialog === 'close'}
        title={`Cerrar ${periodLabel(period)}`}
        message={tr('Se guardará un snapshot histórico del periodo (patrimonio, movimientos, resultados por producto y categoría, distribución y conciliación). Después ya no podrá modificarse.')}
        confirmLabel={tr('Cerrar periodo')}
        loading={state.busy}
        onConfirm={run}
        onClose={() => setDialog(null)}
      >
        <FormError error={state.error} />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'reopen'}
        title={`Reabrir ${periodLabel(period)}`}
        message={tr('La revisión actual del corte se conserva como histórico.')}
        confirmLabel={tr('Reabrir')}
        danger
        loading={state.busy}
        onConfirm={run}
        onClose={() => setDialog(null)}
      >
        <FormError error={state.error} />
      </ConfirmDialog>
      {newOpen && <NewPeriodModal open onClose={() => setNewOpen(false)} />}
    </Card>
  );
}

function History({ closes }) {
  const { api } = useWorkspace();
  const [err, setErr] = useState(null);
  const download = (c) => api.download(`/monthly-closes/${c.id}/pdf`).catch(setErr);
  return (
    <Card title={tr('Historial de cortes')}>
      <DataTable
        rows={closes}
        empty={tr('Aún no hay cortes. Cierra tu primer periodo conciliado para comenzar tu historial.')}
        columns={[
          { key: 'p', label: tr('Periodo'), render: (c) => <>{tr(c.snapshot.period.label)}{c.revision > 1 && <span className="small block">{tr('Revisión')}{' '}{tr(c.revision)}</span>}</> },
          { key: 'opening', label: tr('Patrimonio inicial'), align: 'right', render: (c) => money(c.snapshot.patrimony.opening) },
          { key: 'final', label: tr('Patrimonio final'), align: 'right', render: (c) => money(c.snapshot.patrimony.final) },
          { key: 'var', label: tr('Variación'), align: 'right', render: (c) => <Money value={c.snapshot.patrimony.variation} signed /> },
          { key: 'roi', label: tr('ROI portafolio'), align: 'right', render: (c) => <Roi value={c.snapshot.portfolio.global.roi} /> },
          { key: 'st', label: tr('Estado'), render: (c) => (c.supersededAt ? <Pill variant="warn">{tr('Corregido')}</Pill> : <Pill>{tr('Vigente')}</Pill>) },
          { key: 'at', label: tr('Cerrado'), render: (c) => dateTime(c.closedAt) },
          { key: 'pdf', label: 'Reporte', render: (c) => <button className="btn-secondary" onClick={() => download(c)}>{tr('Descargar PDF')}</button> },
        ]}
      />
      <FormError error={err} />
    </Card>
  );
}

export default function Closes() {
  const { api } = useWorkspace();
  const closes = useAsync(() => api.get('/monthly-closes'), [api]);
  return (
    <>
      <PageHeader title={tr('Cortes mensuales')} subtitle={tr('Tu historial de evolución patrimonial')} />
      <Notice>
        {tr('Al cierre de cada periodo el sistema calcula primero cada producto, después cada categoría y finalmente el portafolio global. Cada periodo queda archivado y puede descargarse en PDF. El siguiente periodo toma como referencia el patrimonio final del anterior.')}
      </Notice>
      <RequirePeriod>
        <CurrentPeriodClose onClosed={closes.reload} />
      </RequirePeriod>
      <AsyncView {...closes} onRetry={closes.reload}>{(list) => <History closes={list} />}</AsyncView>
    </>
  );
}

import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { money, pct, signedMoney, tone } from '../../utils/format.js';
import { Card, Row } from '../ui/Card.jsx';
import { tr } from '../../i18n/tr.js';

export function ReconciliationBanner({ reconciliation, compact }) {
  if (!reconciliation) return null;
  const ok = reconciliation.reconciled;
  return (
    <div className={`recon ${ok ? 'ok' : 'bad'} ${compact ? 'compact' : ''}`} role="status">
      <div className="recon-status">
        <span className="recon-icon" aria-hidden="true">{ok ? '✓' : '!'}</span>
        <b>{ok ? tr('PATRIMONIO CONCILIADO') : tr('INFORMACIÓN NO CONCILIADA')}</b>
      </div>
      {!compact && (
        <div className="recon-grid">
          <div><span>{tr('Patrimonio final (portafolio de inversión + liquidez)')}</span><strong>{money(reconciliation.portfolioFinal)}</strong></div>
          <div><span>{tr('Patrimonio final Movimientos')}</span><strong>{money(reconciliation.movementsFinal)}</strong></div>
          <div><span>{tr('Diferencia')}</span><strong className={ok ? '' : 'down'}>{money(reconciliation.difference)}</strong></div>
        </div>
      )}
      {!ok && !compact && (
        <p className="recon-help">
          {tr('La rentabilidad no genera diferencia porque ya se suma en los dos totales. La diferencia aparece cuando entra o sale dinero de tus productos sin registrarlo: revisa si tienes inversión sin asignar o si quitaste un producto este mes sin registrar el retiro.')}
        </p>
      )}
    </div>
  );
}

export function PatrimonyBreakdown({ patrimony, roi }) {
  return (
    <Card title={tr('Patrimonio del periodo')}>
      <Row label={tr('Patrimonio inicial')} value={money(patrimony.opening)} />
      <Row label={tr('Aportaciones')} value={signedMoney(patrimony.contributions)} valueTone={patrimony.contributions ? 'up' : ''} />
      <Row label={tr('Deducciones')} value={signedMoney(-patrimony.withdrawals)} valueTone={patrimony.withdrawals ? 'down' : ''} />
      <Row label={tr('Movimiento neto')} value={signedMoney(patrimony.netMovement)} valueTone="auto" toneValue={patrimony.netMovement} />
      <Row label={tr('Rentabilidad')} value={signedMoney(patrimony.profitability)} valueTone="auto" toneValue={patrimony.profitability} sub={`ROI ${pct(roi, { signed: true })}`} />
      <div className="final-row">
        <span>{tr('Patrimonio final')}</span>
        <strong>{money(patrimony.final)}</strong>
      </div>
      <p className="small muted">
        {tr('Variación')}{' '}{signedMoney(patrimony.variation)} = movimiento neto {signedMoney(patrimony.netMovement)} + rentabilidad{' '}
        {signedMoney(patrimony.profitability)}
      </p>
    </Card>
  );
}

export const Money = ({ value, signed }) => <span className={signed ? tone(value) : ''}>{signed ? signedMoney(value) : money(value)}</span>;
export const Roi = ({ value }) => <span className={tone(value)}>{pct(value, { signed: true })}</span>;

export function ClosedNotice() {
  const { period, basePath } = useWorkspace();
  if (period?.status !== 'CLOSED') return null;
  return (
    <div className="notice gold">
      {tr('Este periodo está')}{' '}<b>{tr('cerrado')}</b>{' '}{tr('y se conserva como histórico. Para registrar nueva información crea el siguiente periodo en')}{' '}<Link to={`${basePath}/cortes`}>{tr('Cortes mensuales')}</Link>.
    </div>
  );
}

import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// CORRECCIÓN 4 — Invitación para Capital Temporal para Rescate. Flujo
// INDEPENDIENTE de "Aumento de saldo operativo": aquí QLC (admin) siempre
// determina las instrucciones de depósito y devolución — el cliente solo
// acepta/rechaza, confirma su monto de participación y consulta el estado.
export default function CapitalRescuePage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = () => api.get('/client/capital-rescue').then(({ data }) => setData(data));
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="qlc-empty">{t('common.loading')}</div>;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const confirmParticipation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/client/capital-rescue/invitations/${data.invitation.id}/confirm-participation`, {
        amount: Number(amount),
      });
      flash(t('clientRescue.participationConfirmedOk'));
      setAmount('');
      setShowAcceptForm(false);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    await api.post(`/client/capital-rescue/invitations/${data.invitation.id}/reject`);
    flash(t('clientRescue.rejectedOk'));
    load();
  };

  const participation = data.participation;
  const items = participation?.distribution?.items || [];
  const total = items.reduce((sum, i) => sum + Number(i.amount), 0);

  let daysUsed = 0;
  if (participation?.depositConfirmedAt) {
    const end = participation.usageEndedAt ? new Date(participation.usageEndedAt).getTime() : now;
    daysUsed = Math.max(0, Math.floor((end - new Date(participation.depositConfirmedAt).getTime()) / 86400000));
  }
  const dailyRate = data.invitation ? Number(data.invitation.dailyRate) : 0;
  const capitalAmount = participation ? Number(participation.participationAmount) : 0;
  const accrued = Math.round(capitalAmount * (dailyRate / 100) * daysUsed * 100) / 100;

  return (
    <div>
      <div className="qlc-kicker">{t('clientRescue.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientRescue.title')}</h1>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      {data.state === 'BLOQUEADO' && (
        <div className="qlc-card" style={{ maxWidth: 640 }}>
          <span className="qlc-badge muted" style={{ fontSize: 13 }}>{t('clientRescue.blocked')}</span>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 12 }}>{t('clientRescue.blockedIntro')}</p>
        </div>
      )}

      {data.state === 'DESBLOQUEADO' && (
        <div className="qlc-card" style={{ maxWidth: 640 }}>
          <span className="qlc-badge ok" style={{ fontSize: 13 }}>{t('clientRescue.unlocked')}</span>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>{t('clientRescue.unlockedCopy')}</p>
          {data.invitation.message && (
            <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--qlc-muted)' }}>"{data.invitation.message}"</p>
          )}
          <div style={{ fontSize: 13, color: 'var(--qlc-muted)', marginBottom: 16 }}>
            <div>{t('clientRescue.requestedAmount')}: {String(data.invitation.requestedAmount)} USDT</div>
            <div>{t('clientRescue.dailyRate')}: {String(data.invitation.dailyRate)}%</div>
            <div>{t('clientRescue.modality')}: {t('clientRescue.modalityValue')}</div>
            <div>{t('clientRescue.participationLabel')}: {t('clientRescue.voluntary')}</div>
            <div>{t('clientRescue.expiresAt')}: {formatCdmxDate(data.invitation.expiresAt)}</div>
          </div>

          {!showAcceptForm ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="qlc-btn primary" onClick={() => setShowAcceptForm(true)}>
                {t('clientRescue.accept')}
              </button>
              <button className="qlc-btn ghost" onClick={() => setConfirmReject(true)}>
                {t('clientRescue.reject')}
              </button>
            </div>
          ) : (
            <form onSubmit={confirmParticipation} style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 8px' }}>{t('clientRescue.participationTitle')}</h4>
              <label className="qlc-label">{t('clientRescue.participationAmount')}</label>
              <input
                className="qlc-input"
                type="number"
                step="0.01"
                min="0.01"
                max={String(data.invitation.requestedAmount)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="qlc-btn primary" disabled={submitting}>
                  {submitting ? t('common.saving') : t('clientRescue.confirmParticipation')}
                </button>
                <button type="button" className="qlc-btn ghost" onClick={() => setShowAcceptForm(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {data.state === 'EN_PROCESO' && (
        <div className="qlc-card" style={{ maxWidth: 640 }}>
          <span className="qlc-badge warn" style={{ fontSize: 13 }}>{t('clientRescue.inProcess')}</span>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)', marginTop: 12 }}>{t('clientRescue.inProcessCopy')}</p>
          <div style={{ fontSize: 13 }}>
            <div>{t('clientRescue.participationAmount')}: {String(participation.participationAmount)} USDT</div>
          </div>
        </div>
      )}

      {data.state === 'PENDIENTE_DE_DEPOSITO' && (
        <div className="qlc-card" style={{ maxWidth: 720 }}>
          <span className="qlc-badge warn" style={{ fontSize: 13 }}>{t('clientRescue.pendingDeposit')}</span>
          <h3 style={{ marginTop: 14 }}>{t('clientRescue.depositInstructions')}</h3>
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('clientRescue.subaccount')}</th>
                  <th>{t('clientRescue.amountToDeposit')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.apiSubaccount?.identifier || t('clientSubaccounts.unassignedIdentifier')}</td>
                    <td>{String(i.amount)} USDT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, marginTop: 10 }}>
            <strong>{t('common.total') || 'Total'}:</strong> {total} USDT
          </p>
          <div className="qlc-guide-notice">{t('clientRescue.depositNotice')}</div>
        </div>
      )}

      {data.state === 'EN_UTILIZACION' && (
        <div className="qlc-card" style={{ maxWidth: 640 }}>
          <span className="qlc-badge warn" style={{ fontSize: 13 }}>{t('clientRescue.inUse')}</span>
          <div style={{ fontSize: 13, marginTop: 12 }}>
            <div>{t('clientRescue.contributedCapital')}: {capitalAmount} USDT</div>
            <div>{t('clientRescue.dailyRate')}: {dailyRate}%</div>
            <div>{t('clientRescue.daysUsed')}: {daysUsed}</div>
            <div>{t('clientRescue.accruedCompensation')}: {accrued} USDT</div>
            <div>{t('clientRescue.principalToRecover')}: {capitalAmount} USDT</div>
            <div>
              <strong>{t('clientRescue.economicTotal')}: {Math.round((capitalAmount + accrued) * 100) / 100} USDT</strong>
            </div>
          </div>
        </div>
      )}

      {(data.state === 'DISPONIBLE_PARA_DEVOLUCION' || data.state === 'FINALIZADA') && (
        <div className="qlc-card" style={{ maxWidth: 720 }}>
          <span className={`qlc-badge ${data.state === 'FINALIZADA' ? 'ok' : 'warn'}`} style={{ fontSize: 13 }}>
            {data.state === 'FINALIZADA' ? t('clientRescue.finalized') : t('clientRescue.availableForReturn')}
          </span>
          <h3 style={{ marginTop: 14 }}>{t('clientRescue.withdrawalInstructions')}</h3>
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('clientRescue.subaccount')}</th>
                  <th>{t('clientRescue.depositedCapital')}</th>
                  <th>{t('clientRescue.amountToWithdraw')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.apiSubaccount?.identifier || t('clientSubaccounts.unassignedIdentifier')}</td>
                    <td>{String(i.amount)} USDT</td>
                    <td>{String(i.amount)} USDT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 10 }}>{t('clientRescue.withdrawalNotice')}</p>

          {data.state === 'FINALIZADA' && (
            <div style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginTop: 14 }}>
              <h4 style={{ margin: '0 0 8px' }}>{t('clientRescue.compensationTitle')}</h4>
              <div style={{ fontSize: 13 }}>
                <div>{t('clientRescue.dailyRate')}: {dailyRate}%</div>
                <div>{t('clientRescue.daysUsed')}: {daysUsed}</div>
                <div>{t('clientRescue.accruedCompensation')}: {String(participation.remunerationAmount)} USDT</div>
                <div>{t('clientRescue.paymentWallet')}: {participation.remunerationWallet}</div>
                <div style={{ wordBreak: 'break-all' }}>{t('clientRescue.txHash')}: {participation.remunerationTxHash}</div>
                <div style={{ marginTop: 6 }}>
                  <span className="qlc-badge ok">{t('clientRescue.compensationPaid')}</span>
                </div>
              </div>
              {participation.comprobantePdfDriveFileId && (
                <a
                  className="qlc-btn primary"
                  style={{ marginTop: 12, display: 'inline-block' }}
                  href={`${API_BASE_URL}/client/capital-rescue/participations/${participation.id}/comprobante`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('clientRescue.downloadComprobante')}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {confirmReject && (
        <ConfirmModal
          title={t('clientRescue.rejectTitle')}
          message={t('clientRescue.rejectMessage')}
          confirmLabel={t('clientRescue.reject')}
          onClose={() => setConfirmReject(false)}
          onConfirm={reject}
        />
      )}
    </div>
  );
}

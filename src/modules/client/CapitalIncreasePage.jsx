import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

const BLOCK_SIZE = 20;

// CORRECCIÓN 7/8 — Invitación para aumento de saldo operativo. El cliente
// acepta/rechaza la invitación y, una vez autorizada por QLC, es el ÚNICO
// responsable de distribuir el monto entre sus propias subcuentas/API, en
// bloques de 20 USDT — QLC nunca hace esta distribución por el cliente.
export default function CapitalIncreasePage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [subaccounts, setSubaccounts] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/client/capital-increase').then(({ data }) => setData(data));
  useEffect(() => {
    load();
    api.get('/client/api-subaccounts').then(({ data }) => setSubaccounts(data.subaccounts));
  }, []);

  if (!data || !subaccounts) return <div className="qlc-empty">{t('common.loading')}</div>;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const accept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/client/capital-increase/invitations/${data.invitation.id}/accept`, { amount: Number(amount) });
      flash(t('clientCapitalIncrease.requestSentOk'));
      setAmount('');
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    await api.post(`/client/capital-increase/invitations/${data.invitation.id}/reject`);
    flash(t('clientCapitalIncrease.rejectedOk'));
    load();
  };

  const requestedAmount = data.request ? Number(data.request.requestedAmount) : 0;
  const items = data.request?.distribution?.items || [];
  const distributedTotal = items.reduce((sum, i) => sum + Number(i.amount), 0);
  const pending = requestedAmount - distributedTotal;
  const selectedIds = new Set(items.map((i) => i.apiSubaccountId));

  const toggleSubaccount = async (apiSubaccountId, currentlySelected) => {
    setTogglingId(apiSubaccountId);
    setError('');
    try {
      await api.post(`/client/capital-increase/requests/${data.request.id}/distribution/toggle`, {
        apiSubaccountId,
        selected: !currentlySelected,
      });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDistribution = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/client/capital-increase/requests/${data.request.id}/distribution/confirm`);
      flash(t('clientCapitalIncrease.distributionConfirmedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientCapitalIncrease.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientCapitalIncrease.title')}</h1>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      {data.state === 'BLOQUEADO' && (
        <div className="qlc-card" style={{ maxWidth: 640 }}>
          <span className="qlc-badge muted" style={{ fontSize: 13 }}>{t('clientCapitalIncrease.blocked')}</span>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 12 }}>{t('clientCapitalIncrease.blockedIntro')}</p>
        </div>
      )}

      {data.state === 'DESBLOQUEADO' && (
        <div className="qlc-card" style={{ maxWidth: 640 }}>
          <span className="qlc-badge ok" style={{ fontSize: 13 }}>{t('clientCapitalIncrease.unlocked')}</span>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>{t('clientCapitalIncrease.unlockedCopy')}</p>
          {data.invitation.message && (
            <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--qlc-muted)' }}>"{data.invitation.message}"</p>
          )}
          <div style={{ fontSize: 13, color: 'var(--qlc-muted)', marginBottom: 16 }}>
            <div>{t('clientCapitalIncrease.currentBalance')}: {String(data.invitation.currentBalance)} USDT</div>
            <div>{t('clientCapitalIncrease.maxAmount')}: {String(data.invitation.maxAmount)} USDT</div>
            <div>{t('clientCapitalIncrease.expiresAt')}: {formatCdmxDate(data.invitation.expiresAt)}</div>
          </div>
          <div className="qlc-guide-notice">{t('clientCapitalIncrease.blockRule')}</div>
          <form onSubmit={accept} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label className="qlc-label">{t('clientCapitalIncrease.requestedAmount')}</label>
              <input
                className="qlc-input"
                type="number"
                step={BLOCK_SIZE}
                min={BLOCK_SIZE}
                max={String(data.invitation.maxAmount)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <button className="qlc-btn primary" disabled={submitting}>
              {submitting ? t('common.saving') : t('clientCapitalIncrease.accept')}
            </button>
            <button type="button" className="qlc-btn ghost" onClick={() => setConfirmReject(true)}>
              {t('clientCapitalIncrease.reject')}
            </button>
          </form>
        </div>
      )}

      {data.state === 'SOLICITUD_EN_PROCESO' && (
        <div className="qlc-card" style={{ maxWidth: 640 }}>
          <span className="qlc-badge warn" style={{ fontSize: 13 }}>{t('clientCapitalIncrease.inProcess')}</span>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)', marginTop: 12 }}>
            {t('clientCapitalIncrease.inProcessCopy')}
          </p>
          <div style={{ fontSize: 13 }}>
            <div>{t('clientCapitalIncrease.requestedAmount')}: {String(data.request.requestedAmount)} USDT</div>
            <div>{t('clientCapitalIncrease.deadline')}: {formatCdmxDate(data.request.deadlineAt)}</div>
          </div>
        </div>
      )}

      {data.state === 'DISTRIBUCION_EN_PROCESO' && (
        <div className="qlc-card" style={{ maxWidth: 760 }}>
          <span className="qlc-badge ok" style={{ fontSize: 13 }}>{t('clientCapitalIncrease.readyToDistribute')}</span>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)', marginTop: 12 }}>{t('clientCapitalIncrease.distributeCopy')}</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, marginBottom: 16, flexWrap: 'wrap' }}>
            <span>{t('clientCapitalIncrease.available')}: <strong>{requestedAmount}</strong> USDT</span>
            <span>{t('clientCapitalIncrease.distributed')}: <strong>{distributedTotal}</strong> USDT</span>
            <span style={{ color: pending === 0 ? 'var(--qlc-ok)' : 'var(--qlc-gold)' }}>
              {t('clientCapitalIncrease.pending')}: <strong>{pending}</strong> USDT
            </span>
          </div>
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('clientCapitalIncrease.subaccount')}</th>
                  <th>{t('clientCapitalIncrease.operatorUser')}</th>
                  <th>{t('clientCapitalIncrease.amount')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subaccounts.map((s) => {
                  const selected = selectedIds.has(s.id);
                  const wouldExceed = !selected && distributedTotal + BLOCK_SIZE > requestedAmount;
                  return (
                    <tr key={s.id}>
                      <td>{t('clientSubaccounts.subaccountLabel')} #{s.slotIndex}</td>
                      <td>{s.identifier || t('clientSubaccounts.unassignedIdentifier')}</td>
                      <td>{selected ? `${BLOCK_SIZE} USDT` : '—'}</td>
                      <td>
                        <button
                          className={`qlc-btn ${selected ? 'ghost' : 'primary'}`}
                          disabled={togglingId === s.id || (wouldExceed && !selected)}
                          onClick={() => toggleSubaccount(s.id, selected)}
                        >
                          {selected ? t('clientCapitalIncrease.deselect') : t('clientCapitalIncrease.select')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            className="qlc-btn primary"
            style={{ marginTop: 14 }}
            disabled={pending !== 0 || submitting}
            onClick={() => setConfirmFinish(true)}
          >
            {t('clientCapitalIncrease.confirmDistribution')}
          </button>
        </div>
      )}

      {data.state === 'COMPLETADA' && (
        <div className="qlc-card" style={{ maxWidth: 720 }}>
          <span className="qlc-badge ok" style={{ fontSize: 13 }}>{t('clientCapitalIncrease.completed')}</span>
          <h3 style={{ marginTop: 14 }}>{t('clientCapitalIncrease.distributionInstructions')}</h3>
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('clientCapitalIncrease.subaccount')}</th>
                  <th>{t('clientCapitalIncrease.amount')}</th>
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
            <strong>{t('clientCapitalIncrease.totalDistributed')}:</strong> {distributedTotal} USDT
          </p>
        </div>
      )}

      {confirmReject && (
        <ConfirmModal
          title={t('clientCapitalIncrease.rejectTitle')}
          message={t('clientCapitalIncrease.rejectMessage')}
          confirmLabel={t('clientCapitalIncrease.reject')}
          onClose={() => setConfirmReject(false)}
          onConfirm={reject}
        />
      )}
      {confirmFinish && (
        <ConfirmModal
          title={t('clientCapitalIncrease.confirmDistributionTitle')}
          message={t('clientCapitalIncrease.confirmDistributionMessage')}
          confirmLabel={t('clientCapitalIncrease.confirmDistribution')}
          danger={false}
          onClose={() => setConfirmFinish(false)}
          onConfirm={confirmDistribution}
        />
      )}
    </div>
  );
}

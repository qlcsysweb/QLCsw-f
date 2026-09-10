import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// CORRECCIÓN 7 — Invitación para aumento de saldo operativo. El cliente
// nunca crea/modifica invitaciones, solicitudes ni distribuciones: solo
// responde a lo que QLC ya publicó (aceptar/rechazar/marcar como leído).
export default function CapitalIncreasePage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/client/capital-increase').then(({ data }) => setData(data));
  useEffect(() => {
    load();
  }, []);

  if (!data) return <div className="qlc-empty">{t('common.loading')}</div>;

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

  const markRead = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/client/capital-increase/requests/${data.request.id}/mark-read`);
      flash(t('clientCapitalIncrease.markedReadOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSubmitting(false);
    }
  };

  const items = data.request?.distribution?.items || [];
  const totalDistributed = items.reduce((sum, i) => sum + Number(i.amount), 0);

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
          <div style={{ fontSize: 13, color: 'var(--qlc-muted)', marginBottom: 16 }}>
            <div>{t('clientCapitalIncrease.currentBalance')}: {String(data.invitation.currentBalance)} USDT</div>
            <div>{t('clientCapitalIncrease.maxAmount')}: {String(data.invitation.maxAmount)} USDT</div>
            <div>{t('clientCapitalIncrease.expiresAt')}: {formatCdmxDate(data.invitation.expiresAt)}</div>
          </div>
          <form onSubmit={accept} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label className="qlc-label">{t('clientCapitalIncrease.requestedAmount')}</label>
              <input
                className="qlc-input"
                type="number"
                step="0.01"
                min="0.01"
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

      {(data.state === 'INSTRUCCIONES_EMITIDAS' || data.state === 'COMPLETADA') && (
        <div className="qlc-card" style={{ maxWidth: 720 }}>
          <span className={`qlc-badge ${data.state === 'COMPLETADA' ? 'ok' : 'warn'}`} style={{ fontSize: 13 }}>
            {data.state === 'COMPLETADA' ? t('clientCapitalIncrease.completed') : t('clientCapitalIncrease.instructionsReady')}
          </span>
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
            <strong>{t('clientCapitalIncrease.totalDistributed')}:</strong> {totalDistributed} USDT
          </p>
          {data.state === 'INSTRUCCIONES_EMITIDAS' ? (
            <button className="qlc-btn primary" style={{ marginTop: 10 }} onClick={markRead} disabled={submitting}>
              {submitting ? t('common.saving') : t('clientCapitalIncrease.markAsRead')}
            </button>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 10 }}>
              {t('clientCapitalIncrease.readAt')}: {formatCdmxDate(data.request.readAt)}
            </p>
          )}
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
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

const INVITATION_STATUS_CLASS = { DESBLOQUEADA: 'warn', ACEPTADA: 'ok', RECHAZADA: 'danger' };
const REQUEST_STATUS_CLASS = {
  EN_PROCESO: 'warn',
  DISTRIBUCION_EN_PROCESO: 'warn',
  INSTRUCCIONES_EMITIDAS: 'ok',
  COMPLETADA: 'ok',
};

// CORRECCIÓN 7/8 — Invitación para aumento de saldo operativo. El admin
// crea la invitación y, una vez que el cliente acepta, solo AUTORIZA la
// solicitud — la distribución entre subcuentas la realiza siempre el
// CLIENTE desde su propio panel (ver client/CapitalIncreasePage.jsx). El
// admin nunca escribe montos por subcuenta.
export default function CapitalIncreasePanel({ clientId }) {
  const { t, language } = useLanguage();
  const [state, setState] = useState(null);
  const [form, setForm] = useState({ currentBalance: '', maxAmount: '', validityDays: '10', message: '' });
  const [creating, setCreating] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get(`/admin/clients/${clientId}/capital-increase`).then(({ data }) => setState(data));
  useEffect(() => {
    load();
  }, [clientId]);

  if (!state) return null;

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const createInvitation = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post(`/admin/clients/${clientId}/capital-increase/invitations`, form);
      flash(t('adminCapitalIncrease.invitationCreated'));
      setForm({ currentBalance: '', maxAmount: '', validityDays: '10', message: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setCreating(false);
    }
  };

  const activeInvitation = state.invitations[0];
  const activeRequest = activeInvitation?.request;

  const authorizeRequest = async () => {
    setAuthorizing(true);
    setError('');
    try {
      await api.post(`/admin/capital-increase/requests/${activeRequest.id}/authorize`);
      flash(t('adminCapitalIncrease.authorizedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setAuthorizing(false);
    }
  };

  const distribution = activeRequest?.distribution;
  const distributedTotal = (distribution?.items || []).reduce((sum, i) => sum + Number(i.amount), 0);
  const requestedAmount = activeRequest ? Number(activeRequest.requestedAmount) : 0;

  return (
    <div className="qlc-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>{t('adminCapitalIncrease.title')}</h3>

      {message && <div style={{ color: 'var(--qlc-ok)', fontSize: 12, marginBottom: 10 }}>{message}</div>}
      {error && <div className="qlc-field-error">{error}</div>}

      {state.invitations.length > 0 && (
        <ul className="qlc-plain-list" style={{ marginBottom: 16 }}>
          {state.invitations.map((inv) => (
            <li key={inv.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8, borderBottom: '1px solid var(--qlc-line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {formatCdmxDate(inv.createdAt)} · {t('adminCapitalIncrease.maxAmount')}: {String(inv.maxAmount)} USDT
                </span>
                <span className={`qlc-badge ${INVITATION_STATUS_CLASS[inv.status] || 'muted'}`}>{inv.status}</span>
              </div>
              {inv.request && (
                <div style={{ fontSize: 12, color: 'var(--qlc-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t('adminCapitalIncrease.requestedAmount')}: {String(inv.request.requestedAmount)} USDT</span>
                  <span className={`qlc-badge ${REQUEST_STATUS_CLASS[inv.request.status] || 'muted'}`}>{inv.request.status}</span>
                </div>
              )}
              {inv.request?.status === 'EN_PROCESO' && inv.id === activeInvitation.id && (
                <button className="qlc-btn primary" style={{ marginTop: 6 }} disabled={authorizing} onClick={authorizeRequest}>
                  {authorizing ? t('common.saving') : t('adminCapitalIncrease.authorize')}
                </button>
              )}
              {inv.request?.status === 'DISTRIBUCION_EN_PROCESO' && (
                <div style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminCapitalIncrease.waitingClientDistribution')}</div>
              )}
              {distribution && distribution.items?.length > 0 && inv.id === activeInvitation.id && (
                <div style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
                  {t('adminCapitalIncrease.distributed')}: {distributedTotal} / {requestedAmount} USDT —{' '}
                  {distribution.items.map((item, idx) => (
                    <span key={item.id}>
                      {idx > 0 && ', '}
                      {item.apiSubaccount?.identifier || t('adminClientDetail.unassignedIdentifier')} ({String(item.amount)})
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {state.canCreateInvitation && (
        <form onSubmit={createInvitation} style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14 }}>
          <h4 style={{ margin: '0 0 8px' }}>{t('adminCapitalIncrease.newInvitation')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label className="qlc-label">{t('adminCapitalIncrease.currentBalance')}</label>
              <input className="qlc-input" type="number" step="0.01" value={form.currentBalance} onChange={(e) => setForm((f) => ({ ...f, currentBalance: e.target.value }))} required />
            </div>
            <div>
              <label className="qlc-label">{t('adminCapitalIncrease.maxAmount')}</label>
              <input className="qlc-input" type="number" step="0.01" value={form.maxAmount} onChange={(e) => setForm((f) => ({ ...f, maxAmount: e.target.value }))} required />
            </div>
            <div>
              <label className="qlc-label">{t('adminCapitalIncrease.validityDays')}</label>
              <input className="qlc-input" type="number" value={form.validityDays} onChange={(e) => setForm((f) => ({ ...f, validityDays: e.target.value }))} required />
            </div>
          </div>
          <label className="qlc-label">{t('adminCapitalIncrease.message')}</label>
          <textarea
            className="qlc-textarea"
            rows={2}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
          <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={creating}>
            {creating ? t('common.saving') : t('adminCapitalIncrease.sendInvitation')}
          </button>
        </form>
      )}
    </div>
  );
}

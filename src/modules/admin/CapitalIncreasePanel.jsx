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

// CORRECCIÓN 7 — Invitación para aumento de saldo operativo. Panel
// administrativo: crear invitaciones y construir/publicar la distribución
// de capital de una solicitud aceptada. El cliente NUNCA tiene acceso a
// estas acciones (ver frontend/src/modules/client/CapitalIncreasePage.jsx).
export default function CapitalIncreasePanel({ clientId, subaccounts }) {
  const { t, language } = useLanguage();
  const [state, setState] = useState(null);
  const [form, setForm] = useState({ currentBalance: '', maxAmount: '', validityDays: '10' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [itemForm, setItemForm] = useState({ apiSubaccountId: '', amount: '' });
  const [savingItem, setSavingItem] = useState(false);

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
      setForm({ currentBalance: '', maxAmount: '', validityDays: '10' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setCreating(false);
    }
  };

  const activeInvitation = state.invitations[0];
  const activeRequest = activeInvitation?.request;
  const distribution = activeRequest?.distribution;
  const showBuilder = activeRequest && !distribution?.publishedAt && activeRequest.status !== 'COMPLETADA';

  const startDistribution = async () => {
    await api.post(`/admin/capital-increase/requests/${activeRequest.id}/distribution`);
    load();
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setSavingItem(true);
    setError('');
    try {
      await api.post(`/admin/capital-increase/distributions/${distribution.id}/items`, {
        apiSubaccountId: itemForm.apiSubaccountId,
        amount: Number(itemForm.amount),
      });
      setItemForm({ apiSubaccountId: '', amount: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSavingItem(false);
    }
  };

  const removeItem = async (itemId) => {
    await api.delete(`/admin/capital-increase/items/${itemId}`);
    load();
  };

  const publish = async () => {
    try {
      await api.post(`/admin/capital-increase/distributions/${distribution.id}/publish`);
      flash(t('adminCapitalIncrease.publishedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  const distributedTotal = (distribution?.items || []).reduce((sum, i) => sum + Number(i.amount), 0);
  const requestedAmount = activeRequest ? Number(activeRequest.requestedAmount) : 0;
  const pending = requestedAmount - distributedTotal;

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
                <div style={{ fontSize: 12, color: 'var(--qlc-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('adminCapitalIncrease.requestedAmount')}: {String(inv.request.requestedAmount)} USDT</span>
                  <span className={`qlc-badge ${REQUEST_STATUS_CLASS[inv.request.status] || 'muted'}`}>{inv.request.status}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showBuilder && (
        <div style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 8px' }}>{t('adminCapitalIncrease.distributionBuilder')}</h4>
          {!distribution ? (
            <button className="qlc-btn primary" onClick={startDistribution}>
              {t('adminCapitalIncrease.startDistribution')}
            </button>
          ) : (
            <>
              <div style={{ fontSize: 13, marginBottom: 10, display: 'flex', gap: 16 }}>
                <span>{t('adminCapitalIncrease.requestedAmount')}: {requestedAmount} USDT</span>
                <span>{t('adminCapitalIncrease.distributed')}: {distributedTotal} USDT</span>
                <span style={{ color: pending === 0 ? 'var(--qlc-ok)' : 'var(--qlc-gold)' }}>
                  {t('adminCapitalIncrease.pending')}: {pending} USDT
                </span>
              </div>
              {distribution.items?.length > 0 && (
                <ul className="qlc-plain-list" style={{ marginBottom: 10 }}>
                  {distribution.items.map((item) => (
                    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.apiSubaccount?.identifier || t('adminClientDetail.unassignedIdentifier')} — {String(item.amount)} USDT</span>
                      <button className="qlc-btn ghost" onClick={() => removeItem(item.id)}>{t('common.delete')}</button>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={saveItem} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label className="qlc-label">{t('adminCapitalIncrease.subaccount')}</label>
                  <select
                    className="qlc-select"
                    value={itemForm.apiSubaccountId}
                    onChange={(e) => setItemForm((f) => ({ ...f, apiSubaccountId: e.target.value }))}
                    required
                  >
                    <option value="">—</option>
                    {(subaccounts || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.identifier || t('adminClientDetail.unassignedIdentifier')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="qlc-label">{t('adminCapitalIncrease.amount')}</label>
                  <input
                    className="qlc-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={itemForm.amount}
                    onChange={(e) => setItemForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>
                <button className="qlc-btn ghost" disabled={savingItem}>
                  {savingItem ? t('common.saving') : t('adminCapitalIncrease.addItem')}
                </button>
              </form>
              <button
                className="qlc-btn primary"
                style={{ marginTop: 12 }}
                disabled={pending !== 0 || !distribution.items?.length}
                onClick={publish}
              >
                {t('adminCapitalIncrease.publish')}
              </button>
            </>
          )}
        </div>
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
          <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={creating}>
            {creating ? t('common.saving') : t('adminCapitalIncrease.sendInvitation')}
          </button>
        </form>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

const INVITATION_STATUS_CLASS = { DESBLOQUEADA: 'warn', ACEPTADA: 'ok', RECHAZADA: 'danger' };
const PARTICIPATION_STATUS_CLASS = {
  EN_PROCESO: 'warn',
  PENDIENTE_DE_DEPOSITO: 'warn',
  EN_UTILIZACION: 'warn',
  DISPONIBLE_PARA_DEVOLUCION: 'warn',
  FINALIZADA: 'ok',
};

// CORRECCIÓN 4 — Invitación para Capital Temporal para Rescate. Panel
// administrativo: crear invitaciones y — a diferencia de "Aumento de saldo
// operativo" — construir/publicar aquí SÍ las instrucciones de depósito y,
// más adelante, confirmar depósito, finalizar el rescate y registrar la
// remuneración pagada al cliente.
export default function CapitalRescuePanel({ clientId, subaccounts }) {
  const { t, language } = useLanguage();
  const [state, setState] = useState(null);
  const [form, setForm] = useState({ apiSubaccountId: '', requestedAmount: '', dailyRate: '', validityDays: '10', message: '' });
  const [creating, setCreating] = useState(false);
  const [itemForm, setItemForm] = useState({ apiSubaccountId: '', amount: '' });
  const [savingItem, setSavingItem] = useState(false);
  const [remunerationForm, setRemunerationForm] = useState({ remunerationAmount: '', remunerationWallet: '', remunerationTxHash: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/admin/clients/${clientId}/capital-rescue`).then(({ data }) => setState(data));
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
      const payload = { ...form };
      if (!payload.apiSubaccountId) delete payload.apiSubaccountId;
      await api.post(`/admin/clients/${clientId}/capital-rescue/invitations`, payload);
      flash(t('adminRescue.invitationCreated'));
      setForm({ apiSubaccountId: '', requestedAmount: '', dailyRate: '', validityDays: '10', message: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setCreating(false);
    }
  };

  const activeInvitation = state.invitations[0];
  const participation = activeInvitation?.participation;
  const distribution = participation?.distribution;
  const showBuilder = participation && !distribution?.publishedAt && participation.status === 'EN_PROCESO';
  const distributedTotal = (distribution?.items || []).reduce((sum, i) => sum + Number(i.amount), 0);
  const participationAmount = participation ? Number(participation.participationAmount) : 0;
  const pending = participationAmount - distributedTotal;

  const startDistribution = async () => {
    await api.post(`/admin/capital-rescue/participations/${participation.id}/distribution`);
    load();
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setSavingItem(true);
    setError('');
    try {
      await api.post(`/admin/capital-rescue/distributions/${distribution.id}/items`, {
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
    await api.delete(`/admin/capital-rescue/items/${itemId}`);
    load();
  };

  const publish = async () => {
    try {
      await api.post(`/admin/capital-rescue/distributions/${distribution.id}/publish`);
      flash(t('adminRescue.publishedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  const confirmDeposit = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/capital-rescue/participations/${participation.id}/confirm-deposit`);
      flash(t('adminRescue.depositConfirmedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setBusy(false);
    }
  };

  const finalizeRescue = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/capital-rescue/participations/${participation.id}/finalize`);
      flash(t('adminRescue.finalizedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setBusy(false);
    }
  };

  const registerRemuneration = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(`/admin/capital-rescue/participations/${participation.id}/remuneration`, remunerationForm);
      flash(t('adminRescue.remunerationRegisteredOk'));
      setRemunerationForm({ remunerationAmount: '', remunerationWallet: '', remunerationTxHash: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qlc-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>{t('adminRescue.title')}</h3>

      {message && <div style={{ color: 'var(--qlc-ok)', fontSize: 12, marginBottom: 10 }}>{message}</div>}
      {error && <div className="qlc-field-error">{error}</div>}

      {state.invitations.length > 0 && (
        <ul className="qlc-plain-list" style={{ marginBottom: 16 }}>
          {state.invitations.map((inv) => (
            <li key={inv.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8, borderBottom: '1px solid var(--qlc-line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {formatCdmxDate(inv.createdAt)} · {t('adminRescue.requestedAmount')}: {String(inv.requestedAmount)} USDT · {String(inv.dailyRate)}%/día
                  {inv.apiSubaccount && ` · ${inv.apiSubaccount.identifier || t('adminClientDetail.unassignedIdentifier')}`}
                </span>
                <span className={`qlc-badge ${INVITATION_STATUS_CLASS[inv.status] || 'muted'}`}>{inv.status}</span>
              </div>
              {inv.participation && (
                <div style={{ fontSize: 12, color: 'var(--qlc-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('adminRescue.participationAmount')}: {String(inv.participation.participationAmount)} USDT</span>
                  <span className={`qlc-badge ${PARTICIPATION_STATUS_CLASS[inv.participation.status] || 'muted'}`}>{inv.participation.status}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showBuilder && (
        <div style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 8px' }}>{t('adminRescue.distributionBuilder')}</h4>
          {!distribution ? (
            <button className="qlc-btn primary" onClick={startDistribution}>
              {t('adminRescue.startDistribution')}
            </button>
          ) : (
            <>
              <div style={{ fontSize: 13, marginBottom: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>{t('adminRescue.participationAmount')}: {participationAmount} USDT</span>
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
                {t('adminRescue.publishInstructions')}
              </button>
            </>
          )}
        </div>
      )}

      {participation?.status === 'PENDIENTE_DE_DEPOSITO' && (
        <div style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginBottom: 14 }}>
          <button className="qlc-btn primary" disabled={busy} onClick={confirmDeposit}>
            {busy ? t('common.saving') : t('adminRescue.confirmDeposit')}
          </button>
        </div>
      )}

      {participation?.status === 'EN_UTILIZACION' && (
        <div style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginBottom: 14 }}>
          <button className="qlc-btn primary" disabled={busy} onClick={finalizeRescue}>
            {busy ? t('common.saving') : t('adminRescue.finalizeRescue')}
          </button>
        </div>
      )}

      {participation?.status === 'DISPONIBLE_PARA_DEVOLUCION' && (
        <form onSubmit={registerRemuneration} style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 8px' }}>{t('adminRescue.registerRemuneration')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="qlc-label">{t('adminRescue.remunerationAmount')}</label>
              <input
                className="qlc-input"
                type="number"
                step="0.01"
                value={remunerationForm.remunerationAmount}
                onChange={(e) => setRemunerationForm((f) => ({ ...f, remunerationAmount: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="qlc-label">{t('adminRescue.remunerationWallet')}</label>
              <input
                className="qlc-input"
                value={remunerationForm.remunerationWallet}
                onChange={(e) => setRemunerationForm((f) => ({ ...f, remunerationWallet: e.target.value }))}
                required
              />
            </div>
          </div>
          <label className="qlc-label">{t('adminRescue.remunerationTxHash')}</label>
          <input
            className="qlc-input"
            value={remunerationForm.remunerationTxHash}
            onChange={(e) => setRemunerationForm((f) => ({ ...f, remunerationTxHash: e.target.value }))}
            required
          />
          <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={busy}>
            {busy ? t('common.saving') : t('adminRescue.finalizeOperation')}
          </button>
        </form>
      )}

      {state.canCreateInvitation && (
        <form onSubmit={createInvitation} style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14 }}>
          <h4 style={{ margin: '0 0 8px' }}>{t('adminRescue.newInvitation')}</h4>
          <label className="qlc-label">{t('adminRescue.targetSubaccount')}</label>
          <select
            className="qlc-select"
            value={form.apiSubaccountId}
            onChange={(e) => setForm((f) => ({ ...f, apiSubaccountId: e.target.value }))}
          >
            <option value="">{t('adminRescue.noSpecificSubaccount')}</option>
            {(subaccounts || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.identifier || t('adminClientDetail.unassignedIdentifier')}
              </option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <label className="qlc-label">{t('adminRescue.requestedAmount')}</label>
              <input className="qlc-input" type="number" step="0.01" value={form.requestedAmount} onChange={(e) => setForm((f) => ({ ...f, requestedAmount: e.target.value }))} required />
            </div>
            <div>
              <label className="qlc-label">{t('adminRescue.dailyRate')}</label>
              <input className="qlc-input" type="number" step="0.01" value={form.dailyRate} onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))} required />
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
            {creating ? t('common.saving') : t('adminRescue.sendInvitation')}
          </button>
        </form>
      )}
    </div>
  );
}

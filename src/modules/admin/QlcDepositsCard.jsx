import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDate } from '../../utils/cdmxTime';
import usePolling from '../../hooks/usePolling';
import Modal from '../../components/Modal';

const money = (n) => `${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
const todayInput = () => new Date().toISOString().slice(0, 10);

/*
 * DEPÓSITOS QUE QLC REALIZA AL CLIENTE (admin, por subcuenta/API). Registro
 * administrativo: fecha, monto y referencia. El cliente lo ve en su subcuenta
 * y el afiliador directo en el historial de su referido. Nunca se borra: un
 * registro erróneo se anula con motivo.
 */
export default function QlcDepositsCard({ subaccountId }) {
  const { t, language } = useLanguage();
  const [deposits, setDeposits] = useState([]);
  const [form, setForm] = useState({ amount: '', depositedAt: todayInput(), reference: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [voiding, setVoiding] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const busyRef = useRef(false);

  const load = () =>
    api
      .get(`/admin/api-subaccounts/${subaccountId}/qlc-deposits`)
      .then(({ data }) => setDeposits(data.deposits))
      .catch(() => {});
  useEffect(() => {
    setDeposits([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subaccountId]);
  usePolling(load, 8000);

  const run = async (fn) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      return true;
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const ok = await run(() =>
      api.post(`/admin/api-subaccounts/${subaccountId}/qlc-deposits`, {
        amount: form.amount,
        depositedAt: new Date(`${form.depositedAt}T12:00:00`).toISOString(),
        reference: form.reference || undefined,
        note: form.note || undefined,
      })
    );
    if (ok) setForm({ amount: '', depositedAt: todayInput(), reference: '', note: '' });
  };

  const total = deposits.filter((d) => !d.voidedAt).reduce((s, d) => s + d.amount, 0);

  return (
    <div className="qlc-card">
      <h3 style={{ marginTop: 0 }}>{t('qlcDeposits.title')}</h3>
      <p style={{ fontSize: 12, color: 'var(--qlc-muted)', marginTop: -4 }}>{t('qlcDeposits.adminHint')}</p>
      <form onSubmit={submit}>
        <div className="qlc-aff-share-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div>
            <label className="qlc-label">{t('qlcDeposits.amount')}</label>
            <input className="qlc-input" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="qlc-label">{t('qlcDeposits.date')}</label>
            <input className="qlc-input" type="date" required max={todayInput()} value={form.depositedAt} onChange={(e) => setForm((f) => ({ ...f, depositedAt: e.target.value }))} />
          </div>
        </div>
        <label className="qlc-label">{t('qlcDeposits.reference')}</label>
        <input className="qlc-input" maxLength={200} value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
        <label className="qlc-label">{t('qlcDeposits.note')}</label>
        <input className="qlc-input" maxLength={500} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        {error && <p className="qlc-field-error">{error}</p>}
        <button type="submit" className="qlc-btn primary" style={{ marginTop: 10 }} disabled={busy}>
          {busy ? t('common.saving') : t('qlcDeposits.register')}
        </button>
      </form>

      <div style={{ marginTop: 14 }}>
        <div className="qlc-aff-section-title">
          {t('qlcDeposits.history')} · {t('qlcDeposits.total')}: {money(total)}
        </div>
        {deposits.length ? (
          <ul className="qlc-plain-list" style={{ margin: 0 }}>
            {deposits.map((d) => (
              <li key={d.id} className="qlc-history-item" style={{ flexWrap: 'wrap', gap: 6, opacity: d.voidedAt ? 0.55 : 1 }}>
                <span style={{ fontSize: 12, minWidth: 0 }}>
                  <strong>{formatCdmxDate(d.depositedAt)}</strong>
                  {d.reference ? ` · ${d.reference}` : ''}
                  {d.note ? <span style={{ color: 'var(--qlc-muted2)' }}> · {d.note}</span> : null}
                  {d.voidedAt && <span style={{ color: 'var(--qlc-danger)' }}> · {t('qlcDeposits.voided')}: {d.voidReason}</span>}
                </span>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  <strong style={{ textDecoration: d.voidedAt ? 'line-through' : 'none' }}>{money(d.amount)}</strong>
                  {!d.voidedAt && (
                    <button
                      type="button"
                      className="qlc-btn ghost"
                      disabled={busy}
                      onClick={() => {
                        setVoidReason('');
                        setVoiding(d);
                      }}
                    >
                      {t('qlcDeposits.void')}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="qlc-empty">{t('qlcDeposits.empty')}</div>
        )}
      </div>

      {voiding && (
        <Modal title={t('qlcDeposits.voidTitle')} onClose={() => setVoiding(null)} width={440}>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)', marginTop: 0 }}>
            {formatCdmxDate(voiding.depositedAt)} · {money(voiding.amount)}
          </p>
          <label className="qlc-label">{t('qlcDeposits.voidReason')}</label>
          <textarea className="qlc-textarea" rows={2} minLength={5} maxLength={300} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          {error && <p className="qlc-field-error">{error}</p>}
          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={() => setVoiding(null)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="qlc-btn danger"
              disabled={busy || voidReason.trim().length < 5}
              onClick={async () => {
                const ok = await run(() => api.patch(`/admin/qlc-deposits/${voiding.id}/void`, { reason: voidReason.trim() }));
                if (ok) setVoiding(null);
              }}
            >
              {t('qlcDeposits.void')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

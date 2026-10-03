import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDate } from '../../utils/cdmxTime';
import usePolling from '../../hooks/usePolling';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingScreen from '../../components/LoadingScreen';
import { money } from './AffiliatesPage';

const REF_BADGE = { ACTIVO: 'ok', EN_PROCESO: 'warn', INACTIVO: 'muted' };
const COMMISSION_BADGE = { PENDIENTE: 'warn', APROBADA: 'ok', PAGADA: 'ok', CANCELADA: 'muted' };
const todayInput = () => new Date().toISOString().slice(0, 10);

// Registrar comisión por UN referido directo de este promotor. El
// beneficiario no se elige: el backend lo determina con la relación
// guardada (afiliador directo del referido).
function CommissionModal({ promoter, referral, config, onClose, onCreated }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ concept: '', baseAmount: '', amount: '', occurredAt: todayInput(), notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const rate = config.commissionValue;
  const mode = rate == null ? 'MANUAL' : config.commissionType;

  const submit = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/affiliate-commissions', {
        referredClientId: referral.id,
        concept: form.concept,
        baseAmount: mode === 'PERCENTAGE' ? form.baseAmount : undefined,
        amount: mode === 'MANUAL' ? form.amount : undefined,
        occurredAt: form.occurredAt,
        notes: form.notes || undefined,
      });
      onCreated();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal title={t('adminAffiliates.modalTitle')} onClose={onClose} width={520}>
      <form onSubmit={submit}>
        <dl className="qlc-aff-dl" style={{ marginBottom: 10 }}>
          <dt>{t('adminAffiliates.beneficiary')}</dt>
          <dd>
            {promoter.firstName} {promoter.lastName} {promoter.affiliateCode ? `(${promoter.affiliateCode})` : ''}
          </dd>
          <dt>{t('adminAffiliates.referredClient')}</dt>
          <dd>
            {referral.firstName} {referral.lastName}
          </dd>
        </dl>
        <label className="qlc-label">{t('adminAffiliates.concept')}</label>
        <input
          className="qlc-input"
          value={form.concept}
          maxLength={200}
          required
          placeholder={t('adminAffiliates.conceptPlaceholder')}
          onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))}
        />
        {mode === 'PERCENTAGE' && (
          <>
            <label className="qlc-label">{t('adminAffiliates.baseAmount')}</label>
            <input className="qlc-input" type="number" min="0.01" step="0.01" required value={form.baseAmount} onChange={(e) => setForm((f) => ({ ...f, baseAmount: e.target.value }))} />
            <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>
              {t('adminAffiliates.baseHint').replace('{rate}', rate)}
              {form.baseAmount ? ` = ${money((Number(form.baseAmount) * rate) / 100)}` : ''}
            </p>
          </>
        )}
        {mode === 'FIXED_AMOUNT' && <p style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>{t('adminAffiliates.fixedHint').replace('{value}', rate)}</p>}
        {mode === 'MANUAL' && (
          <>
            <label className="qlc-label">{t('adminAffiliates.manualAmount')}</label>
            <input className="qlc-input" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>{t('adminAffiliates.manualHint')}</p>
          </>
        )}
        <label className="qlc-label">{t('adminAffiliates.occurredAt')}</label>
        <input className="qlc-input" type="date" required max={todayInput()} value={form.occurredAt} onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))} />
        <label className="qlc-label">{t('adminAffiliates.notes')}</label>
        <textarea className="qlc-textarea" rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        {error && <p className="qlc-field-error">{error}</p>}
        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="qlc-btn primary" disabled={saving}>
            {saving ? t('common.saving') : t('adminAffiliates.registerCommission')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AffiliateDetailPage() {
  const { clientId } = useParams();
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [commissionFor, setCommissionFor] = useState(null);
  const { copy, isCopied } = useCopyToClipboard();

  const load = () =>
    api
      .get(`/admin/affiliates/${clientId}`)
      .then(({ data: d }) => setData(d))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);
  usePolling(load, 8000);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const run = async (fn, okMessage) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
      if (okMessage) flash(okMessage);
      await load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!data) return error ? <div className="qlc-card">{error}</div> : <LoadingScreen />;
  const a = data.affiliate;
  const totals = a.commissionTotals;
  const setEnabled = (enabled) =>
    run(() => api.patch(`/admin/affiliates/${clientId}`, { enabled }), enabled ? t('adminAffiliates.enabledOk') : t('adminAffiliates.disabledOk'));
  const setCommissionStatus = (id, status) => run(() => api.patch(`/admin/affiliate-commissions/${id}`, { status }), t('adminAffiliates.statusUpdated'));

  return (
    <div>
      <Link to="/admin/affiliates" style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
        {t('adminAffiliates.back')}
      </Link>
      <div className="qlc-page-header" style={{ marginTop: 10 }}>
        <div>
          <div className="qlc-kicker">{t('adminAffiliates.detailKicker')}</div>
          <h1 style={{ margin: 0 }}>
            {a.firstName} {a.lastName}
          </h1>
        </div>
        <span className={`qlc-badge ${a.affiliateEnabled ? 'ok' : 'muted'}`}>
          {a.affiliateEnabled ? t('affiliate.statusActive') : t('affiliate.statusInactive')}
        </span>
      </div>
      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <div className="qlc-aff-grid" style={{ marginTop: 0 }}>
        <section className="qlc-card">
          <dl className="qlc-aff-dl">
            <dt>{t('adminAffiliates.code')}</dt>
            <dd>{a.affiliateCode ? <code>{a.affiliateCode}</code> : t('adminAffiliates.noCode')}</dd>
            <dt>{t('adminAffiliates.email')}</dt>
            <dd>{a.email}</dd>
            {a.affiliateCode && (
              <>
                <dt>{t('adminAffiliates.link')}</dt>
                <dd className="qlc-copy-row">
                  <code style={{ wordBreak: 'break-all' }}>{`${window.location.origin}/registro?ref=${a.affiliateCode}`}</code>
                  <button type="button" className="qlc-btn ghost qlc-copy-btn" onClick={() => copy(`${window.location.origin}/registro?ref=${a.affiliateCode}`, 'link')}>
                    {isCopied('link') ? t('common.copied') : t('common.copy')}
                  </button>
                </dd>
              </>
            )}
            <dt>{t('adminAffiliates.referredBy')}</dt>
            <dd>
              {a.referredBy ? (
                <Link to={`/admin/affiliates/${a.referredBy.id}`}>
                  {a.referredBy.firstName} {a.referredBy.lastName}
                  {a.referredBy.affiliateCode ? ` (${a.referredBy.affiliateCode})` : ''}
                </Link>
              ) : (
                t('adminAffiliates.noReferrer')
              )}
            </dd>
            <dt>{t('adminAffiliates.referrals')}</dt>
            <dd>{a.referrals.length}</dd>
            <dt>{t('adminAffiliates.statPending')}</dt>
            <dd>{money(totals.PENDIENTE + totals.APROBADA)}</dd>
            <dt>{t('adminAffiliates.statPaid')}</dt>
            <dd>{money(totals.PAGADA)}</dd>
          </dl>
          <div className="qlc-form-actions" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
            <Link className="qlc-btn ghost" to={`/admin/clients/${a.id}`}>
              {t('adminAffiliates.view')} →
            </Link>
            {a.affiliateEnabled ? (
              <button type="button" className="qlc-btn danger" disabled={busy} onClick={() => setConfirmDisable(true)}>
                {t('adminAffiliates.disable')}
              </button>
            ) : (
              <button type="button" className="qlc-btn primary" disabled={busy} onClick={() => setEnabled(true)}>
                {t('adminAffiliates.enable')}
              </button>
            )}
          </div>
        </section>

        <section className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminAffiliates.referralsTitle')}</h3>
          {a.referrals.length ? (
            <ul className="qlc-aff-list" style={{ gridTemplateColumns: '1fr' }}>
              {a.referrals.map((r) => (
                <li key={r.id}>
                  <Link to={`/admin/clients/${r.id}`}>
                    <strong>
                      {r.firstName} {r.lastName}
                    </strong>
                  </Link>
                  <div className="qlc-aff-meta">
                    <span>
                      {formatCdmxDate(r.createdAt)}
                      {r.referralSource ? ` · ${t(`adminAffiliates.source.${r.referralSource}`)}` : ''}
                    </span>
                    <span className={`qlc-badge ${REF_BADGE[r.status] || 'muted'}`}>{t(`affiliate.refStatus.${r.status}`)}</span>
                  </div>
                  <button type="button" className="qlc-btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setCommissionFor(r)}>
                    {t('adminAffiliates.registerCommission')}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="qlc-empty">{t('adminAffiliates.referralsEmpty')}</div>
          )}
        </section>
      </div>

      <section className="qlc-card" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>{t('adminAffiliates.commissionsTitle')}</h3>
        {a.commissions.length ? (
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('affiliate.date')}</th>
                  <th>{t('affiliate.referral')}</th>
                  <th>{t('affiliate.concept')}</th>
                  <th>{t('affiliate.amount')}</th>
                  <th>{t('affiliate.status')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {a.commissions.map((c) => (
                  <tr key={c.id}>
                    <td>{formatCdmxDate(c.occurredAt)}</td>
                    <td>
                      {c.referred.firstName} {c.referred.lastName}
                    </td>
                    <td>
                      {c.concept}
                      {c.commissionType === 'PERCENTAGE' && c.baseAmount != null && (
                        <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                          {Number(c.commissionValue)}% × {money(c.baseAmount)}
                        </div>
                      )}
                    </td>
                    <td>{money(c.amount)}</td>
                    <td>
                      <span className={`qlc-badge ${COMMISSION_BADGE[c.status]}`}>{t(`affiliate.commissionStatus.${c.status}`)}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {c.status === 'PENDIENTE' && (
                        <button type="button" className="qlc-btn primary" disabled={busy} onClick={() => setCommissionStatus(c.id, 'APROBADA')}>
                          {t('adminAffiliates.approve')}
                        </button>
                      )}
                      {c.status === 'APROBADA' && (
                        <button type="button" className="qlc-btn primary" disabled={busy} onClick={() => setCommissionStatus(c.id, 'PAGADA')}>
                          {t('adminAffiliates.markPaid')}
                        </button>
                      )}
                      {(c.status === 'PENDIENTE' || c.status === 'APROBADA') && (
                        <button type="button" className="qlc-btn ghost" disabled={busy} style={{ marginLeft: 6 }} onClick={() => setConfirmCancel(c)}>
                          {t('adminAffiliates.cancel')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="qlc-empty">{t('adminAffiliates.commissionsEmpty')}</div>
        )}
      </section>

      {confirmDisable && (
        <ConfirmModal
          title={t('adminAffiliates.disableTitle')}
          message={t('adminAffiliates.disableMessage')}
          confirmLabel={t('adminAffiliates.disable')}
          onClose={() => setConfirmDisable(false)}
          onConfirm={async () => {
            await api.patch(`/admin/affiliates/${clientId}`, { enabled: false });
            flash(t('adminAffiliates.disabledOk'));
            load();
          }}
        />
      )}
      {confirmCancel && (
        <ConfirmModal
          title={t('adminAffiliates.cancelTitle')}
          message={t('adminAffiliates.cancelMessage')}
          confirmLabel={t('adminAffiliates.cancel')}
          onClose={() => setConfirmCancel(null)}
          onConfirm={async () => {
            await api.patch(`/admin/affiliate-commissions/${confirmCancel.id}`, { status: 'CANCELADA' });
            flash(t('adminAffiliates.statusUpdated'));
            load();
          }}
        />
      )}
      {commissionFor && (
        <CommissionModal
          promoter={a}
          referral={commissionFor}
          config={data.config}
          onClose={() => setCommissionFor(null)}
          onCreated={() => {
            setCommissionFor(null);
            flash(t('adminAffiliates.created'));
            load();
          }}
        />
      )}
    </div>
  );
}

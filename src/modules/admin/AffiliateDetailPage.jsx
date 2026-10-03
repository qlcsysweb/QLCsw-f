import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDate, formatCdmxDateTime, formatDateOnly } from '../../utils/cdmxTime';
import usePolling from '../../hooks/usePolling';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import LoadingScreen from '../../components/LoadingScreen';
import AffiliateAttributionCard from './AffiliateAttributionCard';
import { money } from './AffiliatesPage';

const REF_BADGE = { ACTIVO: 'ok', EN_PROCESO: 'warn', INACTIVO: 'muted' };
const CONNECTION_BADGE = { CONECTADA: 'ok', PENDIENTE: 'warn', DESCONECTADA: 'danger' };
const COMMISSION_BADGE = { PENDIENTE: 'warn', APROBADA: 'ok', PAGADA: 'ok', CANCELADA: 'muted' };
const PAYMENT_BADGE = { PENDIENTE: 'warn', PROCESADO: 'warn', PAGADO: 'ok', RECHAZADO: 'danger' };
const todayInput = () => new Date().toISOString().slice(0, 10);

function useSubmitGuard() {
  const ref = useRef(false);
  const [busy, setBusy] = useState(false);
  const guard = async (fn) => {
    if (ref.current) return;
    ref.current = true;
    setBusy(true);
    try {
      await fn();
    } finally {
      ref.current = false;
      setBusy(false);
    }
  };
  return [busy, guard];
}

// AJUSTE justificado de comisión por un referido directo (las comisiones de
// cada periodo nacen al emitir el estado de cuenta). El beneficiario lo
// determina el backend con la relación guardada.
function AdjustmentModal({ promoter, referral, onClose, onCreated }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ concept: '', amount: '', occurredAt: todayInput(), notes: '' });
  const [error, setError] = useState('');
  const [busy, guard] = useSubmitGuard();

  const submit = (e) => {
    e.preventDefault();
    guard(async () => {
      setError('');
      try {
        await api.post('/admin/affiliate-commissions', { referredClientId: referral.id, ...form, notes: form.notes || undefined });
        onCreated();
      } catch (err) {
        setError(translateBackendMessage(err.message, language));
      }
    });
  };

  return (
    <Modal title={t('adminAffiliates.adjustmentTitle')} onClose={onClose} width={520}>
      <form onSubmit={submit}>
        <p style={{ fontSize: 12, color: 'var(--qlc-muted)', marginTop: 0 }}>{t('adminAffiliates.adjustmentHint')}</p>
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
        <label className="qlc-label">{t('adminAffiliates.justification')}</label>
        <input className="qlc-input" value={form.concept} minLength={10} maxLength={200} required onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))} />
        <label className="qlc-label">{t('adminAffiliates.amountLabel')}</label>
        <input className="qlc-input" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        <label className="qlc-label">{t('adminAffiliates.occurredAt')}</label>
        <input className="qlc-input" type="date" required max={todayInput()} value={form.occurredAt} onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))} />
        <label className="qlc-label">{t('adminAffiliates.notes')}</label>
        <textarea className="qlc-textarea" rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        {error && <p className="qlc-field-error">{error}</p>}
        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="qlc-btn primary" disabled={busy}>
            {busy ? t('common.saving') : t('adminAffiliates.adjustment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// REGISTRAR PAGO — agrupa comisiones APROBADAS; importe = suma; UID de
// destino = el que registró el afiliador. Comprobante opcional (Drive).
function PaymentModal({ promoter, commissions, onClose, onCreated }) {
  const { t, language } = useLanguage();
  const approved = commissions.filter((c) => c.status === 'APROBADA' && !c.paymentId);
  const [selected, setSelected] = useState(() => approved.map((c) => c.id));
  const [form, setForm] = useState({ periodLabel: '', reference: '', status: 'PENDIENTE' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, guard] = useSubmitGuard();
  const total = approved.filter((c) => selected.includes(c.id)).reduce((s, c) => s + Number(c.amount), 0);

  const submit = (e) => {
    e.preventDefault();
    guard(async () => {
      setError('');
      try {
        const fd = new FormData();
        fd.append('referrerClientId', promoter.id);
        fd.append('commissionIds', JSON.stringify(selected));
        fd.append('periodLabel', form.periodLabel);
        if (form.reference) fd.append('reference', form.reference);
        fd.append('status', form.status);
        if (file) fd.append('file', file);
        await api.post('/admin/affiliate-payments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        onCreated();
      } catch (err) {
        setError(translateBackendMessage(err.message, language));
      }
    });
  };

  return (
    <Modal title={t('adminAffiliates.paymentTitle')} onClose={onClose} width={560}>
      <form onSubmit={submit}>
        <dl className="qlc-aff-dl" style={{ marginBottom: 8 }}>
          <dt>{t('adminAffiliates.destinationUid')}</dt>
          <dd>{promoter.affiliateBitgetUid ? <code>{promoter.affiliateBitgetUid}</code> : <span style={{ color: 'var(--qlc-danger)' }}>{t('adminAffiliates.noUid')}</span>}</dd>
        </dl>
        <div className="qlc-aff-section-title">{t('adminAffiliates.selectCommissions')}</div>
        {approved.length ? (
          <ul className="qlc-aff-check-list">
            {approved.map((c) => (
              <li key={c.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))}
                  />
                  <span>
                    {c.concept} · {c.referred.firstName} {c.referred.lastName} — <strong>{money(c.amount)}</strong>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="qlc-empty">{t('adminAffiliates.noApproved')}</div>
        )}
        <p style={{ fontSize: 13, margin: '8px 0 0' }}>
          {t('adminAffiliates.total')}: <strong>{money(total)}</strong>
        </p>
        <label className="qlc-label">{t('adminAffiliates.periodLabel')}</label>
        <input className="qlc-input" required minLength={3} maxLength={120} value={form.periodLabel} placeholder={t('adminAffiliates.periodPlaceholder')} onChange={(e) => setForm((f) => ({ ...f, periodLabel: e.target.value }))} />
        <label className="qlc-label">{t('adminAffiliates.reference')}</label>
        <input className="qlc-input" maxLength={200} value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
        <label className="qlc-label">{t('adminAffiliates.initialStatus')}</label>
        <select className="qlc-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          {['PENDIENTE', 'PROCESADO', 'PAGADO'].map((s) => (
            <option key={s} value={s}>
              {t(`affiliate.paymentStatus.${s}`)}
            </option>
          ))}
        </select>
        <label className="qlc-label">{t('adminAffiliates.proof')}</label>
        <input className="qlc-input" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {error && <p className="qlc-field-error">{error}</p>}
        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="qlc-btn primary" disabled={busy || !selected.length || !promoter.affiliateBitgetUid}>
            {busy ? t('common.saving') : t('adminAffiliates.registerPayment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/*
 * AFFILIATE MANAGEMENT de UN cliente (QLC Affiliate Program §11): se usa
 * DENTRO de la ficha del cliente individual (embedded) y también en su ruta
 * propia. Liga, atribución (afiliador directo con nombre, liga y PCB),
 * referidos directos, comisiones, pagos y auditoría.
 */
export function AffiliateManagementPanel({ clientId, embedded = false, onChanged }) {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, guard] = useSubmitGuard();
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [adjustFor, setAdjustFor] = useState(null);
  const [paying, setPaying] = useState(false);
  const [viewingProof, setViewingProof] = useState(null);
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
  const run = (fn, ok) =>
    guard(async () => {
      setError('');
      try {
        await fn();
        if (ok) flash(ok);
        await load();
        onChanged?.();
      } catch (err) {
        setError(translateBackendMessage(err.message, language));
      }
    });

  if (!data) return error ? <div className="qlc-card">{error}</div> : <LoadingScreen />;
  const a = data.affiliate;
  const totals = a.commissionTotals;
  const link = a.affiliateCode ? `${window.location.origin}/registro?ref=${a.affiliateCode}` : null;

  const stateBadge = (
    <span className={`qlc-badge ${a.affiliateEnabled ? 'ok' : a.affiliateDisabledAt ? 'danger' : 'muted'}`}>
      {a.affiliateEnabled ? t('affiliate.stateActive') : a.affiliateDisabledAt ? t('affiliate.stateSuspended') : t('affiliate.stateNoLink')}
    </span>
  );

  return (
    <div>
      {embedded ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>{stateBadge}</div>
      ) : (
        <>
          <Link to="/admin/affiliates" style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
            {t('adminAffiliates.back')}
          </Link>
          <div className="qlc-page-header" style={{ marginTop: 10 }}>
            <div>
              <div className="qlc-kicker">{t('adminAffiliates.title')}</div>
              <h1 style={{ margin: 0 }}>
                {a.firstName} {a.lastName}
              </h1>
            </div>
            {stateBadge}
          </div>
        </>
      )}
      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <div className="qlc-aff-grid" style={{ marginTop: 0 }}>
        <section className="qlc-card">
          <dl className="qlc-aff-dl">
            <dt>{t('adminAffiliates.code')}</dt>
            <dd>{a.affiliateCode ? <code>{a.affiliateCode}</code> : t('adminAffiliates.noCode')}</dd>
            <dt>{t('adminAffiliates.email')}</dt>
            <dd>{a.email}</dd>
            <dt>ID</dt>
            <dd>
              <code>{a.id}</code>
            </dd>
            <dt>{t('adminAffiliates.uid')}</dt>
            <dd>
              {a.affiliateBitgetUid ? <code>{a.affiliateBitgetUid}</code> : '—'}
              {a.affiliateBitgetUidUpdatedAt && <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{formatCdmxDateTime(a.affiliateBitgetUidUpdatedAt)}</div>}
            </dd>
            <dt>{t('adminAffiliates.accounts')}</dt>
            <dd>{a.apiSubaccounts.map((s) => s.identifier).filter(Boolean).map((p) => <code key={p} style={{ marginRight: 6 }}>{p}</code>)}</dd>
            {link && (
              <>
                <dt>{t('adminAffiliates.link')}</dt>
                <dd className="qlc-copy-row">
                  <code style={{ wordBreak: 'break-all' }}>{link}</code>
                  <button type="button" className="qlc-btn ghost qlc-copy-btn" onClick={() => copy(link, 'link')}>
                    {isCopied('link') ? t('common.copied') : t('common.copy')}
                  </button>
                </dd>
              </>
            )}
            <dt>{t('adminAffiliates.referrals')}</dt>
            <dd>{a.referrals.length}</dd>
            <dt>{t('adminAffiliates.statPending')}</dt>
            <dd>{money(totals.PENDIENTE + totals.APROBADA)}</dd>
            <dt>{t('adminAffiliates.statPaid')}</dt>
            <dd>{money(totals.PAGADA)}</dd>
          </dl>
          <div className="qlc-form-actions" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
            {!embedded && (
              <Link className="qlc-btn ghost" to={`/admin/clients/${a.id}`}>
                {t('adminAffiliates.view')} →
              </Link>
            )}
            {a.affiliateCode && a.referrals.length === 0 && (
              <button type="button" className="qlc-btn ghost" disabled={busy} onClick={() => setConfirmRegenerate(true)}>
                {t('adminAffiliates.regenerate')}
              </button>
            )}
            {a.affiliateEnabled ? (
              <button type="button" className="qlc-btn danger" disabled={busy} onClick={() => setConfirmDisable(true)}>
                {t('adminAffiliates.disable')}
              </button>
            ) : (
              <button type="button" className="qlc-btn primary" disabled={busy} onClick={() => run(() => api.patch(`/admin/affiliates/${clientId}`, { enabled: true }), t('adminAffiliates.enabledOk'))}>
                {t('adminAffiliates.enable')}
              </button>
            )}
          </div>
        </section>
        <AffiliateAttributionCard affiliate={a} onChanged={() => { flash(t('adminAffiliates.corrected')); load(); }} />
      </div>

      <section className="qlc-card" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>{t('adminAffiliates.referralsTitle')}</h3>
        {a.referrals.length ? (
          <ul className="qlc-aff-list">
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
                {r.accounts.map((acc, i) => (
                  <div key={acc.pcb || i} className="qlc-aff-meta">
                    <code>{acc.pcb || (acc.principal ? t('affiliate.principal') : t('affiliate.pcbPending'))}</code>
                    <span className={`qlc-badge ${CONNECTION_BADGE[acc.connectionStatus] || 'muted'}`}>{t(`affiliate.connectionStatus.${acc.connectionStatus}`)}</span>
                  </div>
                ))}
                <button type="button" className="qlc-btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setAdjustFor(r)}>
                  {t('adminAffiliates.adjustment')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="qlc-empty">{t('adminAffiliates.referralsEmpty')}</div>
        )}
      </section>

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
                      <span className="qlc-badge muted" style={{ marginRight: 6 }}>
                        {c.statementId ? t('adminAffiliates.fromStatement') : t('adminAffiliates.manual')}
                      </span>
                      {c.concept}
                      {c.periodStart && (
                        <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                          {formatDateOnly(c.periodStart)} – {formatDateOnly(c.periodEnd)}
                          {c.baseAmount != null ? ` · ${Number(c.commissionValue)}% × ${money(c.baseAmount)}` : ''}
                        </div>
                      )}
                    </td>
                    <td>{money(c.amount)}</td>
                    <td>
                      <span className={`qlc-badge ${COMMISSION_BADGE[c.status]}`}>{t(`affiliate.commissionStatus.${c.status}`)}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {c.status === 'PENDIENTE' && (
                        <button type="button" className="qlc-btn primary" disabled={busy} onClick={() => run(() => api.patch(`/admin/affiliate-commissions/${c.id}`, { status: 'APROBADA' }), t('adminAffiliates.statusUpdated'))}>
                          {t('adminAffiliates.approve')}
                        </button>
                      )}
                      {(c.status === 'PENDIENTE' || c.status === 'APROBADA') && !c.paymentId && (
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

      <section className="qlc-card" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>{t('adminAffiliates.paymentsTitle')}</h3>
          <button type="button" className="qlc-btn primary" onClick={() => setPaying(true)}>
            {t('adminAffiliates.registerPayment')}
          </button>
        </div>
        {a.payments.length ? (
          <div className="qlc-table-wrap" style={{ marginTop: 12 }}>
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('affiliate.payDate')}</th>
                  <th>{t('affiliate.payPeriod')}</th>
                  <th>{t('affiliate.payAmount')}</th>
                  <th>{t('affiliate.payUid')}</th>
                  <th>{t('affiliate.payStatusLabel')}</th>
                  <th>{t('affiliate.payProof')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {a.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatCdmxDateTime(p.paidAt || p.createdAt)}</td>
                    <td>{p.periodLabel}</td>
                    <td>
                      {money(p.amount)}
                      <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{p.commissionsCount} ×</div>
                    </td>
                    <td>
                      <code>{p.destinationUid || '—'}</code>
                    </td>
                    <td>
                      <span className={`qlc-badge ${PAYMENT_BADGE[p.status]}`}>{t(`affiliate.paymentStatus.${p.status}`)}</span>
                    </td>
                    <td>
                      {p.hasProof ? (
                        <button type="button" className="qlc-link-btn" onClick={() => setViewingProof({ url: `/admin/affiliate-payments/${p.id}/proof`, fileName: p.proofFileName || 'comprobante' })}>
                          {t('affiliate.viewProof')}
                        </button>
                      ) : (
                        p.reference || '—'
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {p.status === 'PENDIENTE' && (
                        <button type="button" className="qlc-btn ghost" disabled={busy} onClick={() => run(() => api.patch(`/admin/affiliate-payments/${p.id}`, { status: 'PROCESADO' }), t('adminAffiliates.paymentUpdated'))}>
                          {t('adminAffiliates.markProcessed')}
                        </button>
                      )}
                      {(p.status === 'PENDIENTE' || p.status === 'PROCESADO') && (
                        <>
                          <button type="button" className="qlc-btn primary" disabled={busy} style={{ marginLeft: 6 }} onClick={() => run(() => api.patch(`/admin/affiliate-payments/${p.id}`, { status: 'PAGADO' }), t('adminAffiliates.paymentUpdated'))}>
                            {t('adminAffiliates.markPaidPayment')}
                          </button>
                          <button type="button" className="qlc-btn ghost" disabled={busy} style={{ marginLeft: 6 }} onClick={() => run(() => api.patch(`/admin/affiliate-payments/${p.id}`, { status: 'RECHAZADO' }), t('adminAffiliates.paymentUpdated'))}>
                            {t('adminAffiliates.reject')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="qlc-empty" style={{ marginTop: 12 }}>{t('affiliate.paymentsEmpty')}</div>
        )}
      </section>

      {a.audit.length > 0 && (
        <section className="qlc-card" style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>{t('adminAffiliates.auditTitle')}</h3>
          <ul className="qlc-plain-list" style={{ fontSize: 12 }}>
            {a.audit.map((e) => (
              <li key={e.id} className="qlc-history-item" style={{ flexWrap: 'wrap', gap: 6 }}>
                <span>
                  <code>{e.action}</code> · {formatCdmxDateTime(e.createdAt)}
                </span>
                {e.details && <span style={{ color: 'var(--qlc-muted2)', wordBreak: 'break-word' }}>{JSON.stringify(e.details)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

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
      {confirmRegenerate && (
        <ConfirmModal
          title={t('adminAffiliates.regenerateTitle')}
          message={t('adminAffiliates.regenerateMessage')}
          confirmLabel={t('adminAffiliates.regenerate')}
          onClose={() => setConfirmRegenerate(false)}
          onConfirm={async () => {
            await api.post(`/admin/affiliates/${clientId}/regenerate-code`);
            flash(t('adminAffiliates.regenerated'));
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
      {adjustFor && (
        <AdjustmentModal
          promoter={a}
          referral={adjustFor}
          onClose={() => setAdjustFor(null)}
          onCreated={() => {
            setAdjustFor(null);
            flash(t('adminAffiliates.created'));
            load();
          }}
        />
      )}
      {paying && (
        <PaymentModal
          promoter={a}
          commissions={a.commissions}
          onClose={() => setPaying(false)}
          onCreated={() => {
            setPaying(false);
            flash(t('adminAffiliates.paymentCreated'));
            load();
          }}
        />
      )}
      {viewingProof && <DocumentViewerModal url={viewingProof.url} fileName={viewingProof.fileName} onClose={() => setViewingProof(null)} />}
    </div>
  );
}

export default function AffiliateDetailPage() {
  const { clientId } = useParams();
  return <AffiliateManagementPanel clientId={clientId} />;
}

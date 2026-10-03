import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDate, formatCdmxDateTime, formatDateOnly } from '../../utils/cdmxTime';
import usePolling from '../../hooks/usePolling';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import Modal from '../../components/Modal';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import LoadingScreen from '../../components/LoadingScreen';

const REF_BADGE = { ACTIVO: 'ok', EN_PROCESO: 'warn', INACTIVO: 'muted' };
const CONNECTION_BADGE = { CONECTADA: 'ok', PENDIENTE: 'warn', DESCONECTADA: 'danger' };
const MILESTONE_BADGE = { CONFIRMED: 'ok', PENDING: 'muted', REJECTED: 'danger' };
const COMMISSION_BADGE = { PENDIENTE: 'warn', APROBADA: 'ok', PAGADA: 'ok', CANCELADA: 'muted' };
const PAYMENT_BADGE = { PENDIENTE: 'warn', PROCESADO: 'warn', PAGADO: 'ok', RECHAZADO: 'danger' };
const STATE_BADGE = { ACTIVO: 'ok', SUSPENDIDO: 'danger', SIN_LIGA: 'muted' };
export const money = (n) => `${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

// Una cuenta/API del referido: PCB, terminación de API Key (solo referencia
// visual), estado administrativo, hitos, capital confirmado e historial
// registrado por QLC. Nada de esto es una consulta a Bitget.
// COMISIONES INDIVIDUALES (por API o ajustes del referido): totales por
// estado y su historial, dentro de la ficha de cada referido.
function CommissionBlock({ commissions, t, title }) {
  const [open, setOpen] = useState(false);
  const { totals, history } = commissions;
  return (
    <div className="qlc-aff-commissions">
      <div className="qlc-aff-section-title">{title}</div>
      <div className="qlc-aff-totals">
        <div>
          <span className="qlc-stat-label">{t('affiliate.pending')}</span>
          <strong>{money(totals.PENDIENTE)}</strong>
        </div>
        <div>
          <span className="qlc-stat-label">{t('affiliate.approved')}</span>
          <strong>{money(totals.APROBADA)}</strong>
        </div>
        <div>
          <span className="qlc-stat-label">{t('affiliate.paid')}</span>
          <strong>{money(totals.PAGADA)}</strong>
        </div>
      </div>
      {history.length > 0 && (
        <button type="button" className="qlc-btn ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? t('affiliate.hideHistory') : t('affiliate.viewHistory')}
        </button>
      )}
      {open && (
        <ul className="qlc-plain-list" style={{ marginTop: 10 }}>
          {history.map((c) => (
            <li key={c.id} className="qlc-history-item" style={{ flexWrap: 'wrap', gap: 6 }}>
              <span style={{ minWidth: 0, fontSize: 12 }}>
                <strong>{c.concept}</strong>
                <br />
                <span style={{ color: 'var(--qlc-muted)' }}>{formatCdmxDate(c.occurredAt)}</span>
              </span>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <strong>{money(c.amount)}</strong>
                <span className={`qlc-badge ${COMMISSION_BADGE[c.status]}`}>{t(`affiliate.commissionStatus.${c.status}`)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// REFERIDO CONTRAÍBLE — encabezado compacto (iniciales, estado, fecha y
// número de cuentas); al desplegarlo se ven sus cuentas/API con su estado,
// saldo registrado, hitos, historial y comisiones. Ahorra espacio entre
// referido y referido.
function ReferralCard({ referral, t }) {
  const [open, setOpen] = useState(false);
  const r = referral;
  const pending = r.accounts.reduce((sum, a) => sum + a.commissions.totals.PENDIENTE + a.commissions.totals.APROBADA, 0) + r.adjustments.totals.PENDIENTE + r.adjustments.totals.APROBADA;
  return (
    <li className={`qlc-aff-referral${open ? ' is-open' : ''}`}>
      <button type="button" className="qlc-aff-referral-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={`qlc-collapsible-chevron${open ? ' open' : ''}`} aria-hidden="true">
          ▾
        </span>
        <strong className="qlc-aff-referral-initials">{r.initials}</strong>
        <span className="qlc-aff-referral-meta">
          {t('affiliate.registered')}: {formatCdmxDate(r.registeredAt)} · {r.accounts.length} {t('affiliate.accountsLabel')}
          {pending > 0 ? ` · ${t('affiliate.pending')}: ${money(pending)}` : ''}
        </span>
        <span className={`qlc-badge ${REF_BADGE[r.status] || 'muted'}`}>{t(`affiliate.refStatus.${r.status}`)}</span>
      </button>
      {open && (
        <div className="qlc-aff-referral-body">
          {r.accounts.length ? (
            r.accounts.map((a, i) => <ReferralAccount key={a.pcb || `acc-${i}`} account={a} t={t} />)
          ) : (
            <div className="qlc-empty">{t('affiliate.noAccounts')}</div>
          )}
          {r.adjustments.history.length > 0 && <CommissionBlock commissions={r.adjustments} t={t} title={t('affiliate.adjustmentsTitle')} />}
        </div>
      )}
    </li>
  );
}

function ReferralAccount({ account, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="qlc-aff-account">
      <div className="qlc-aff-account-head">
        <strong>{account.pcb || (account.principal ? t('affiliate.principal') : t('affiliate.pcbPending'))}</strong>
        <span className="qlc-aff-api">
          {t('affiliate.apiLabel')}: {account.apiKeyTail || t('affiliate.apiNotRegistered')}
        </span>
      </div>
      <dl className="qlc-aff-dl">
        <dt>{t('affiliate.connection')}</dt>
        <dd>
          <span className={`qlc-badge ${CONNECTION_BADGE[account.connectionStatus] || 'muted'}`}>
            {t(`affiliate.connectionStatus.${account.connectionStatus}`)}
          </span>
        </dd>
        {/* SALDO REGISTRADO por QLC (último estado de cuenta o capital
            confirmado) con su fecha administrativa. Si no existe o superó la
            antigüedad configurada: "Sin actualizar" (nunca un dato viejo
            presentado como vigente, y nunca una consulta al exchange). */}
        <dt>{t('affiliate.registeredBalance')}</dt>
        <dd>
          {account.registeredBalance?.fresh ? (
            <>
              <strong>{money(account.registeredBalance.amount)}</strong>
              <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                {t(`affiliate.balanceSource.${account.registeredBalance.source}`)} · {t('affiliate.lastUpdate')}:{' '}
                {formatCdmxDateTime(account.registeredBalance.updatedAt)}
              </div>
            </>
          ) : (
            <>
              <span className="qlc-badge muted">{t('affiliate.notUpdated')}</span>
              {account.registeredBalance && (
                <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                  {t('affiliate.lastRecord')}: {formatCdmxDateTime(account.registeredBalance.updatedAt)}
                </div>
              )}
            </>
          )}
        </dd>
        <dt>{t('affiliate.confirmedCapital')}</dt>
        <dd>
          {account.confirmedCapital ? (
            <>
              <strong>{money(account.confirmedCapital.amount)}</strong>
              <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                {t('affiliate.lastUpdate')}: {formatCdmxDateTime(account.confirmedCapital.updatedAt)}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--qlc-muted2)' }}>{t('affiliate.noRecord')}</span>
          )}
        </dd>
      </dl>
      <ul className="qlc-aff-milestones">
        {account.milestones.map((m) => (
          <li key={m.type}>
            <span>{t(`affiliate.milestone.${m.type}`)}</span>
            <span className={`qlc-badge ${MILESTONE_BADGE[m.status] || 'muted'}`} title={m.updatedAt ? formatCdmxDate(m.updatedAt) : undefined}>
              {t(`affiliate.milestoneStatus.${m.status}`)}
            </span>
          </li>
        ))}
      </ul>
      <CommissionBlock commissions={account.commissions} t={t} title={t('affiliate.accountCommissions')} />
      <button type="button" className="qlc-btn ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? t('affiliate.accountHideHistory') : t('affiliate.accountHistory')}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <div className="qlc-aff-section-title">{t('affiliate.accountHistoryTitle')}</div>
          {account.history.length ? (
            <div className="qlc-table-wrap">
              <table className="qlc-table">
                <thead>
                  <tr>
                    <th>{t('affiliate.depositDateTime')}</th>
                    <th>{t('affiliate.movementType')}</th>
                    <th>{t('affiliate.amount')}</th>
                    <th>{t('affiliate.orderNumber')}</th>
                  </tr>
                </thead>
                <tbody>
                  {account.history.map((h, i) => (
                    <tr key={`${h.type}-${h.date}-${i}`}>
                      <td>{formatCdmxDateTime(h.date)}</td>
                      <td>{t(`affiliate.movement.${h.type}`)}</td>
                      <td>{money(h.amount)}</td>
                      <td>{h.orderNumber ? <code>{h.orderNumber}</code> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="qlc-empty">{t('affiliate.accountHistoryEmpty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * AFFILIATE DASHBOARD (QLC Affiliate Program). Datos reales del backend,
 * todos registrados/confirmados por QLC dentro de la plataforma.
 */
export default function AffiliatePage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [uidInput, setUidInput] = useState('');
  const [editingUid, setEditingUid] = useState(false);
  const [qr, setQr] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);
  const { copy, isCopied } = useCopyToClipboard();

  const load = () =>
    api
      .get('/client/affiliate')
      .then(({ data: d }) => {
        setData(d);
        setError('');
      })
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Cambios del ADMIN (estado de API, capital, activación, comisiones, pagos)
  // y nuevos referidos aparecen sin F5. Solo lectura de NeonDB.
  usePolling(load, 8000);

  if (!data) return error ? <div className="qlc-card">{error}</div> : <LoadingScreen />;

  const { affiliate, program, stats, referrals, commissions, payments } = data;
  const link = affiliate.code ? `${window.location.origin}/registro?ref=${encodeURIComponent(affiliate.code)}` : null;
  const showUidForm = !affiliate.bitgetUid || editingUid;

  const run = async (fn, ok) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
      if (ok) {
        setMessage(ok);
        setTimeout(() => setMessage(''), 3000);
      }
      await load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const saveUid = (e) => {
    e.preventDefault();
    run(async () => {
      await api.put('/client/affiliate/uid', { bitgetUid: uidInput.trim() });
      setEditingUid(false);
    }, t('affiliate.uidSaved'));
  };

  const openQr = async () => {
    setQr('loading');
    try {
      const { data: d } = await api.get('/client/affiliate/qr', { params: { origin: window.location.origin } });
      setQr(d);
    } catch {
      setQr('error');
    }
  };

  const totals = commissions.totals;

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">{t('affiliate.nav')}</div>
          <h1 style={{ margin: 0 }}>{t('affiliate.dashboard')}</h1>
        </div>
        <span className={`qlc-badge ${STATE_BADGE[affiliate.state] || 'muted'}`}>
          {affiliate.state === 'ACTIVO' ? t('affiliate.stateActive') : affiliate.state === 'SUSPENDIDO' ? t('affiliate.stateSuspended') : t('affiliate.stateNoLink')}
        </span>
      </div>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: -8 }}>{t('affiliate.intro')}</p>
      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <section className="qlc-card qlc-aff-hero">
        <div style={{ minWidth: 0 }}>
          <div className="qlc-aff-section-title">{t('affiliate.myLink')}</div>
          {affiliate.enabled && link ? (
            <>
              <p style={{ margin: 0, color: 'var(--qlc-muted)', fontSize: 13 }}>{t('affiliate.linkHint')}</p>
              <div className="qlc-aff-link-row">
                <code className="qlc-aff-link" title={link}>{link}</code>
                <button type="button" className="qlc-btn primary" onClick={() => copy(link, 'aff-link')}>
                  {isCopied('aff-link') ? t('affiliate.copied') : t('affiliate.copy')}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>{t('affiliate.codeLabel')}:</span>
                <code style={{ color: 'var(--qlc-blue2)' }}>{affiliate.code}</code>
                <button type="button" className="qlc-btn ghost" onClick={openQr}>
                  {t('affiliate.viewQr')}
                </button>
              </div>
              {!program.enabled && <p style={{ fontSize: 12, color: 'var(--qlc-warn)', margin: '10px 0 0' }}>{t('affiliate.programInactive')}</p>}
            </>
          ) : affiliate.state === 'SUSPENDIDO' ? (
            <p style={{ color: 'var(--qlc-muted)', margin: 0 }}>{t('affiliate.disabledByAdmin')}</p>
          ) : !program.enabled ? (
            <p style={{ color: 'var(--qlc-muted)', margin: 0 }}>{t('affiliate.programInactive')}</p>
          ) : (
            <>
              <p style={{ color: 'var(--qlc-muted)', margin: '0 0 12px', fontSize: 13 }}>{t('affiliate.notActiveText')}</p>
              {!affiliate.bitgetUid && <p style={{ fontSize: 12, color: 'var(--qlc-warn)', margin: '0 0 10px' }}>{t('affiliate.uidRequired')}</p>}
              <button
                type="button"
                className="qlc-btn primary"
                disabled={busy || !affiliate.canActivate}
                onClick={() => run(() => api.post('/client/affiliate/activate'))}
              >
                {busy ? t('affiliate.activating') : t('affiliate.createLink')}
              </button>
            </>
          )}
        </div>

        <div className="qlc-aff-code-box">
          <div>
            <div className="qlc-aff-section-title">{t('affiliate.uidTitle')}</div>
            {showUidForm ? (
              <form onSubmit={saveUid}>
                <input
                  className="qlc-input"
                  inputMode="numeric"
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value.replace(/\D/g, '').slice(0, 20))}
                  placeholder={t('affiliate.uidPlaceholder')}
                  required
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="submit" className="qlc-btn primary" disabled={busy || uidInput.trim().length < 5}>
                    {t('affiliate.uidSave')}
                  </button>
                  {affiliate.bitgetUid && (
                    <button type="button" className="qlc-btn ghost" onClick={() => setEditingUid(false)}>
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <>
                <div className="qlc-aff-code">{affiliate.bitgetUid}</div>
                {affiliate.bitgetUidUpdatedAt && (
                  <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                    {t('affiliate.uidUpdated')}: {formatCdmxDateTime(affiliate.bitgetUidUpdatedAt)}
                  </div>
                )}
                <button
                  type="button"
                  className="qlc-btn ghost"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setUidInput(affiliate.bitgetUid);
                    setEditingUid(true);
                  }}
                >
                  {t('affiliate.uidEdit')}
                </button>
              </>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: 0 }}>{t('affiliate.uidHint')}</p>
        </div>
      </section>

      <div className="qlc-stat-grid">
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('affiliate.myAffiliates')}</span>
          <span className="qlc-stat-value">{stats.referred}</span>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('affiliate.activeAffiliates')}</span>
          <span className="qlc-stat-value">{stats.active}</span>
          <span className="qlc-stat-hint">{t('affiliate.activeHint')}</span>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('affiliate.pending')}</span>
          <span className="qlc-stat-value" style={{ fontSize: 20 }}>{money(totals.PENDIENTE + totals.APROBADA)}</span>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('affiliate.paid')}</span>
          <span className="qlc-stat-value" style={{ fontSize: 20 }}>{money(totals.PAGADA)}</span>
        </div>
      </div>

      <section className="qlc-card" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>{t('affiliate.referralsTitle')}</h3>
        <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -6 }}>{t('affiliate.registeredDataNote')}</p>
        {referrals.length ? (
          <ul className="qlc-aff-referral-list">
            {referrals.map((r) => (
              <ReferralCard key={r.key} referral={r} t={t} />
            ))}
          </ul>
        ) : (
          <div className="qlc-empty">{t('affiliate.referralsEmpty')}</div>
        )}
      </section>

      <div style={{ marginTop: 18 }}>
        <section className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('affiliate.paymentsTitle')}</h3>
          {payments.length ? (
            <div className="qlc-table-wrap">
              <table className="qlc-table">
                <thead>
                  <tr>
                    <th>{t('affiliate.payDate')}</th>
                    <th>{t('affiliate.payPeriod')}</th>
                    <th>{t('affiliate.payAmount')}</th>
                    <th>{t('affiliate.payUid')}</th>
                    <th>{t('affiliate.payStatusLabel')}</th>
                    <th>{t('affiliate.payProof')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{formatCdmxDateTime(p.paidAt || p.createdAt)}</td>
                      <td>{p.periodLabel}</td>
                      <td>{money(p.amount)}</td>
                      <td>
                        <code>{p.destinationUid || '—'}</code>
                      </td>
                      <td>
                        <span className={`qlc-badge ${PAYMENT_BADGE[p.status]}`}>{t(`affiliate.paymentStatus.${p.status}`)}</span>
                      </td>
                      <td>
                        {p.hasProof ? (
                          <button
                            type="button"
                            className="qlc-link-btn"
                            onClick={() => setViewingProof({ url: `/client/affiliate/payments/${p.id}/proof`, fileName: p.proofFileName || 'comprobante' })}
                          >
                            {t('affiliate.viewProof')}
                          </button>
                        ) : (
                          p.reference || '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="qlc-empty">{t('affiliate.paymentsEmpty')}</div>
          )}
        </section>

      </div>

      {qr && (
        <Modal title={t('affiliate.qrTitle')} onClose={() => setQr(null)} width={420}>
          <div className="qlc-aff-qr">
            {qr === 'loading' && <p role="status">…</p>}
            {qr === 'error' && <p className="qlc-field-error">{t('affiliate.qrError')}</p>}
            {qr?.qrDataUrl && (
              <>
                <img src={qr.qrDataUrl} alt={qr.link} />
                <code className="qlc-aff-link" style={{ width: '100%' }} title={qr.link}>{qr.link}</code>
                <button type="button" className="qlc-btn primary" onClick={() => copy(qr.link, 'aff-qr-link')}>
                  {isCopied('aff-qr-link') ? t('affiliate.copied') : t('affiliate.copy')}
                </button>
                <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: 0 }}>{t('affiliate.qrHint')}</p>
              </>
            )}
          </div>
        </Modal>
      )}
      {viewingProof && <DocumentViewerModal url={viewingProof.url} fileName={viewingProof.fileName} onClose={() => setViewingProof(null)} />}
    </div>
  );
}

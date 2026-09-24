import { useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { TRANSFER_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatCdmxDateTime } from '../../utils/cdmxTime';

// "Ahora" en formato datetime-local (hora del dispositivo), usado como
// límite superior del selector — el backend vuelve a validar.
function nowLocalInput() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/*
 * DEPÓSITO DE TU GARANTÍA → TRANSFERENCIA INTERNA BITGET.
 * El cliente ve (y copia) el UID de recepción de QLC — nunca lo edita — y,
 * después de transferir, reporta SOLO dos datos: número de orden y fecha/
 * hora de la transacción. Nada de wallet, red, dirección, hash ni capturas.
 */
export default function BitgetTransferSection({ subaccountId, config, reports, hasUnpaidStatement, guaranteeConfirmed, onReported }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ bitgetOrderNumber: '', transactionAt: '' });
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const reportStatusMap = TRANSFER_REPORT_STATUS(t);
  const uid = config?.bitgetReceiveUid;

  const copyUid = async () => {
    if (!uid) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(uid);
      ok = true;
    } catch {
      // Respaldo para navegadores/contextos sin API de portapapeles (p. ej.
      // HTTP o WebViews): selección temporal + execCommand('copy').
      const area = document.createElement('textarea');
      area.value = uid;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(area);
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.bitgetOrderNumber.trim() || !form.transactionAt) return;
    setSending(true);
    setError('');
    setOk('');
    try {
      await api.post(`/client/api-subaccounts/${subaccountId}/payment-reports`, {
        bitgetOrderNumber: form.bitgetOrderNumber.trim(),
        // datetime-local es hora local del dispositivo → ISO (UTC) para el backend.
        transactionAt: new Date(form.transactionAt).toISOString(),
      });
      setForm({ bitgetOrderNumber: '', transactionAt: '' });
      setOk(t('clientPayments.reportedOk'));
      onReported?.();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSending(false);
    }
  };

  const showForm = uid && (hasUnpaidStatement || !guaranteeConfirmed);

  return (
    <section id="garantia" className="qlc-card qlc-card-span-all qlc-bitget">
      <div>
        <div className="qlc-kicker">{t('clientPayments.sectionKicker')}</div>
        <div className="qlc-bitget-head">
          <h3>{t('clientPayments.bitgetTitle')}</h3>
          <span className="qlc-badge ok">{t('clientPayments.noFee')}</span>
        </div>
        <p className="qlc-bitget-intro">{t('clientPayments.bitgetIntro')}</p>

        {uid ? (
          <div className="qlc-bitget-uid">
            <span className="qlc-label" style={{ marginTop: 0 }}>
              {t('clientPayments.receiveUid')}
            </span>
            <div className="qlc-bitget-uid-row">
              <span className="qlc-bitget-uid-value">{uid}</span>
              <button type="button" className="qlc-btn ghost" onClick={copyUid}>
                {copied ? t('common.copied') : t('clientPayments.copyUid')}
              </button>
            </div>
          </div>
        ) : (
          <div className="qlc-empty">{t('clientPayments.uidPending')}</div>
        )}

        <ol className="qlc-bitget-steps">
          <li>{t('clientPayments.step1')}</li>
          <li>{t('clientPayments.step2')}</li>
          <li>{t('clientPayments.step3')}</li>
        </ol>
        {config?.instructions && (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 10, whiteSpace: 'pre-line' }}>{config.instructions}</p>
        )}
      </div>

      <div className="qlc-bitget-form">
        <h4>{t('clientPayments.reportTitle')}</h4>
        {ok && <p style={{ fontSize: 13, color: 'var(--qlc-ok)' }}>{ok}</p>}
        {error && <p className="qlc-field-error">{error}</p>}
        {showForm ? (
          <form onSubmit={submit}>
            {hasUnpaidStatement && (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: '4px 0 0' }}>{t('clientPayments.appliesToStatement')}</p>
            )}
            <label className="qlc-label" htmlFor="bitget-order">
              {t('clientPayments.orderNumber')}
            </label>
            <input
              id="bitget-order"
              className="qlc-input"
              inputMode="numeric"
              autoComplete="off"
              maxLength={64}
              value={form.bitgetOrderNumber}
              onChange={(e) => setForm((f) => ({ ...f, bitgetOrderNumber: e.target.value }))}
              placeholder={t('clientPayments.orderNumberPlaceholder')}
              required
            />
            <label className="qlc-label" htmlFor="bitget-datetime">
              {t('clientPayments.transactionAt')}
            </label>
            <input
              id="bitget-datetime"
              className="qlc-input"
              type="datetime-local"
              max={nowLocalInput()}
              value={form.transactionAt}
              onChange={(e) => setForm((f) => ({ ...f, transactionAt: e.target.value }))}
              required
            />
            <button className="qlc-btn primary" disabled={sending}>
              {sending ? t('clientPayments.sending') : t('clientPayments.submit')}
            </button>
          </form>
        ) : (
          uid && <p style={{ fontSize: 13, color: 'var(--qlc-ok)' }}>✓ {t('clientPayments.guaranteeConfirmed')}</p>
        )}
      </div>

      {reports.length > 0 && (
        <div className="qlc-bitget-history">
          <div style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>{t('clientPayments.history')}</div>
          <ul className="qlc-plain-list" style={{ margin: 0 }}>
            {reports.map((r) => {
              const st = statusOf(reportStatusMap, r.status);
              return (
                <li key={r.id}>
                  <span>
                    {r.bitgetOrderNumber ? (
                      <>
                        {t('clientPayments.orderLabel')} <code>{r.bitgetOrderNumber}</code> · {formatCdmxDateTime(r.transactionAt || r.reportedAt)}
                      </>
                    ) : (
                      <>
                        {r.amount != null ? `${r.amount} ${r.currency} · ` : ''}
                        {formatCdmxDate(r.reportedAt)}
                        {r.proofDriveFileId && (
                          <>
                            {' · '}
                            <a href={`${API_BASE_URL}/client/payment-reports/${r.id}/proof`} target="_blank" rel="noreferrer">
                              {t('clientPayments.viewProof')}
                            </a>
                          </>
                        )}
                      </>
                    )}
                  </span>
                  <span className={`qlc-badge ${st.className}`}>{st.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

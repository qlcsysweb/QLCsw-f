import { useRef, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { TRANSFER_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatCdmxDateTime } from '../../utils/cdmxTime';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import ConfirmModal from '../../components/ConfirmModal';
import FilePicker from '../../components/FilePicker';
import { BitgetSteps, BitgetTransferData, BitgetAdvantages } from '../../components/BitgetTransferInfo';

const IN_REVIEW = ['PENDING', 'EN_REVISION', 'GARANTIA_REPORTADA'];
const MAX_FILES = 5;

// Fecha/hora (ISO) → valor de <input type="datetime-local"> en hora local.
function toLocalInput(value) {
  const d = value ? new Date(value) : new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/*
 * Formulario de confirmación (nuevo reporte o corrección de uno rechazado).
 * Corregir modifica el MISMO registro (PUT) — nunca crea un duplicado.
 */
function TransferReportForm({ subaccountId, uid, editing, hasUnpaidStatement, onDone, onCancel }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    bitgetOrderNumber: editing?.bitgetOrderNumber || '',
    transactionAt: editing?.transactionAt ? toLocalInput(editing.transactionAt) : '',
  });
  const [keptFiles, setKeptFiles] = useState(editing?.evidenceFiles || []);
  const [evidence, setEvidence] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // Bloqueo síncrono contra doble clic/Enter (el backend además rechaza un
  // N.º de orden ya reportado con 409, aunque lleguen dos requests a la vez).
  const submittingRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!form.bitgetOrderNumber.trim() || !form.transactionAt) return;
    // UID ≠ N.º de orden: el UID es el dato de QLC que el cliente copió para
    // transferir; el N.º de orden lo genera Bitget DESPUÉS de transferir.
    if (uid && form.bitgetOrderNumber.trim() === String(uid).trim()) {
      setError(t('clientPayments.orderIsUid'));
      return;
    }
    if (evidence.length + keptFiles.length === 0) {
      setError(t('clientPayments.evidenceRequired'));
      return;
    }
    submittingRef.current = true;
    setSending(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('bitgetOrderNumber', form.bitgetOrderNumber.trim());
      // datetime-local es hora local del dispositivo → ISO (UTC) para el backend.
      fd.append('transactionAt', new Date(form.transactionAt).toISOString());
      evidence.forEach((f) => fd.append('files', f.file, f.file.name));
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      let data;
      if (editing) {
        fd.append('keepFileIds', JSON.stringify(keptFiles.map((f) => f.id)));
        ({ data } = await api.put(`/client/payment-reports/${editing.id}`, fd, config));
      } else {
        ({ data } = await api.post(`/client/api-subaccounts/${subaccountId}/payment-reports`, fd, config));
      }
      onDone?.(data.report);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      submittingRef.current = false;
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {hasUnpaidStatement && !editing && (
        <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: '4px 0 0' }}>{t('clientPayments.appliesToStatement')}</p>
      )}
      <label className="qlc-label" htmlFor="bitget-order">
        {t('clientPayments.orderNumber')}
      </label>
      <input
        id="bitget-order"
        className="qlc-input"
        autoComplete="off"
        maxLength={64}
        value={form.bitgetOrderNumber}
        onChange={(e) => setForm((f) => ({ ...f, bitgetOrderNumber: e.target.value }))}
        placeholder={t('clientPayments.orderNumberPlaceholder')}
        aria-describedby="bitget-order-help"
        required
      />
      <p id="bitget-order-help" className="qlc-bt-field-help">{t('clientPayments.orderNumberHelp')}</p>
      <label className="qlc-label" htmlFor="bitget-datetime">
        {t('clientPayments.transactionAt')}
      </label>
      <input
        id="bitget-datetime"
        className="qlc-input"
        type="datetime-local"
        max={toLocalInput()}
        value={form.transactionAt}
        onChange={(e) => setForm((f) => ({ ...f, transactionAt: e.target.value }))}
        required
      />
      <span className="qlc-label">{t('clientPayments.evidenceTitle')}</span>
      {keptFiles.length > 0 && (
        <ul className="qlc-bt-files" style={{ marginBottom: 8 }}>
          {keptFiles.map((f) => (
            <li key={f.id} className="qlc-bt-file">
              <span className="qlc-bt-file-icon">{f.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}</span>
              <span className="qlc-bt-file-name" title={f.fileName}>
                {f.fileName}
              </span>
              <button type="button" className="qlc-bt-file-remove" onClick={() => setKeptFiles((k) => k.filter((x) => x.id !== f.id))} disabled={sending}>
                {t('clientPayments.evidenceRemove')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <FilePicker files={evidence} onChange={setEvidence} disabled={sending} maxFiles={MAX_FILES} keptCount={keptFiles.length} />
      {error && <p className="qlc-field-error">{error}</p>}
      <button className="qlc-btn primary" disabled={sending}>
        {sending ? t('clientPayments.sending') : editing ? t('clientPayments.submitCorrection') : t('clientPayments.submit')}
      </button>
      {onCancel && (
        <button type="button" className="qlc-btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={onCancel} disabled={sending}>
          {t('common.cancel')}
        </button>
      )}
    </form>
  );
}

/*
 * DEPÓSITO DE TU GARANTÍA → TRANSFERENCIA INTERNA BITGET.
 * El cliente ve (y copia) el UID de recepción GENERAL de QLC, transfiere
 * desde SU propia cuenta de Bitget y después confirma la transferencia con
 * N.º de orden + fecha/hora + evidencias. Una vez reportada NO se vuelve a
 * mostrar el formulario vacío: se muestra el resumen "Transferencia
 * reportada" con su estado; reportar otra transferencia es una acción
 * explícita, y un reporte rechazado se CORRIGE (mismo registro).
 */
export default function BitgetTransferSection({ subaccountId, config, reports, hasUnpaidStatement, unpaidStatementId, guaranteeConfirmed, onReported, onRemoved }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(null); // null | 'new' | 'correct'
  const [ok, setOk] = useState('');
  const [viewing, setViewing] = useState(null);
  // Transferencia revisada que el cliente quiere borrar de su historial.
  const [removing, setRemoving] = useState(null);
  // Reporte recién guardado: se muestra de inmediato (sin esperar al
  // siguiente refresco) para que nunca aparezca el formulario vacío.
  const [justReported, setJustReported] = useState(null);
  const reportStatusMap = TRANSFER_REPORT_STATUS(t);
  const uid = config?.bitgetReceiveUid;

  let allReports = reports;
  if (justReported) {
    const serverCopy = reports.find((r) => r.id === justReported.id);
    if (!serverCopy) allReports = [justReported, ...reports];
    else if (serverCopy.status === 'RECHAZADO' && justReported.status !== 'RECHAZADO') {
      allReports = reports.map((r) => (r.id === justReported.id ? justReported : r));
    }
  }

  // Reportes del concepto que se está pagando ahora: el estado de cuenta sin
  // pagar (si existe) o la garantía. `reports` viene ordenado desc.
  const relevant = allReports.filter((r) =>
    r.bitgetOrderNumber && (hasUnpaidStatement ? r.statementId === unpaidStatementId : !r.statementId)
  );
  const latest = relevant[0] || null;
  const latestInReview = latest && IN_REVIEW.includes(latest.status) ? latest : null;
  const latestRejected = latest?.status === 'RECHAZADO' ? latest : null;
  const paymentDone = !hasUnpaidStatement && guaranteeConfirmed;
  // Historial visible: sin los que el cliente borró (siguen contando arriba
  // para el estado del pago).
  const historyReports = allReports.filter((r) => !r.clientHidden);

  const handleDone = (report) => {
    if (report) setJustReported(report);
    setMode(null);
    setOk(t('clientPayments.reportedOk'));
    setTimeout(() => setOk(''), 5000);
    onReported?.(report);
  };

  const renderSummary = (r, rejected = false) => {
    const st = statusOf(reportStatusMap, r.status);
    return (
      <div className={`qlc-report-summary${rejected ? ' is-rejected' : ''}`} role="status">
        <div className="qlc-report-summary-title">{rejected ? `× ${t('clientPayments.reportRejectedTitle')}` : `✓ ${t('clientPayments.reportedTitle')}`}</div>
        <dl>
          <div>
            <dt>{t('clientPayments.orderNumber')}</dt>
            <dd>
              <code>{r.bitgetOrderNumber}</code>
            </dd>
          </div>
          <div>
            <dt>{t('clientPayments.transactionAt')}</dt>
            <dd>{r.transactionAt ? formatCdmxDateTime(r.transactionAt) : '—'}</dd>
          </div>
          <div>
            <dt>{t('clientPayments.evidenceLabel')}</dt>
            <dd>{t('clientPayments.filesCount').replace('{count}', r.evidenceFiles?.length || 0)}</dd>
          </div>
          <div>
            <dt>{t('clientApiConnection.status')}</dt>
            <dd>
              <span className={`qlc-badge ${st.className}`}>{st.text}</span>
            </dd>
          </div>
          {rejected && r.reviewNote && (
            <div>
              <dt>{t('clientPayments.rejectReason')}</dt>
              <dd>{r.reviewNote}</dd>
            </div>
          )}
        </dl>
      </div>
    );
  };

  let body;
  if (!uid) {
    body = <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{t('clientPayments.uidPending')}</p>;
  } else if (mode === 'correct' && latestRejected) {
    body = (
      <TransferReportForm
        subaccountId={subaccountId}
        uid={uid}
        editing={latestRejected}
        hasUnpaidStatement={hasUnpaidStatement}
        onDone={handleDone}
        onCancel={() => setMode(null)}
      />
    );
  } else if (mode === 'new') {
    body = (
      <TransferReportForm
        subaccountId={subaccountId}
        uid={uid}
        hasUnpaidStatement={hasUnpaidStatement}
        onDone={handleDone}
        onCancel={latest ? () => setMode(null) : undefined}
      />
    );
  } else if (latestInReview) {
    body = (
      <>
        {renderSummary(latestInReview)}
        <div className="qlc-report-summary-actions">
          <button type="button" className="qlc-btn ghost" onClick={() => setMode('new')}>
            {t('clientPayments.reportNewTransfer')}
          </button>
        </div>
      </>
    );
  } else if (latestRejected && !paymentDone) {
    body = (
      <>
        {renderSummary(latestRejected, true)}
        <div className="qlc-report-summary-actions">
          <button type="button" className="qlc-btn primary" onClick={() => setMode('correct')}>
            {t('clientPayments.correctReport')}
          </button>
          <button type="button" className="qlc-btn ghost" onClick={() => setMode('new')}>
            {t('clientPayments.reportNewTransfer')}
          </button>
        </div>
      </>
    );
  } else if (paymentDone) {
    body = <p style={{ fontSize: 13, color: 'var(--qlc-ok)' }}>✓ {t('clientPayments.guaranteeConfirmed')}</p>;
  } else {
    body = (
      <TransferReportForm subaccountId={subaccountId} uid={uid} hasUnpaidStatement={hasUnpaidStatement} onDone={handleDone} />
    );
  }

  return (
    <section id="garantia" className="qlc-card qlc-card-span-all qlc-bitget">
      <div>
        <div className="qlc-kicker">{t('clientPayments.sectionKicker')}</div>
        <div className="qlc-bt-head">
          <span className="qlc-bt-icon" aria-hidden="true">⇄</span>
          <div className="qlc-bt-head-text">
            <div className="qlc-bt-head-row">
              <h3>{t('clientPayments.bitgetTitle')}</h3>
              <span className="qlc-bt-badge">{t('clientPayments.noFee')}</span>
            </div>
            <p className="qlc-bt-sub">{t('clientPayments.bitgetIntro')}</p>
          </div>
        </div>

        <BitgetSteps />
        <BitgetTransferData uid={uid} />
        {config?.instructions && (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 10, whiteSpace: 'pre-line' }}>{config.instructions}</p>
        )}
        <BitgetAdvantages />
      </div>

      <div className="qlc-bitget-form">
        <div className="qlc-kicker">{t('clientPayments.confirmTitle')}</div>
        <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: '0 0 8px' }}>{t('clientPayments.confirmText')}</p>
        {ok && <p style={{ fontSize: 13, color: 'var(--qlc-ok)' }}>{ok}</p>}
        {body}
      </div>

      {historyReports.length > 0 && (
        <div className="qlc-bitget-history">
          <div style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>{t('clientPayments.history')}</div>
          <ul className="qlc-plain-list" style={{ margin: 0 }}>
            {historyReports.map((r) => {
              const st = statusOf(reportStatusMap, r.status);
              return (
                <li key={r.id}>
                  <span>
                    {r.bitgetOrderNumber ? (
                      <>
                        {t('clientPayments.orderLabel')} <code>{r.bitgetOrderNumber}</code> · {formatCdmxDateTime(r.transactionAt || r.reportedAt)}
                        {r.evidenceFiles?.length > 0 && (
                          <>
                            {' · '}
                            <span className="qlc-bt-evidence-links">
                              {r.evidenceFiles.map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  className="qlc-link-btn"
                                  onClick={() => setViewing({ url: `/client/payment-reports/${r.id}/files/${f.id}`, fileName: f.fileName })}
                                >
                                  {f.fileName}
                                </button>
                              ))}
                            </span>
                          </>
                        )}
                        {r.status === 'RECHAZADO' && r.reviewNote && <span style={{ color: 'var(--qlc-danger)' }}> · {r.reviewNote}</span>}
                      </>
                    ) : (
                      <>
                        {r.amount != null ? `${r.amount} ${r.currency} · ` : ''}
                        {formatCdmxDate(r.reportedAt)}
                        {r.proofDriveFileId && (
                          <>
                            {' · '}
                            <button
                              type="button"
                              className="qlc-link-btn"
                              onClick={() => setViewing({ url: `/client/payment-reports/${r.id}/proof`, fileName: r.proofFileName || 'comprobante' })}
                            >
                              {t('clientPayments.viewProof')}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className={`qlc-badge ${st.className}`}>{st.text}</span>
                    {(r.status === 'APROBADO' || r.status === 'RECHAZADO') && (
                      <button
                        type="button"
                        className="qlc-btn ghost qlc-case-delete qlc-icon-only"
                        onClick={() => setRemoving(r)}
                        title={t('clientPayments.deleteFromHistory')}
                        aria-label={t('clientPayments.deleteFromHistory')}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
                        </svg>
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {viewing && <DocumentViewerModal url={viewing.url} fileName={viewing.fileName} onClose={() => setViewing(null)} />}
      {removing && (
        <ConfirmModal
          title={t('clientPayments.deleteFromHistoryTitle')}
          message={t('clientPayments.deleteFromHistoryMessage').replace(
            '{date}',
            formatCdmxDateTime(removing.transactionAt || removing.reportedAt)
          )}
          confirmLabel={t('clientPayments.deleteFromHistory')}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await api.delete(`/client/payment-reports/${removing.id}`);
            setJustReported(null);
            onRemoved?.();
          }}
        />
      )}
    </section>
  );
}

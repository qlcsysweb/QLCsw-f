import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { TRANSFER_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatCdmxDateTime } from '../../utils/cdmxTime';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { BitgetSteps, BitgetTransferData, BitgetAdvantages } from '../../components/BitgetTransferInfo';

// "Ahora" en formato datetime-local (hora del dispositivo), usado como
// límite superior del selector — el backend vuelve a validar.
function nowLocalInput() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// Mismas reglas que el backend (middleware/upload.js → evidenceFiles): el
// backend vuelve a validar tipo, firma del archivo, tamaño y cantidad.
const EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const EVIDENCE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * Selector de EVIDENCIA: arrastrar y soltar o botón "Seleccionar archivos"
 * (funciona igual sin drag & drop). Lista previa con miniatura para
 * imágenes y opción de quitar cada archivo antes de enviar.
 */
function EvidencePicker({ files, onChange, disabled }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [pickError, setPickError] = useState('');
  const [previews, setPreviews] = useState({});

  // Miniaturas (Blob URLs) solo para imágenes; se liberan al quitar/enviar.
  useEffect(() => {
    const next = {};
    files.forEach((f) => {
      if (f.type.startsWith('image/')) next[f.key] = URL.createObjectURL(f.file);
    });
    setPreviews(next);
    return () => Object.values(next).forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (list) => {
    setPickError('');
    const incoming = Array.from(list || []);
    const accepted = [];
    for (const file of incoming) {
      if (!EVIDENCE_TYPES.includes(file.type)) {
        setPickError(t('clientPayments.evidenceInvalid').replace('{name}', file.name));
        continue;
      }
      if (file.size > MAX_BYTES) {
        setPickError(t('clientPayments.evidenceTooBig').replace('{name}', file.name));
        continue;
      }
      if (files.length + accepted.length >= MAX_FILES) {
        setPickError(t('clientPayments.evidenceTooMany'));
        break;
      }
      accepted.push({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, type: file.type });
    }
    if (accepted.length) onChange([...files, ...accepted]);
  };

  return (
    <div>
      <div
        className={`qlc-bt-drop${over ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
      >
        <p>{t('clientPayments.evidenceDrop')}</p>
        <p>{t('clientPayments.evidenceOr')}</p>
        <button type="button" className="qlc-btn ghost" onClick={() => inputRef.current?.click()} disabled={disabled || files.length >= MAX_FILES}>
          {t('clientPayments.evidencePick')}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={EVIDENCE_ACCEPT}
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="qlc-bt-drop-hint">{t('clientPayments.evidenceHint')}</p>
      </div>
      {pickError && <p className="qlc-field-error">{pickError}</p>}
      {files.length > 0 && (
        <ul className="qlc-bt-files" aria-label={t('clientPayments.evidenceLabel')}>
          {files.map((f) => (
            <li key={f.key} className="qlc-bt-file">
              {previews[f.key] ? (
                <img className="qlc-bt-file-thumb" src={previews[f.key]} alt="" />
              ) : (
                <span className="qlc-bt-file-icon">PDF</span>
              )}
              <span className="qlc-bt-file-name" title={f.file.name}>
                {f.file.name}
              </span>
              <span className="qlc-bt-file-size">{formatBytes(f.file.size)}</span>
              <button
                type="button"
                className="qlc-bt-file-remove"
                onClick={() => onChange(files.filter((x) => x.key !== f.key))}
                disabled={disabled}
                aria-label={`${t('clientPayments.evidenceRemove')} ${f.file.name}`}
              >
                {t('clientPayments.evidenceRemove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/*
 * DEPÓSITO DE TU GARANTÍA → TRANSFERENCIA INTERNA BITGET.
 * El cliente ve (y copia) el UID de recepción de QLC — nunca lo edita — y,
 * después de transferir, CONFIRMA la transferencia con: número de orden /
 * transacción de Bitget, fecha y hora y evidencias (1 a 5 archivos).
 */
export default function BitgetTransferSection({ subaccountId, config, reports, hasUnpaidStatement, guaranteeConfirmed, onReported }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ bitgetOrderNumber: '', transactionAt: '' });
  const [evidence, setEvidence] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [viewing, setViewing] = useState(null);
  const reportStatusMap = TRANSFER_REPORT_STATUS(t);
  const uid = config?.bitgetReceiveUid;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.bitgetOrderNumber.trim() || !form.transactionAt) return;
    if (evidence.length === 0) {
      setError(t('clientPayments.evidenceRequired'));
      return;
    }
    setSending(true);
    setError('');
    setOk('');
    try {
      const fd = new FormData();
      fd.append('bitgetOrderNumber', form.bitgetOrderNumber.trim());
      // datetime-local es hora local del dispositivo → ISO (UTC) para el backend.
      fd.append('transactionAt', new Date(form.transactionAt).toISOString());
      evidence.forEach((f) => fd.append('files', f.file, f.file.name));
      await api.post(`/client/api-subaccounts/${subaccountId}/payment-reports`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm({ bitgetOrderNumber: '', transactionAt: '' });
      setEvidence([]);
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
        <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: '0 0 6px' }}>{t('clientPayments.confirmText')}</p>
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
            <span className="qlc-label">{t('clientPayments.evidenceTitle')}</span>
            <EvidencePicker files={evidence} onChange={setEvidence} disabled={sending} />
            <button className="qlc-btn primary" disabled={sending}>
              {sending ? t('clientPayments.sending') : t('clientPayments.submit')}
            </button>
          </form>
        ) : uid ? (
          <p style={{ fontSize: 13, color: 'var(--qlc-ok)' }}>✓ {t('clientPayments.guaranteeConfirmed')}</p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{t('clientPayments.uidPending')}</p>
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
                  <span className={`qlc-badge ${st.className}`}>{st.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {viewing && <DocumentViewerModal url={viewing.url} fileName={viewing.fileName} onClose={() => setViewing(null)} />}
    </section>
  );
}

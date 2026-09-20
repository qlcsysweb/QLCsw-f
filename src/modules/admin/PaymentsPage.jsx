import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';

const emptyForm = { network: '', walletAddress: '', paymentLink: '', instructions: '' };

export default function PaymentsPage() {
  const { t } = useLanguage();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('');
  const [confirmReject, setConfirmReject] = useState(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [copiedHashId, setCopiedHashId] = useState(null);
  const [expandedProof, setExpandedProof] = useState(null);

  const paymentReportStatusMap = PAYMENT_REPORT_STATUS(t);

  const load = () => {
    api.get('/admin/payment-config').then(({ data }) => {
      setConfig(data.config);
      setForm({
        network: data.config?.network || '',
        walletAddress: data.config?.walletAddress || '',
        paymentLink: data.config?.paymentLink || '',
        instructions: data.config?.instructions || '',
      });
    });
    api.get('/admin/payment-reports').then(({ data }) => setReports(data.reports));
  };
  useEffect(() => {
    load();
  }, []);

  // Actualización sin refresh manual: si un cliente reporta una
  // transferencia en cualquier subcuenta, este listado global la refleja
  // sin recargar. Poll acotado solo a los reportes (no toca el formulario
  // de configuración en edición). Mismo patrón ya usado en el chat de soporte.
  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/admin/payment-reports').then(({ data }) => setReports(data.reports));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const saveConfig = async () => {
    await api.put('/admin/payment-config', form);
    setConfirmSave(false);
    setMessage(t('adminPayments.updated'));
    setTimeout(() => setMessage(''), 3000);
    load();
  };

  const uploadQr = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/admin/payment-config/qr', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
  };

  const review = async (id, status) => {
    await api.patch(`/admin/payment-reports/${id}`, { status });
    load();
  };

  // CORRECCIÓN 10 (bloque de 20) — "Transferencia recibida" es un paso
  // independiente de aprobar el pago: solo confirma que el admin identificó
  // la transferencia. Nunca cambia el estado a APROBADO por sí sola.
  const markReceived = async (id) => {
    await api.patch(`/admin/payment-reports/${id}/transfer-received`);
    load();
  };

  // AUDITORÍA QLC PARTE 4 — "Garantía reportada" es un paso independiente y
  // POSTERIOR: no aprueba el pago, solo habilita el botón final "Aprobar pago".
  const markGuarantee = async (id) => {
    await api.patch(`/admin/payment-reports/${id}/guarantee-reported`);
    load();
  };

  const copyHash = async (id, hash) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHashId(id);
      setTimeout(() => setCopiedHashId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      // Clipboard puede fallar en contexto no seguro; no bloquea la vista.
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminPayments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminPayments.title')}</h1>

      <div className="qlc-detail-grid">
        <form
          className="qlc-card"
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmSave(true);
          }}
        >
          <h3 style={{ marginTop: 0 }}>{t('adminPayments.paymentData')}</h3>
          {(config?.qrDriveFileId || config?.qrUrl) && (
            <img
              src={config.qrDriveFileId ? `${API_BASE_URL}/admin/payment-config/qr` : config.qrUrl}
              alt="QR de pago"
              style={{ width: 120, borderRadius: 10, marginBottom: 10 }}
            />
          )}
          <label className="qlc-label">{t('adminPayments.qrCode')}</label>
          <input className="qlc-input" type="file" accept="image/*" onChange={uploadQr} />
          <label className="qlc-label">{t('adminPayments.currency')}</label>
          <input className="qlc-input" value="USDT" disabled title={t('adminPayments.currencyHint')} />
          <label className="qlc-label">{t('adminPayments.network')}</label>
          <input
            className="qlc-input"
            placeholder={t('adminPayments.networkPlaceholder')}
            value={form.network}
            onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
          />
          <label className="qlc-label">{t('adminPayments.wallet')}</label>
          <input className="qlc-input" value={form.walletAddress} onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))} />
          <label className="qlc-label">{t('adminPayments.walletLink')}</label>
          <input className="qlc-input" value={form.paymentLink} onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))} />
          <label className="qlc-label">{t('adminPayments.instructions')}</label>
          <textarea className="qlc-textarea" rows={3} value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary">{t('common.save')}</button>
          </div>
        </form>

        {confirmSave && (
          <ConfirmSaveModal
            message={t('adminPayments.saveConfirmMessage')}
            onCancel={() => setConfirmSave(false)}
            onConfirm={saveConfig}
          />
        )}

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminPayments.reports')} ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <div className="qlc-empty">{t('adminPayments.noReports')}</div>
          ) : (
            <ul className="qlc-plain-list">
              {reports.map((r) => (
                <li key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {r.apiSubaccount?.client?.firstName} {r.apiSubaccount?.client?.lastName}
                      {r.apiSubaccount?.identifier && <span style={{ color: 'var(--qlc-muted2)' }}> ({r.apiSubaccount.identifier})</span>}
                      {' '}— {r.amount} {r.currency}
                    </span>
                    {(() => {
                      const s = statusOf(paymentReportStatusMap, r.status, 'PENDING');
                      return <span className={`qlc-badge ${s.className}`}>{s.text}</span>;
                    })()}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--qlc-muted2)' }}>
                    {formatCdmxDate(r.reportedAt)}
                  </p>
                  {r.reference && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--qlc-muted2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t('adminClientDetail.paymentReference')}: <code style={{ wordBreak: 'break-all' }}>{r.reference}</code>
                      <button type="button" className="qlc-btn ghost" style={{ flexShrink: 0 }} onClick={() => copyHash(r.id, r.reference)}>
                        {copiedHashId === r.id ? t('common.copied') : t('common.copy')}
                      </button>
                    </p>
                  )}
                  {r.proofDriveFileId && (
                    <div style={{ margin: '6px 0 0' }}>
                      {(r.proofMimeType || '').startsWith('image/') ? (
                        <div>
                          <img
                            src={`${API_BASE_URL}/admin/payment-reports/${r.id}/proof`}
                            alt={t('adminPayments.viewProofImage')}
                            style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, border: '1px solid var(--qlc-line)', cursor: 'zoom-in', display: 'block' }}
                            onClick={() => setExpandedProof(r)}
                          />
                          <button type="button" className="qlc-btn ghost" style={{ marginTop: 4, fontSize: 11, padding: '4px 8px' }} onClick={() => setExpandedProof(r)}>
                            {t('adminPayments.expandImage')}
                          </button>
                        </div>
                      ) : r.proofMimeType === 'application/pdf' ? (
                        <button type="button" className="qlc-btn ghost" onClick={() => setExpandedProof(r)}>
                          {t('adminClientDetail.viewProof')}
                        </button>
                      ) : (
                        <a style={{ fontSize: 12 }} href={`${API_BASE_URL}/admin/payment-reports/${r.id}/proof`} target="_blank" rel="noreferrer">
                          {t('adminClientDetail.viewProof')}
                        </a>
                      )}
                    </div>
                  )}
                  {/* AUDITORÍA QLC PARTE 4 — flujo en TRES pasos independientes:
                      Transferencia recibida → Garantía reportada → Aprobar pago.
                      Cada botón solo confirma su propio paso; "Garantía reportada"
                      YA NO aprueba el pago por sí sola. */}
                  {r.transferReceivedAt ? (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--qlc-ok)' }}>
                      ✓ {t('adminPayments.transferReceivedOn')} {formatCdmxDate(r.transferReceivedAt)}
                    </p>
                  ) : (
                    ['PENDING', 'EN_REVISION'].includes(r.status) && (
                      <div style={{ marginTop: 6 }}>
                        <button className="qlc-btn ghost" onClick={() => markReceived(r.id)}>
                          {t('adminPayments.markTransferReceived')}
                        </button>
                      </div>
                    )
                  )}
                  {r.guaranteeReportedAt && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--qlc-ok)' }}>
                      ✓ {t('adminPayments.guaranteeReportedOn')} {formatCdmxDate(r.guaranteeReportedAt)}
                    </p>
                  )}
                  {!['APROBADO', 'RECHAZADO'].includes(r.status) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {!r.guaranteeReportedAt ? (
                        <button className="qlc-btn ghost" disabled={!r.transferReceivedAt} title={!r.transferReceivedAt ? t('adminPayments.markTransferReceived') : ''} onClick={() => markGuarantee(r.id)}>
                          {t('adminPayments.guaranteeReported')}
                        </button>
                      ) : (
                        <button className="qlc-btn primary" onClick={() => review(r.id, 'APROBADO')}>
                          {t('adminPayments.approvePayment')}
                        </button>
                      )}
                      <button className="qlc-btn ghost" onClick={() => setConfirmReject(r)}>
                        {t('adminPayments.reject')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {confirmReject && (
        <ConfirmModal
          title={t('adminPayments.rejectTitle')}
          message={t('adminPayments.rejectMessage')
            .replace('{name}', `${confirmReject.apiSubaccount?.client?.firstName} ${confirmReject.apiSubaccount?.client?.lastName}`)
            .replace('{amount}', confirmReject.amount)
            .replace('{currency}', confirmReject.currency)}
          confirmLabel={t('adminPayments.reject')}
          onClose={() => setConfirmReject(null)}
          onConfirm={() => review(confirmReject.id, 'RECHAZADO')}
        />
      )}

      {expandedProof && (
        <div className="qlc-modal-overlay" onClick={() => setExpandedProof(null)}>
          <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button type="button" className="qlc-btn ghost" onClick={() => setExpandedProof(null)}>
                {t('common.close')}
              </button>
            </div>
            {expandedProof.proofMimeType === 'application/pdf' ? (
              <iframe
                title={t('adminPayments.viewProofImage')}
                src={`${API_BASE_URL}/admin/payment-reports/${expandedProof.id}/proof`}
                style={{ width: '80vw', maxWidth: 800, height: '75vh', border: '1px solid var(--qlc-line)', borderRadius: 10 }}
              />
            ) : (
              <img
                src={`${API_BASE_URL}/admin/payment-reports/${expandedProof.id}/proof`}
                alt={t('adminPayments.viewProofImage')}
                style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 10 }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

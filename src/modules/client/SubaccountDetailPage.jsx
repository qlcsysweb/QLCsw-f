import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import Modal from '../../components/Modal';
import { API_CONNECTION_STATUS, PAYMENT_REPORT_STATUS, STATEMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';

function ModelDetailsModal({ model, onClose, onSelect, selecting, t }) {
  return (
    <Modal title={model.name} onClose={onClose} width={600}>
      {model.tagline && <p style={{ color: 'var(--qlc-blue2)', fontWeight: 600 }}>{model.tagline}</p>}
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, lineHeight: 1.6 }}>{model.description}</p>
      {model.conditions && (
        <p style={{ fontSize: 13 }}>
          <strong>{t('clientModels.conditions')}:</strong> {model.conditions}
        </p>
      )}
      {model.period && (
        <p style={{ fontSize: 13 }}>
          <strong>{t('clientModels.period')}:</strong> {model.period}
        </p>
      )}
      {model.objective && (
        <p style={{ fontSize: 13 }}>
          <strong>{t('clientModels.objective')}:</strong> {model.objective}
        </p>
      )}
      {model.detailsContent && (
        <p style={{ fontSize: 13, color: 'var(--qlc-muted)', whiteSpace: 'pre-line', marginTop: 14 }}>
          {model.detailsContent}
        </p>
      )}
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="qlc-btn primary" disabled={selecting} onClick={onSelect}>
          {selecting ? t('common.saving') : t('clientModels.selectConfirm')}
        </button>
      </div>
    </Modal>
  );
}

export default function SubaccountDetailPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [subaccount, setSubaccount] = useState(null);
  const [modelsRaw, setModelsRaw] = useState([]);
  const [detailsModel, setDetailsModel] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [apiForm, setApiForm] = useState({ exchangeName: '', apiKey: '', apiSecret: '', apiPassphrase: '' });
  const [savingApi, setSavingApi] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '', reference: '' });
  const [reportingPayment, setReportingPayment] = useState(false);
  const [statements, setStatements] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [walletCopied, setWalletCopied] = useState(false);

  const apiStatusMap = API_CONNECTION_STATUS(t);
  const paymentStatusMap = PAYMENT_REPORT_STATUS(t);
  const statementStatusMap = STATEMENT_STATUS(t);

  const CONTRACT_STATUS_LABELS = {
    PENDING: { text: `◌ ${t('status.contract.pending')}`, className: 'warn' },
    UPLOADED: { text: `! ${t('status.contract.uploaded')}`, className: 'warn' },
    RECEIVED_SIGNED: { text: `✓ ${t('status.contract.receivedSigned')}`, className: 'ok' },
    REJECTED: { text: `× ${t('status.contract.rejected')}`, className: 'danger' },
  };

  const load = () => {
    api.get(`/client/api-subaccounts/${id}`).then(({ data }) => setSubaccount(data.subaccount));
    api.get('/client/models').then(({ data }) => setModelsRaw(data.models));
    api.get(`/client/api-subaccounts/${id}/payment-reports`).then(({ data }) => setPayments(data.reports));
    api.get(`/client/api-subaccounts/${id}/statements`).then(({ data }) => setStatements(data.statements));
    api.get('/client/payment-config').then(({ data }) => setPaymentConfig(data.config));
  };
  useEffect(load, [id]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  if (!subaccount) return <div className="qlc-empty">{t('common.loading')}</div>;

  const status = statusOf(apiStatusMap, subaccount.status, 'PENDIENTE');
  const models = modelsRaw.map((m) => getLocalizedModel(m, language));
  const hasModel = Boolean(subaccount.clientModel);
  const modelConfirmed = Boolean(subaccount.clientModel?.confirmedAt);

  const selectModel = async (modelId) => {
    setSelecting(true);
    setError('');
    try {
      await api.post(`/client/api-subaccounts/${id}/model`, { modelId });
      setDetailsModel(null);
      flash(t('clientModels.confirmed'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSelecting(false);
    }
  };

  const confirmModel = async () => {
    setSelecting(true);
    setError('');
    try {
      await api.post(`/client/api-subaccounts/${id}/model/confirm`);
      flash(t('clientModels.confirmed'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSelecting(false);
    }
  };

  const uploadSignedContract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/client/api-subaccounts/${id}/contract/signed`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      flash(t('clientContract.sentOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      e.target.value = '';
    }
  };

  const saveApi = async (e) => {
    e.preventDefault();
    setSavingApi(true);
    setError('');
    try {
      const payload = {};
      if (apiForm.exchangeName) payload.exchangeName = apiForm.exchangeName;
      if (apiForm.apiKey) payload.apiKey = apiForm.apiKey;
      if (apiForm.apiSecret) payload.apiSecret = apiForm.apiSecret;
      if (apiForm.apiPassphrase) payload.apiPassphrase = apiForm.apiPassphrase;
      await api.patch(`/client/api-subaccounts/${id}`, payload);
      setApiForm({ exchangeName: '', apiKey: '', apiSecret: '', apiPassphrase: '' });
      flash(t('clientApiConnection.savedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSavingApi(false);
    }
  };

  const reportCapitalReady = async () => {
    try {
      await api.post(`/client/api-subaccounts/${id}/report-capital-ready`);
      flash(t('clientApiConnection.capitalReportedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  const copyWallet = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles no rompemos la vista.
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount) return;
    setReportingPayment(true);
    const fd = new FormData();
    fd.append('amount', paymentForm.amount);
    if (paymentForm.reference) fd.append('reference', paymentForm.reference);
    const file = e.target.elements.proofFile.files[0];
    if (file) fd.append('file', file);
    try {
      await api.post(`/client/api-subaccounts/${id}/payment-reports`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      flash(t('clientPayments.reportedOk'));
      setPaymentForm({ amount: '', reference: '' });
      e.target.reset();
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setReportingPayment(false);
    }
  };

  return (
    <div>
      <Link to="/client/api-subaccounts" style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
        {t('clientSubaccountDetail.back')}
      </Link>

      <div className="qlc-page-header" style={{ marginTop: 10 }}>
        <div>
          <div className="qlc-kicker">{t('clientSubaccountDetail.kicker')}</div>
          <h1 style={{ margin: 0 }}>{subaccount.identifier || t('clientSubaccounts.unassignedIdentifier')}</h1>
        </div>
        <span className={`qlc-badge ${status.className}`}>{status.text}</span>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      {subaccount.process && (
        <div className="qlc-card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('clientProcess.title')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {['WALLET', 'CONTRACT', 'FUNDS', 'PAYMENT', 'API', 'ACTIVATION'].map((type) => {
              const condition = subaccount.process.conditions.find((c) => c.type === type);
              const cStatus = condition?.status || 'PENDING';
              const info =
                cStatus === 'CONFIRMED'
                  ? { text: `✓ ${t('clientProcess.completed')}`, className: 'ok' }
                  : cStatus === 'REJECTED'
                    ? { text: `! ${t('clientProcess.needsAttention')}`, className: 'danger' }
                    : { text: `○ ${t('clientProcess.pending')}`, className: 'warn' };
              return (
                <div key={type} style={{ fontSize: 12 }}>
                  <div style={{ color: 'var(--qlc-muted2)', marginBottom: 4 }}>{t(`status.conditionType.${type}`)}</div>
                  <span className={`qlc-badge ${info.className}`}>{info.text}</span>
                </div>
              );
            })}
          </div>
          {subaccount.process.isActivated && (
            <p style={{ marginTop: 12, color: 'var(--qlc-ok)', fontSize: 13 }}>
              ✓ {t('clientProcess.activatedSince')} {formatCdmxDate(subaccount.process.activatedAt)}.
            </p>
          )}
        </div>
      )}

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientModels.title')}</h3>
          {hasModel ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{getLocalizedModel(subaccount.clientModel.model, language).name}</p>
              <span className={`qlc-badge ${modelConfirmed ? 'ok' : 'warn'}`}>
                {modelConfirmed ? t('clientModels.currentModel') : t('clientModels.pendingConfirm')}
              </span>
              {!modelConfirmed && (
                <button className="qlc-btn primary" style={{ width: '100%', marginTop: 12 }} disabled={selecting} onClick={confirmModel}>
                  {selecting ? t('common.saving') : t('clientModels.confirmSelection')}
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {models.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--qlc-line)', paddingBottom: 8 }}>
                  <span>{m.name}</span>
                  <button className="qlc-btn ghost" onClick={() => setDetailsModel(m)}>
                    {t('clientModels.details')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientContract.title')}</h3>
          {!subaccount.contract ? (
            <div className="qlc-empty">{t('clientContract.noContract')}</div>
          ) : (
            <>
              <p>
                {t('clientContract.statusLabel')}:{' '}
                <span className={`qlc-badge ${(CONTRACT_STATUS_LABELS[subaccount.contract.status] || CONTRACT_STATUS_LABELS.PENDING).className}`}>
                  {(CONTRACT_STATUS_LABELS[subaccount.contract.status] || CONTRACT_STATUS_LABELS.PENDING).text}
                </span>
              </p>
              {subaccount.contract.originalDriveFileId && (
                <p>
                  <a href={`${API_BASE_URL}/client/contract/${subaccount.contract.id}/download/original`} target="_blank" rel="noreferrer">
                    {t('clientContract.downloadOriginal')}
                  </a>
                </p>
              )}
              {subaccount.contract.signedDriveFileId ? (
                <div className="qlc-card" style={{ background: 'rgba(0,168,255,0.06)', borderColor: 'var(--qlc-ok-border)' }}>
                  <p style={{ margin: 0, fontSize: 13 }}>{t('clientContract.lockedNotice')}</p>
                </div>
              ) : (
                <div>
                  <label className="qlc-label">{t('clientContract.uploadLabel')}</label>
                  <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -4 }}>{t('clientContract.uploadHint')}</p>
                  <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={uploadSignedContract} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientApiConnection.statusTitle')}</h3>
          {subaccount.requiredCapital != null && (
            <p style={{ fontSize: 14 }}>
              <strong>{t('clientApiConnection.requiredCapital')}:</strong> {subaccount.requiredCapital} USDT
            </p>
          )}
          {subaccount.requiredCapital != null && !subaccount.clientReportedCapitalReady && (
            <button className="qlc-btn primary" style={{ width: '100%', marginBottom: 12 }} onClick={reportCapitalReady}>
              {t('clientApiConnection.reportCapitalReady')}
            </button>
          )}
          {subaccount.clientReportedCapitalReady && (
            <p style={{ fontSize: 12, color: 'var(--qlc-ok)' }}>✓ {t('clientApiConnection.capitalReported')}</p>
          )}
          <form onSubmit={saveApi}>
            <label className="qlc-label">{t('clientApiConnection.exchange')}</label>
            <input className="qlc-input" value={apiForm.exchangeName} onChange={(e) => setApiForm((f) => ({ ...f, exchangeName: e.target.value }))} placeholder={subaccount.exchangeName || 'Bitget'} />
            <label className="qlc-label">API Key {subaccount.hasApiKey ? t('clientApiConnection.alreadyRegistered') : ''}</label>
            <input className="qlc-input" value={apiForm.apiKey} onChange={(e) => setApiForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder={t('clientApiConnection.leaveBlank')} />
            <label className="qlc-label">Secret Key {subaccount.hasApiSecret ? t('clientApiConnection.alreadyRegistered') : ''}</label>
            <input className="qlc-input" value={apiForm.apiSecret} onChange={(e) => setApiForm((f) => ({ ...f, apiSecret: e.target.value }))} placeholder={t('clientApiConnection.leaveBlank')} />
            <label className="qlc-label">Passphrase {subaccount.hasApiPassphrase ? t('clientApiConnection.alreadyRegistered') : ''}</label>
            <input className="qlc-input" type="password" value={apiForm.apiPassphrase} onChange={(e) => setApiForm((f) => ({ ...f, apiPassphrase: e.target.value }))} placeholder={t('clientApiConnection.leaveBlank')} />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={savingApi}>
              {savingApi ? t('common.saving') : t('clientApiConnection.save')}
            </button>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientPayments.paymentDataTitle')}</h3>
          {paymentConfig?.walletAddress ? (
            <>
              {paymentConfig.qrUrl && <img src={paymentConfig.qrUrl} alt="QR de pago" style={{ width: 130, borderRadius: 10, marginBottom: 10 }} />}
              <p style={{ fontSize: 13 }}><strong>{t('clientPayments.currency')}:</strong> {paymentConfig.currency || 'USDT'}</p>
              {paymentConfig.network && <p style={{ fontSize: 13 }}><strong>{t('clientPayments.network')}:</strong> {paymentConfig.network}</p>}
              <p style={{ fontSize: 13, wordBreak: 'break-all' }}><strong>{t('clientPayments.wallet')}:</strong> {paymentConfig.walletAddress}</p>
              <button type="button" className="qlc-btn ghost" onClick={() => copyWallet(paymentConfig.walletAddress)}>
                {walletCopied ? t('clientPayments.walletCopied') : t('clientPayments.copyWallet')}
              </button>
            </>
          ) : (
            <div className="qlc-empty">{t('clientPayments.pendingConfig')}</div>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientPayments.reportPaymentTitle')}</h3>
          <form onSubmit={submitPayment}>
            <label className="qlc-label">{t('clientPayments.amount')}</label>
            <input className="qlc-input" type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} required />
            <label className="qlc-label">{t('clientPayments.reference')}</label>
            <input className="qlc-input" value={paymentForm.reference} onChange={(e) => setPaymentForm((f) => ({ ...f, reference: e.target.value }))} placeholder={t('clientPayments.referencePlaceholder')} />
            <label className="qlc-label">{t('clientPayments.proof')}</label>
            <input type="file" name="proofFile" className="qlc-input" accept=".pdf,image/*" />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={reportingPayment}>
              {reportingPayment ? t('clientPayments.sending') : t('clientPayments.reportPayment')}
            </button>
          </form>
          {payments.length > 0 && (
            <ul className="qlc-plain-list" style={{ marginTop: 14 }}>
              {payments.map((p) => (
                <li key={p.id}>
                  {p.amount} {p.currency} — <span className={`qlc-badge ${statusOf(paymentStatusMap, p.status).className}`}>{statusOf(paymentStatusMap, p.status).text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('clientSubaccountDetail.statements')} ({statements.length})
          </h3>
          {statements.length === 0 ? (
            <div className="qlc-empty">{t('clientSubaccountDetail.noStatements')}</div>
          ) : (
            <ul className="qlc-plain-list">
              {statements.map((s) => {
                const stStatus = statusOf(statementStatusMap, s.displayStatus, 'DISPONIBLE');
                return (
                  <li key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--qlc-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        {formatCdmxDate(s.periodStart)} – {formatCdmxDate(s.periodEnd)} · {s.resultPercentage}%
                      </span>
                      <span className={`qlc-badge ${stStatus.className}`}>{stStatus.text}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      {s.pdfDriveFileId && (
                        <a href={`${API_BASE_URL}/client/statements/${s.id}/download`} target="_blank" rel="noreferrer">
                          {t('clientSubaccountDetail.viewPdf')}
                        </a>
                      )}
                    </div>
                    {s.evidenceDocuments?.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
                        {t('clientSubaccountDetail.statementEvidence')}:{' '}
                        {s.evidenceDocuments.map((d, idx) => (
                          <span key={d.id}>
                            {idx > 0 && ', '}
                            <a href={`${API_BASE_URL}/client/documents/${d.id}/download`} target="_blank" rel="noreferrer">{d.fileName}</a>
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {detailsModel && (
        <ModelDetailsModal
          model={detailsModel}
          onClose={() => setDetailsModel(null)}
          selecting={selecting}
          onSelect={() => selectModel(detailsModel.id)}
          t={t}
        />
      )}
    </div>
  );
}

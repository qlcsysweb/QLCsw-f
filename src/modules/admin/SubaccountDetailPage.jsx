import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { API_CONNECTION_STATUS, PAYMENT_REPORT_STATUS, STATEMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';

// CORRECCIÓN 6 — orden alineado al flujo real del cliente (ver
// backend/src/utils/subaccountProvisioning.js). Los valores del enum no
// cambiaron, solo el orden de presentación.
const CONDITION_ORDER = ['WALLET', 'CONTRACT', 'PAYMENT', 'FUNDS', 'API', 'ACTIVATION'];

function ConditionRow({ condition, onUpdate, t }) {
  const [saving, setSaving] = useState(false);
  const CONDITION_STATUS_TEXT = {
    CONFIRMED: t('status.condition.completed'),
    REJECTED: t('status.condition.rejected'),
    PENDING: t('status.condition.pending'),
  };
  const setStatus = async (status) => {
    setSaving(true);
    try {
      await onUpdate(condition.type, status);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="qlc-condition-row">
      <span>{t(`status.conditionType.${condition.type}`)}</span>
      <span className={`qlc-badge ${condition.status === 'CONFIRMED' ? 'ok' : condition.status === 'REJECTED' ? 'danger' : 'warn'}`}>
        {CONDITION_STATUS_TEXT[condition.status] || condition.status}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="qlc-btn ghost" disabled={saving} onClick={() => setStatus('CONFIRMED')}>
          {t('adminClientDetail.confirm')}
        </button>
        <button className="qlc-btn ghost" disabled={saving} onClick={() => setStatus('REJECTED')}>
          {t('adminClientDetail.reject')}
        </button>
      </div>
    </div>
  );
}

function MaskedSecret({ label, value, t }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const masked = '•'.repeat(Math.min(value.length, 24));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard puede fallar en contexto no seguro; no bloquea la vista.
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 }}>
      <span style={{ color: 'var(--qlc-muted)', minWidth: 80 }}>{label}:</span>
      <code style={{ flex: 1, wordBreak: 'break-all', color: 'var(--qlc-text)' }}>{revealed ? value : masked}</code>
      <button type="button" className="qlc-btn ghost" onClick={() => setRevealed((r) => !r)}>
        {revealed ? t('adminClientDetail.hideSecret') : t('adminClientDetail.revealSecret')}
      </button>
      <button type="button" className="qlc-btn ghost" onClick={copy}>
        {copied ? t('adminClientDetail.copied') : t('adminClientDetail.copy')}
      </button>
    </div>
  );
}

export default function AdminSubaccountDetailPage() {
  const { clientId, id } = useParams();
  const { t, language } = useLanguage();
  const [subaccount, setSubaccount] = useState(null);
  const [secrets, setSecrets] = useState(null);
  const [payments, setPayments] = useState([]);
  const [statements, setStatements] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [apiForm, setApiForm] = useState({ identifier: '', exchangeName: '', apiKey: '', apiSecret: '', apiPassphrase: '', status: 'PENDIENTE', requiredCapital: '', connectionReason: '' });
  const [contractUploading, setContractUploading] = useState(false);
  const [confirmResetSigned, setConfirmResetSigned] = useState(false);
  const [statementForm, setStatementForm] = useState({
    periodStart: '', periodEnd: '', startingBalance: '', endingBalance: '', resultAmount: '', resultPercentage: '', volatility: '', netResult: '', commission: '0', activityNotes: '', adminNotes: '',
  });
  const [creatingStatement, setCreatingStatement] = useState(false);
  const [evidenceUploading, setEvidenceUploading] = useState(null);
  const [sendingStatement, setSendingStatement] = useState(null);

  const apiStatusMap = API_CONNECTION_STATUS(t);
  const paymentStatusMap = PAYMENT_REPORT_STATUS(t);
  const statementStatusMap = STATEMENT_STATUS(t);
  const CONTRACT_STATUS_LABELS = {
    PENDING: { text: t('status.contract.pending'), className: 'warn' },
    UPLOADED: { text: t('status.contract.uploaded'), className: 'warn' },
    RECEIVED_SIGNED: { text: t('status.contract.receivedSigned'), className: 'ok' },
    REJECTED: { text: t('status.contract.rejected'), className: 'danger' },
  };

  const load = () => {
    api.get(`/admin/clients/${clientId}`).then(({ data }) => {
      const found = data.client.apiSubaccounts.find((s) => s.id === id);
      setSubaccount(found);
      if (found) {
        setApiForm((f) => ({ ...f, status: found.status, requiredCapital: found.requiredCapital ?? '' }));
      }
    });
    api.get(`/admin/api-subaccounts/${id}/secrets`).then(({ data }) => setSecrets(data.secrets));
    api.get('/admin/payment-reports', { params: { apiSubaccountId: id } }).then(({ data }) => setPayments(data.reports));
    api.get(`/admin/api-subaccounts/${id}/statements`).then(({ data }) => setStatements(data.statements));
  };
  useEffect(load, [id]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!subaccount) return <div className="qlc-empty">{t('adminClientDetail.loadingClient')}</div>;

  const updateCondition = async (type, status) => {
    await api.patch(`/admin/api-subaccounts/${id}/process/${type}`, { status });
    flash(t('adminClientDetail.conditionUpdated'));
    load();
  };

  const activate = async () => {
    try {
      await api.post(`/admin/api-subaccounts/${id}/activate`);
      flash(t('adminClientDetail.clientActivatedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  const saveApi = async (e) => {
    e.preventDefault();
    const payload = { status: apiForm.status };
    if (apiForm.identifier) payload.identifier = apiForm.identifier;
    if (apiForm.exchangeName) payload.exchangeName = apiForm.exchangeName;
    if (apiForm.apiKey) payload.apiKey = apiForm.apiKey;
    if (apiForm.apiSecret) payload.apiSecret = apiForm.apiSecret;
    if (apiForm.apiPassphrase) payload.apiPassphrase = apiForm.apiPassphrase;
    if (apiForm.requiredCapital !== '') payload.requiredCapital = Number(apiForm.requiredCapital);
    if (apiForm.connectionReason) payload.connectionReason = apiForm.connectionReason;
    try {
      await api.patch(`/admin/api-subaccounts/${id}`, payload);
      setApiForm((f) => ({ ...f, identifier: '', apiKey: '', apiSecret: '', apiPassphrase: '', connectionReason: '' }));
      flash(t('adminClientDetail.apiConnectionUpdated'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  const uploadContract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setContractUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/admin/api-subaccounts/${id}/contract`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash(t('adminClientDetail.contractUploaded'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setContractUploading(false);
      e.target.value = '';
    }
  };

  const resetSignedContract = async () => {
    await api.post(`/admin/contracts/${subaccount.contract.id}/reset-signed`);
    flash(t('adminClientDetail.signedContractRemoved'));
    load();
  };

  const reviewPayment = async (reportId, status) => {
    await api.patch(`/admin/payment-reports/${reportId}`, { status });
    flash(t('adminClientDetail.paymentReviewed'));
    load();
  };

  // CORRECCIÓN 5: "desde" se autocompleta en el backend a partir del fin del
  // periodo anterior de esta subcuenta/API — solo se envía si todavía no
  // existe ningún estado de cuenta previo (primer periodo).
  const hasPreviousStatement = statements.length > 0;
  const latestPeriodEnd = hasPreviousStatement
    ? statements.reduce((max, s) => (new Date(s.periodEnd) > new Date(max) ? s.periodEnd : max), statements[0].periodEnd)
    : null;

  const createStatement = async (e) => {
    e.preventDefault();
    setCreatingStatement(true);
    setError('');
    try {
      const payload = { ...statementForm };
      if (hasPreviousStatement) delete payload.periodStart;
      await api.post(`/admin/api-subaccounts/${id}/statements`, payload);
      flash(t('adminClientDetail.statementCreated'));
      setStatementForm({ periodStart: '', periodEnd: '', startingBalance: '', endingBalance: '', resultAmount: '', resultPercentage: '', volatility: '', netResult: '', commission: '0', activityNotes: '', adminNotes: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setCreatingStatement(false);
    }
  };

  const uploadEvidence = async (statementId, file) => {
    if (!file) return;
    setEvidenceUploading(statementId);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/admin/statements/${statementId}/evidence`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setEvidenceUploading(null);
    }
  };

  const sendStatementToClient = async (statementId) => {
    setSendingStatement(statementId);
    try {
      await api.post(`/admin/statements/${statementId}/send`);
      flash(t('adminClientDetail.sentToClientOk'));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSendingStatement(null);
    }
  };

  const status = statusOf(apiStatusMap, subaccount.status, 'PENDIENTE');
  const conditionsSummary = subaccount.conditionsSummary || { total: 0, confirmed: 0, allConfirmed: false };

  return (
    <div>
      <Link to={`/admin/clients/${clientId}`} style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
        {t('adminClientDetail.backToClient')}
      </Link>

      <div className="qlc-page-header" style={{ marginTop: 10 }}>
        <div>
          <div className="qlc-kicker">{t('adminClientDetail.kicker')}</div>
          <h1 style={{ margin: 0 }}>{subaccount.identifier || t('adminClientDetail.unassignedIdentifier')}</h1>
        </div>
        <span className={`qlc-badge ${status.className}`}>{status.text}</span>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {t('adminClientDetail.activationProcess')}
            <span className={`qlc-badge ${conditionsSummary.allConfirmed ? 'ok' : 'muted'}`}>
              {conditionsSummary.confirmed}/{conditionsSummary.total}
            </span>
          </h3>
          {[...(subaccount.process?.conditions || [])]
            .sort((a, b) => CONDITION_ORDER.indexOf(a.type) - CONDITION_ORDER.indexOf(b.type))
            .map((c) => (
              <ConditionRow key={c.id} condition={c} onUpdate={updateCondition} t={t} />
            ))}
          <button className="qlc-btn primary" style={{ marginTop: 16, width: '100%' }} onClick={activate} disabled={subaccount.process?.isActivated}>
            {subaccount.process?.isActivated ? t('adminClientDetail.clientAlreadyActivated') : t('adminClientDetail.activateClient')}
          </button>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.model')}</h3>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>
            {subaccount.clientModel?.model ? getLocalizedModel(subaccount.clientModel.model, language).name : t('adminClientDetail.noModelAssigned')}
          </p>

          <h3>{t('adminClientDetail.apiConnection')} ({subaccount.exchangeName || 'Bitget'})</h3>
          {secrets && (secrets.apiKey || secrets.apiSecret || secrets.apiPassphrase) && (
            <div style={{ borderBottom: '1px solid var(--qlc-line)', paddingBottom: 12, marginBottom: 12 }}>
              <MaskedSecret label="API Key" value={secrets.apiKey} t={t} />
              <MaskedSecret label="Secret Key" value={secrets.apiSecret} t={t} />
              <MaskedSecret label="Passphrase" value={secrets.apiPassphrase} t={t} />
            </div>
          )}
          <form onSubmit={saveApi}>
            <label className="qlc-label">{t('adminClientDetail.identifier')}</label>
            <input className="qlc-input" value={apiForm.identifier} onChange={(e) => setApiForm((f) => ({ ...f, identifier: e.target.value }))} placeholder={subaccount.identifier || 'PCB-1-A-1'} />
            <label className="qlc-label">{t('adminClientDetail.requiredCapital')}</label>
            <input className="qlc-input" type="number" step="0.01" value={apiForm.requiredCapital} onChange={(e) => setApiForm((f) => ({ ...f, requiredCapital: e.target.value }))} placeholder="20" />
            {subaccount.capitalDistributionItems?.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
                {t('adminClientDetail.capitalReceived')}: {subaccount.capitalDistributionItems.reduce((sum, i) => sum + Number(i.amount), 0)} USDT
              </p>
            )}
            <label className="qlc-label">{t('adminClientDetail.status')}</label>
            <select className="qlc-select" value={apiForm.status} onChange={(e) => setApiForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="PENDIENTE">{t('adminClientDetail.apiStatusPending')}</option>
              <option value="CONECTADA">{t('adminClientDetail.apiStatusConnected')}</option>
              <option value="DESCONECTADA">{t('adminClientDetail.apiStatusDisconnected')}</option>
            </select>
            <label className="qlc-label">{t('adminClientDetail.connectionReason')}</label>
            <input
              className="qlc-input"
              value={apiForm.connectionReason}
              onChange={(e) => setApiForm((f) => ({ ...f, connectionReason: e.target.value }))}
              placeholder={t('adminClientDetail.connectionReasonPlaceholder')}
            />
            <label className="qlc-label">API Key {subaccount.hasApiKey ? t('adminClientDetail.alreadyRegistered') : ''}</label>
            <input className="qlc-input" value={apiForm.apiKey} onChange={(e) => setApiForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder={t('adminClientDetail.leaveBlank')} />
            <label className="qlc-label">Secret Key {subaccount.hasApiSecret ? t('adminClientDetail.alreadyRegistered') : ''}</label>
            <input className="qlc-input" type="password" value={apiForm.apiSecret} onChange={(e) => setApiForm((f) => ({ ...f, apiSecret: e.target.value }))} placeholder={t('adminClientDetail.leaveBlank')} />
            <label className="qlc-label">Passphrase {subaccount.hasApiPassphrase ? t('adminClientDetail.alreadyRegistered') : ''}</label>
            <input className="qlc-input" type="password" value={apiForm.apiPassphrase} onChange={(e) => setApiForm((f) => ({ ...f, apiPassphrase: e.target.value }))} placeholder={t('adminClientDetail.leaveBlank')} />
            <button className="qlc-btn primary" style={{ marginTop: 14, width: '100%' }}>
              {t('adminClientDetail.saveApiConnection')}
            </button>
          </form>
          {subaccount.clientReportedCapitalReady && (
            <p style={{ fontSize: 12, color: 'var(--qlc-ok)', marginTop: 10 }}>✓ {t('adminClientDetail.clientReportedCapital')}</p>
          )}

          {subaccount.connectionEvents?.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--qlc-line)', paddingTop: 12 }}>
              <h4 style={{ margin: '0 0 8px' }}>{t('adminClientDetail.connectionHistory')}</h4>
              <ul className="qlc-plain-list">
                {subaccount.connectionEvents.map((ev) => (
                  <li key={ev.id} style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
                    <span className={`qlc-badge ${ev.eventType === 'DISCONNECTED' ? 'danger' : 'ok'}`}>
                      {t(`adminClientDetail.connectionEvent${ev.eventType}`)}
                    </span>{' '}
                    {formatCdmxDate(ev.occurredAt)}
                    {ev.reason && ` — ${ev.reason}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.contract')}</h3>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            {t('adminClientDetail.status')}:{' '}
            <span className={`qlc-badge ${(CONTRACT_STATUS_LABELS[subaccount.contract?.status] || CONTRACT_STATUS_LABELS.PENDING).className}`}>
              {(CONTRACT_STATUS_LABELS[subaccount.contract?.status] || CONTRACT_STATUS_LABELS.PENDING).text}
            </span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="qlc-label">{t('adminClientDetail.originalLabel')}</label>
              <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={uploadContract} disabled={contractUploading} />
              {subaccount.contract?.originalDriveFileId && (
                <a href={`${API_BASE_URL}/admin/contracts/${subaccount.contract.id}/download/original`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  {t('adminClientDetail.viewOriginal')}: {subaccount.contract.originalFileName}
                </a>
              )}
            </div>
            {subaccount.contract?.signedDriveFileId && (
              <div>
                <label className="qlc-label">{t('adminClientDetail.signedLabel')}</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <a href={`${API_BASE_URL}/admin/contracts/${subaccount.contract.id}/download/signed`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                    {t('adminClientDetail.viewSigned')}: {subaccount.contract.signedFileName}
                  </a>
                  <button className="qlc-btn ghost" onClick={() => setConfirmResetSigned(true)}>
                    {t('adminClientDetail.deleteAllowResend')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminClientDetail.reportedPayments')} ({payments.length})
          </h3>
          {payments.length ? (
            <ul className="qlc-plain-list">
              {payments.map((p) => {
                const s = statusOf(paymentStatusMap, p.status, 'PENDING');
                return (
                  <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {p.amount} {p.currency} — <span className={`qlc-badge ${s.className}`}>{s.text}</span>
                      {p.proofDriveFileId && (
                        <>
                          {' '}· <a href={`${API_BASE_URL}/admin/payment-reports/${p.id}/proof`} target="_blank" rel="noreferrer">{t('adminClientDetail.viewProof')}</a>
                        </>
                      )}
                    </span>
                    {p.status !== 'APROBADO' && (
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button className="qlc-btn ghost" onClick={() => reviewPayment(p.id, 'APROBADO')}>{t('adminClientDetail.confirm')}</button>
                        <button className="qlc-btn ghost" onClick={() => reviewPayment(p.id, 'RECHAZADO')}>{t('adminClientDetail.reject')}</button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="qlc-empty">{t('adminClientDetail.noPaymentsReported')}</div>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.statements')} ({statements.length})</h3>
          {statements.length > 0 && (
            <ul className="qlc-plain-list" style={{ marginBottom: 14 }}>
              {statements.map((s) => {
                const stStatus = statusOf(statementStatusMap, s.displayStatus, 'DISPONIBLE');
                return (
                  <li key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--qlc-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{formatCdmxDate(s.periodStart)} – {formatCdmxDate(s.periodEnd)} · {s.resultPercentage}%</span>
                      <span className={`qlc-badge ${stStatus.className}`}>{stStatus.text}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {s.pdfDriveFileId && (
                          <a href={`${API_BASE_URL}/admin/statements/${s.id}/download`} target="_blank" rel="noreferrer">{t('clientSubaccountDetail.viewPdf')}</a>
                        )}
                        <label style={{ cursor: 'pointer', color: 'var(--qlc-muted)' }}>
                          {evidenceUploading === s.id ? t('common.saving') : t('adminClientDetail.uploadEvidence')}
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: 'none' }}
                            disabled={evidenceUploading === s.id}
                            onChange={(e) => uploadEvidence(s.id, e.target.files[0])}
                          />
                        </label>
                      </span>
                      <button className="qlc-btn ghost" disabled={sendingStatement === s.id} onClick={() => sendStatementToClient(s.id)}>
                        {sendingStatement === s.id ? t('common.sending') : t('adminClientDetail.sendToClient')}
                      </button>
                    </div>
                    {s.evidenceDocuments?.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
                        {t('adminClientDetail.statementEvidence')}:{' '}
                        {s.evidenceDocuments.map((d, idx) => (
                          <span key={d.id}>
                            {idx > 0 && ', '}
                            <a href={`${API_BASE_URL}/admin/documents/${d.id}/download`} target="_blank" rel="noreferrer">{d.fileName}</a>
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <form onSubmit={createStatement} style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14 }}>
            <h4 style={{ margin: '0 0 8px' }}>{t('adminClientDetail.newStatement')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {hasPreviousStatement ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="qlc-label">{t('adminClientDetail.periodStart')}</label>
                  <input className="qlc-input" value={formatCdmxDate(latestPeriodEnd)} disabled />
                  <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>{t('adminClientDetail.periodStartAuto')}</p>
                </div>
              ) : (
                <div>
                  <label className="qlc-label">{t('adminClientDetail.periodStart')}</label>
                  <input className="qlc-input" type="date" value={statementForm.periodStart} onChange={(e) => setStatementForm((f) => ({ ...f, periodStart: e.target.value }))} required />
                </div>
              )}
              <div>
                <label className="qlc-label">{t('adminClientDetail.periodEnd')}</label>
                <input className="qlc-input" type="date" value={statementForm.periodEnd} onChange={(e) => setStatementForm((f) => ({ ...f, periodEnd: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.startingBalance')}</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.startingBalance} onChange={(e) => setStatementForm((f) => ({ ...f, startingBalance: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.endingBalance')}</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.endingBalance} onChange={(e) => setStatementForm((f) => ({ ...f, endingBalance: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.resultAmount')}</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.resultAmount} onChange={(e) => setStatementForm((f) => ({ ...f, resultAmount: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.resultPercentage')}</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.resultPercentage} onChange={(e) => setStatementForm((f) => ({ ...f, resultPercentage: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.volatility')}</label>
                <input className="qlc-input" value={statementForm.volatility} onChange={(e) => setStatementForm((f) => ({ ...f, volatility: e.target.value }))} />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.netResult')}</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.netResult} onChange={(e) => setStatementForm((f) => ({ ...f, netResult: e.target.value }))} />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.commission')}</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.commission} onChange={(e) => setStatementForm((f) => ({ ...f, commission: e.target.value }))} />
              </div>
            </div>
            <label className="qlc-label">{t('adminClientDetail.activityNotes')}</label>
            <textarea className="qlc-textarea" rows={2} value={statementForm.activityNotes} onChange={(e) => setStatementForm((f) => ({ ...f, activityNotes: e.target.value }))} />
            <label className="qlc-label">{t('adminClientDetail.adminNotes')}</label>
            <textarea className="qlc-textarea" rows={2} value={statementForm.adminNotes} onChange={(e) => setStatementForm((f) => ({ ...f, adminNotes: e.target.value }))} />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={creatingStatement}>
              {creatingStatement ? t('common.saving') : t('adminClientDetail.generateStatement')}
            </button>
          </form>
        </div>
      </div>

      {confirmResetSigned && (
        <ConfirmModal
          title={t('adminClientDetail.resetSignedTitle')}
          message={t('adminClientDetail.resetSignedMessage')}
          confirmLabel={t('adminClientDetail.delete')}
          twoStep
          onClose={() => setConfirmResetSigned(false)}
          onConfirm={resetSignedContract}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { ACCOUNT_STATUS, PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';

function ConditionRow({ condition, onUpdate, t }) {
  const [saving, setSaving] = useState(false);

  const CONDITION_LABELS = {
    CONTRACT: t('status.conditionType.CONTRACT'),
    FUNDS: t('status.conditionType.FUNDS'),
    PAYMENT: t('status.conditionType.PAYMENT'),
    API: t('status.conditionType.API'),
    ACTIVATION: t('status.conditionType.ACTIVATION'),
  };
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
      <span>{CONDITION_LABELS[condition.type] || condition.type}</span>
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

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [client, setClient] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [apiForm, setApiForm] = useState({ apiKey: '', apiSecret: '', status: 'PENDIENTE' });
  const [docForm, setDocForm] = useState({ category: 'identificacion', description: '' });
  const [uploading, setUploading] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [confirmResetSigned, setConfirmResetSigned] = useState(false);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);

  const accountStatusMap = ACCOUNT_STATUS(t);
  const paymentReportStatusMap = PAYMENT_REPORT_STATUS(t);
  const contractStatusText = {
    PENDING: t('status.contract.pending'),
    UPLOADED: t('status.contract.uploaded'),
    RECEIVED_SIGNED: t('status.contract.receivedSigned'),
    REJECTED: t('status.contract.rejected'),
  };
  const CATEGORIES = [
    { value: 'identificacion', label: t('adminClientDetail.categoryId') },
    { value: 'comprobante_domicilio', label: t('adminClientDetail.categoryAddress') },
    { value: 'otro', label: t('adminClientDetail.categoryOther') },
  ];

  const load = () => {
    api
      .get(`/admin/clients/${id}`)
      .then(({ data }) => {
        setClient(data.client);
        setApiForm((f) => ({ ...f, status: data.client.apiConnection?.status || 'PENDIENTE' }));
        setContract(data.client.contracts?.[0] || null);
      })
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  };

  useEffect(load, [id]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const updateCondition = async (type, status) => {
    await api.patch(`/admin/clients/${id}/process/${type}`, { status });
    flash(t('adminClientDetail.conditionUpdated'));
    load();
  };

  const toggleActive = async (isActive) => {
    await api.patch(`/admin/clients/${id}/active`, { isActive });
    flash(isActive ? t('adminClientDetail.clientActivated') : t('adminClientDetail.clientDeactivated'));
    load();
  };

  const activate = async () => {
    try {
      await api.post(`/admin/clients/${id}/activate`);
      flash(t('adminClientDetail.clientActivatedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  const saveApiConnection = async (e) => {
    e.preventDefault();
    const payload = { status: apiForm.status };
    if (apiForm.apiKey) payload.apiKey = apiForm.apiKey;
    if (apiForm.apiSecret) payload.apiSecret = apiForm.apiSecret;
    await api.patch(`/admin/clients/${id}/api-connection`, payload);
    setApiForm((f) => ({ ...f, apiKey: '', apiSecret: '' }));
    flash(t('adminClientDetail.apiConnectionUpdated'));
    load();
  };

  const uploadContract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading('contract');
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/admin/clients/${id}/contracts`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      flash(t('adminClientDetail.contractUploaded'));
      load();
    } catch (err) {
      setUploadError(translateBackendMessage(err.message, language));
    } finally {
      setUploading('');
      e.target.value = '';
    }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    const file = e.target.elements.docFile.files[0];
    if (!file) return;
    setUploading('document');
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', docForm.category);
    fd.append('description', docForm.description);
    try {
      await api.post(`/admin/clients/${id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      flash(t('adminClientDetail.documentUploaded'));
      e.target.reset();
      setDocForm((f) => ({ ...f, description: '' }));
      load();
    } catch (err) {
      setUploadError(translateBackendMessage(err.message, language));
    } finally {
      setUploading('');
    }
  };

  const removeDocument = async (docId) => {
    await api.delete(`/admin/documents/${docId}`);
    flash(t('adminClientDetail.documentDeleted'));
    load();
  };

  const confirmDeactivateAccount = async () => {
    await toggleActive(false);
  };

  const resetSignedContract = async () => {
    await api.post(`/admin/contracts/${contract.id}/reset-signed`);
    flash(t('adminClientDetail.signedContractRemoved'));
    load();
  };

  const deleteClientAccount = async () => {
    await api.delete(`/admin/clients/${id}`);
    navigate('/admin/clients');
  };

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!client) return <div className="qlc-empty">{t('adminClientDetail.loadingClient')}</div>;

  const clientAccStatus = statusOf(accountStatusMap, client.status);
  const conditionsSummary = client.conditionsSummary || { total: 0, confirmed: 0, allConfirmed: false };

  return (
    <div>
      <Link to="/admin/clients" style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
        {t('adminClientDetail.backToClients')}
      </Link>

      <div className="qlc-page-header" style={{ marginTop: 10 }}>
        <div>
          <div className="qlc-kicker">{t('adminClientDetail.kicker')}</div>
          <h1 style={{ margin: 0 }}>
            {client.firstName} {client.lastName}
          </h1>
          <div style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>
            {client.user?.email} · @{client.user?.username}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`qlc-badge ${clientAccStatus.className}`}>{clientAccStatus.text}</span>
          {client.user?.isActive ? (
            <button className="qlc-btn danger" onClick={() => setConfirmDeactivate(true)}>
              {t('adminClientDetail.deactivate')}
            </button>
          ) : (
            <button className="qlc-btn primary" onClick={() => toggleActive(true)}>
              {t('adminClientDetail.activateAccount')}
            </button>
          )}
          <button className="qlc-btn danger" onClick={() => setConfirmDeleteClient(true)}>
            {t('adminClientDetail.deleteClient')}
          </button>
        </div>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {uploadError && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>
          {uploadError}
        </div>
      )}

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {t('adminClientDetail.activationProcess')}
            <span className={`qlc-badge ${conditionsSummary.allConfirmed ? 'ok' : 'muted'}`}>
              {conditionsSummary.confirmed}/{conditionsSummary.total}
            </span>
          </h3>
          {client.process?.conditions?.map((c) => (
            <ConditionRow key={c.id} condition={c} onUpdate={updateCondition} t={t} />
          ))}
          <button
            className="qlc-btn primary"
            style={{ marginTop: 16, width: '100%' }}
            onClick={activate}
            disabled={client.process?.isActivated}
          >
            {client.process?.isActivated ? t('adminClientDetail.clientAlreadyActivated') : t('adminClientDetail.activateClient')}
          </button>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.model')}</h3>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>
            {client.clientModel?.model
              ? getLocalizedModel(client.clientModel.model, language).name
              : t('adminClientDetail.noModelAssigned')}
          </p>
          <h3>
            {t('adminClientDetail.apiConnection')} ({client.apiConnection?.exchangeName || 'Bitget'})
          </h3>
          {(client.apiConnection?.apiKey || client.apiConnection?.apiSecret) && (
            <div style={{ borderBottom: '1px solid var(--qlc-line)', paddingBottom: 12, marginBottom: 12 }}>
              <MaskedSecret label="API Key" value={client.apiConnection?.apiKey} t={t} />
              <MaskedSecret label="API Secret" value={client.apiConnection?.apiSecret} t={t} />
            </div>
          )}
          <form onSubmit={saveApiConnection}>
            <label className="qlc-label">{t('adminClientDetail.status')}</label>
            <select
              className="qlc-select"
              value={apiForm.status}
              onChange={(e) => setApiForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="PENDIENTE">{t('adminClientDetail.apiStatusPending')}</option>
              <option value="CONECTADA">{t('adminClientDetail.apiStatusConnected')}</option>
              <option value="DESCONECTADA">{t('adminClientDetail.apiStatusDisconnected')}</option>
            </select>
            <label className="qlc-label">
              API Key {client.apiConnection?.hasApiKey ? t('adminClientDetail.alreadyRegistered') : ''}
            </label>
            <input
              className="qlc-input"
              value={apiForm.apiKey}
              onChange={(e) => setApiForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder={t('adminClientDetail.leaveBlank')}
            />
            <label className="qlc-label">
              API Secret {client.apiConnection?.hasApiSecret ? t('adminClientDetail.alreadyRegistered') : ''}
            </label>
            <input
              className="qlc-input"
              type="password"
              value={apiForm.apiSecret}
              onChange={(e) => setApiForm((f) => ({ ...f, apiSecret: e.target.value }))}
              placeholder={t('adminClientDetail.leaveBlank')}
            />
            <button className="qlc-btn primary" style={{ marginTop: 14, width: '100%' }}>
              {t('adminClientDetail.saveApiConnection')}
            </button>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.contract')}</h3>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            {t('adminClientDetail.status')}:{' '}
            <span className="qlc-badge warn">{contractStatusText[contract?.status] || contractStatusText.PENDING}</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="qlc-label">{t('adminClientDetail.originalLabel')}</label>
              <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={uploadContract} disabled={uploading === 'contract'} />
              {contract?.originalDriveFileId && (
                <a
                  href={`${API_BASE_URL}/admin/contracts/${contract.id}/download/original`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12 }}
                >
                  {t('adminClientDetail.viewOriginal')}: {contract.originalFileName}
                </a>
              )}
            </div>
            {contract?.signedDriveFileId && (
              <div>
                <label className="qlc-label">{t('adminClientDetail.signedLabel')}</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <a
                    href={`${API_BASE_URL}/admin/contracts/${contract.id}/download/signed`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12 }}
                  >
                    {t('adminClientDetail.viewSigned')}: {contract.signedFileName}
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
            {t('adminClientDetail.documents')} ({client.documents?.length || 0})
          </h3>
          {client.documents?.length ? (
            <ul className="qlc-plain-list">
              {client.documents.map((d) => (
                <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <a href={`${API_BASE_URL}/admin/documents/${d.id}/download`} target="_blank" rel="noreferrer">
                      {d.fileName}
                    </a>{' '}
                    <span style={{ color: 'var(--qlc-muted2)' }}>({d.category})</span>
                  </span>
                  <button className="qlc-btn ghost" onClick={() => setConfirmDeleteDoc(d)}>
                    {t('adminClientDetail.delete')}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="qlc-empty">{t('adminClientDetail.noDocuments')}</div>
          )}

          <form onSubmit={uploadDocument} style={{ marginTop: 14, borderTop: '1px solid var(--qlc-line)', paddingTop: 14 }}>
            <label className="qlc-label">{t('adminClientDetail.category')}</label>
            <select
              className="qlc-select"
              value={docForm.category}
              onChange={(e) => setDocForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="qlc-label">{t('adminClientDetail.description')}</label>
            <input
              className="qlc-input"
              value={docForm.description}
              onChange={(e) => setDocForm((f) => ({ ...f, description: e.target.value }))}
            />
            <label className="qlc-label">{t('adminClientDetail.file')}</label>
            <input type="file" name="docFile" className="qlc-input" accept=".pdf,image/*" required />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={uploading === 'document'}>
              {uploading === 'document' ? t('adminClientDetail.uploading') : t('adminClientDetail.uploadDocument')}
            </button>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminClientDetail.reportedPayments')} ({client.paymentReports?.length || 0})
          </h3>
          {client.paymentReports?.length ? (
            <ul className="qlc-plain-list">
              {client.paymentReports.map((p) => {
                const s = statusOf(paymentReportStatusMap, p.status, 'PENDING');
                return (
                  <li key={p.id}>
                    {p.amount} {p.currency} — <span className={`qlc-badge ${s.className}`}>{s.text}</span>
                    {p.proofDriveFileId && (
                      <>
                        {' '}
                        ·{' '}
                        <a href={`${API_BASE_URL}/admin/payment-reports/${p.id}/proof`} target="_blank" rel="noreferrer">
                          {t('adminClientDetail.viewProof')}
                        </a>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="qlc-empty">{t('adminClientDetail.noPaymentsReported')}</div>
          )}
        </div>
      </div>

      {confirmDeactivate && (
        <ConfirmModal
          title={t('adminClientDetail.deactivateTitle')}
          message={t('adminClientDetail.deactivateMessage').replace('{name}', `${client.firstName} ${client.lastName}`)}
          confirmLabel={t('adminClientDetail.deactivate')}
          onClose={() => setConfirmDeactivate(false)}
          onConfirm={confirmDeactivateAccount}
        />
      )}

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

      {confirmDeleteDoc && (
        <ConfirmModal
          title={t('adminClientDetail.deleteDocTitle')}
          message={t('adminClientDetail.deleteDocMessage').replace('{fileName}', confirmDeleteDoc.fileName)}
          confirmLabel={t('adminClientDetail.delete')}
          twoStep
          onClose={() => setConfirmDeleteDoc(null)}
          onConfirm={() => removeDocument(confirmDeleteDoc.id)}
        />
      )}

      {confirmDeleteClient && (
        <ConfirmModal
          title={t('adminClientDetail.deleteClientTitle')}
          message={t('adminClientDetail.deleteClientMessage').replace('{name}', `${client.firstName} ${client.lastName}`)}
          confirmLabel={t('adminClientDetail.deleteClient')}
          twoStep
          onClose={() => setConfirmDeleteClient(false)}
          onConfirm={deleteClientAccount}
        />
      )}
    </div>
  );
}

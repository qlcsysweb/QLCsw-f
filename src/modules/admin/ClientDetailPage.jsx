import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { ACCOUNT_STATUS, API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import CapitalIncreasePanel from './CapitalIncreasePanel';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [client, setClient] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [docForm, setDocForm] = useState({ category: 'identificacion', description: '' });
  const [uploading, setUploading] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);
  const [creatingSubaccount, setCreatingSubaccount] = useState(false);
  const [newIdentifier, setNewIdentifier] = useState('');

  const accountStatusMap = ACCOUNT_STATUS(t);
  const apiStatusMap = API_CONNECTION_STATUS(t);
  const CATEGORIES = [
    { value: 'identificacion', label: t('adminClientDetail.categoryId') },
    { value: 'otro', label: t('adminClientDetail.categoryOther') },
  ];

  const load = () => {
    api
      .get(`/admin/clients/${id}`)
      .then(({ data }) => setClient(data.client))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  };
  useEffect(load, [id]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleActive = async (isActive) => {
    await api.patch(`/admin/clients/${id}/active`, { isActive });
    flash(isActive ? t('adminClientDetail.clientActivated') : t('adminClientDetail.clientDeactivated'));
    load();
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    const file = e.target.elements.docFile.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', docForm.category);
    fd.append('description', docForm.description);
    try {
      await api.post(`/admin/clients/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash(t('adminClientDetail.documentUploaded'));
      e.target.reset();
      setDocForm((f) => ({ ...f, description: '' }));
      load();
    } catch (err) {
      setUploadError(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (docId) => {
    await api.delete(`/admin/documents/${docId}`);
    flash(t('adminClientDetail.documentDeleted'));
    load();
  };

  const toggleDocUnlock = async (doc) => {
    await api.patch(`/admin/documents/${doc.id}/unlock`, { unlocked: !doc.clientEditUnlocked });
    flash(doc.clientEditUnlocked ? t('adminClientDetail.documentLocked') : t('adminClientDetail.documentUnlocked'));
    load();
  };

  const confirmDeactivateAccount = async () => {
    await toggleActive(false);
  };

  const deleteClientAccount = async () => {
    await api.delete(`/admin/clients/${id}`);
    navigate('/admin/clients');
  };

  const createSubaccount = async () => {
    setCreatingSubaccount(true);
    setError('');
    try {
      await api.post(`/admin/clients/${id}/api-subaccounts`, newIdentifier ? { identifier: newIdentifier } : {});
      setNewIdentifier('');
      flash(t('adminClientDetail.subaccountCreated'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setCreatingSubaccount(false);
    }
  };

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!client) return <div className="qlc-empty">{t('adminClientDetail.loadingClient')}</div>;

  const clientAccStatus = statusOf(accountStatusMap, client.status);
  const subaccounts = client.apiSubaccounts || [];
  const canAddSubaccount = subaccounts.length < 20;

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
            <a href={`mailto:${client.user?.email}`}>{client.user?.email}</a>
          </div>
          {client.nationality && (
            <div style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>
              {t('adminClientDetail.nationality')}: {client.nationality}
            </div>
          )}
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

      <div className="qlc-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('adminClientDetail.subaccounts')} ({subaccounts.length}/20)
          {canAddSubaccount && (
            <span style={{ display: 'flex', gap: 8 }}>
              <input
                className="qlc-input"
                style={{ width: 160 }}
                placeholder={t('adminClientDetail.identifierPlaceholder')}
                value={newIdentifier}
                onChange={(e) => setNewIdentifier(e.target.value)}
              />
              <button className="qlc-btn primary" disabled={creatingSubaccount} onClick={createSubaccount}>
                {creatingSubaccount ? t('common.saving') : t('adminClientDetail.newSubaccount')}
              </button>
            </span>
          )}
        </h3>
        {subaccounts.length === 0 ? (
          <div className="qlc-empty">{t('adminClientDetail.noSubaccounts')}</div>
        ) : (
          <table className="qlc-table">
            <thead>
              <tr>
                <th>{t('adminClientDetail.identifier')}</th>
                <th>{t('adminClientDetail.model')}</th>
                <th>{t('adminClientDetail.api')}</th>
                <th>{t('adminClientDetail.activationProcess')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subaccounts.map((s) => {
                const apiStatus = statusOf(apiStatusMap, s.status, 'PENDIENTE');
                const cs = s.conditionsSummary || { confirmed: 0, total: 0, allConfirmed: false };
                return (
                  <tr key={s.id}>
                    <td>{s.identifier || t('adminClientDetail.unassignedIdentifier')}</td>
                    <td>{s.clientModel?.model ? getLocalizedModel(s.clientModel.model, language).name : t('adminClientDetail.noModelAssigned')}</td>
                    <td>
                      <span className={`qlc-badge ${apiStatus.className}`}>{apiStatus.text}</span>
                    </td>
                    <td>
                      <span className={`qlc-badge ${cs.allConfirmed ? 'ok' : 'muted'}`}>
                        {cs.confirmed}/{cs.total}
                      </span>
                    </td>
                    <td>
                      <Link className="qlc-btn ghost" to={`/admin/clients/${id}/api-subaccounts/${s.id}`}>
                        {t('adminClientsList.view')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CapitalIncreasePanel clientId={id} subaccounts={subaccounts} />

      <div className="qlc-detail-grid">
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
                    {d.clientEditUnlocked && (
                      <span className="qlc-badge warn" style={{ marginLeft: 6 }}>
                        {t('adminClientDetail.unlockedForClient')}
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button className="qlc-btn ghost" onClick={() => toggleDocUnlock(d)}>
                      {d.clientEditUnlocked ? t('adminClientDetail.lockDocument') : t('adminClientDetail.unlockDocument')}
                    </button>
                    <button className="qlc-btn ghost" onClick={() => setConfirmDeleteDoc(d)}>
                      {t('adminClientDetail.delete')}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="qlc-empty">{t('adminClientDetail.noDocuments')}</div>
          )}

          <form onSubmit={uploadDocument} style={{ marginTop: 14, borderTop: '1px solid var(--qlc-line)', paddingTop: 14 }}>
            <label className="qlc-label">{t('adminClientDetail.category')}</label>
            <select className="qlc-select" value={docForm.category} onChange={(e) => setDocForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="qlc-label">{t('adminClientDetail.description')}</label>
            <input className="qlc-input" value={docForm.description} onChange={(e) => setDocForm((f) => ({ ...f, description: e.target.value }))} />
            <label className="qlc-label">{t('adminClientDetail.file')}</label>
            <input type="file" name="docFile" className="qlc-input" accept=".pdf,image/*" required />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={uploading}>
              {uploading ? t('adminClientDetail.uploading') : t('adminClientDetail.uploadDocument')}
            </button>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.wallet')}</h3>
          {client.walletAddress ? (
            <>
              <p style={{ fontSize: 13 }}>
                <strong>{t('clientWallet.network')}:</strong> {client.walletNetwork || '—'}
              </p>
              <p style={{ fontSize: 13, wordBreak: 'break-all' }}>
                <strong>{t('clientWallet.address')}:</strong> {client.walletAddress}
              </p>
              {client.walletQrUrl && <img src={client.walletQrUrl} alt="QR wallet" style={{ width: 130, borderRadius: 10 }} />}
            </>
          ) : (
            <div className="qlc-empty">{t('adminClientDetail.noWallet')}</div>
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

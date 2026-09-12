import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';
import { ACCOUNT_STATUS, API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import CapitalIncreasePanel from './CapitalIncreasePanel';
import CapitalRescuePanel from './CapitalRescuePanel';

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
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);
  const [deleteSecurityPassword, setDeleteSecurityPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [creatingSubaccount, setCreatingSubaccount] = useState(false);
  const [newIdentifier, setNewIdentifier] = useState('');
  const [walletCopied, setWalletCopied] = useState(false);
  // CORREGIR.xlsx ADMIN 14 — mensajería manual admin→cliente.
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ title: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  // CORREGIR.xlsx ADMIN 07 — organización Año/Periodo/Mes de documentos.
  const [orgDraft, setOrgDraft] = useState({});

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
    api.get(`/admin/clients/${id}/messages`).then(({ data }) => setMessages(data.messages));
  };
  useEffect(load, [id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    setSendingMessage(true);
    try {
      await api.post(`/admin/clients/${id}/messages`, messageForm);
      setMessageForm({ title: '', message: '' });
      flash(t('adminMessages.sentOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSendingMessage(false);
    }
  };

  const saveDocOrganization = async (doc) => {
    const draft = orgDraft[doc.id] || {};
    await api.patch(`/admin/documents/${doc.id}/organize`, {
      year: draft.year ?? doc.year ?? null,
      month: draft.month ?? doc.month ?? null,
      periodLabel: draft.periodLabel ?? doc.periodLabel ?? null,
    });
    load();
  };

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
      setShowUploadForm(false);
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

  // CORREGIR.xlsx ADMIN 06: la eliminación exige la contraseña de
  // seguridad exclusiva (solo el administrador general puede tenerla) —
  // validada siempre en backend, nunca solo aquí.
  const deleteClientAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/clients/${id}`, { data: { securityPassword: deleteSecurityPassword } });
      navigate('/admin/clients');
    } catch (err) {
      setDeleteError(translateBackendMessage(err.message, language));
    } finally {
      setDeleting(false);
    }
  };

  const copyWalletValue = (value) => {
    navigator.clipboard?.writeText(value || '');
    setWalletCopied(true);
    setTimeout(() => setWalletCopied(false), 2000);
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
  // La cuenta PRINCIPAL (isPrincipal) nunca cuenta contra el máximo de 20.
  const numberedSubaccounts = subaccounts.filter((s) => !s.isPrincipal);
  const canAddSubaccount = numberedSubaccounts.length < 20;

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
          {t('adminClientDetail.subaccounts')} ({numberedSubaccounts.length}/20)
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
                    <td>{s.isPrincipal ? t('clientSubaccounts.principalLabel') : (s.identifier || t('adminClientDetail.unassignedIdentifier'))}</td>
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

      <CapitalIncreasePanel clientId={id} />
      <CapitalRescuePanel clientId={id} subaccounts={subaccounts} />

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminClientDetail.documents')} ({client.documents?.length || 0})
          </h3>
          {client.documents?.length ? (
            <ul className="qlc-plain-list">
              {client.documents.map((d) => {
                const draft = orgDraft[d.id] || {};
                return (
                  <li key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0', borderBottom: '1px solid var(--qlc-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        <strong>{d.fileName}</strong>{' '}
                        <span style={{ color: 'var(--qlc-muted2)' }}>({d.category})</span>
                        {d.clientEditUnlocked && (
                          <span className="qlc-badge warn" style={{ marginLeft: 6 }}>
                            {t('adminClientDetail.unlockedForClient')}
                          </span>
                        )}
                      </span>
                      <span style={{ display: 'flex', gap: 6 }}>
                        <a
                          className="qlc-btn primary"
                          href={`${API_BASE_URL}/admin/documents/${d.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('adminClientDetail.viewDocument')}
                        </a>
                        <button className="qlc-btn ghost" onClick={() => toggleDocUnlock(d)}>
                          {d.clientEditUnlocked ? t('adminClientDetail.lockDocument') : t('adminClientDetail.unlockDocument')}
                        </button>
                        <button className="qlc-btn ghost" onClick={() => setConfirmDeleteDoc(d)}>
                          {t('adminClientDetail.delete')}
                        </button>
                      </span>
                    </div>
                    {/* CORREGIR.xlsx ADMIN 07 — organización Año/Periodo/Mes tipo Drive */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        className="qlc-input"
                        style={{ width: 90 }}
                        type="number"
                        placeholder={t('adminClientDetail.docYear')}
                        defaultValue={d.year || ''}
                        onChange={(e) => setOrgDraft((v) => ({ ...v, [d.id]: { ...v[d.id], year: e.target.value ? Number(e.target.value) : null } }))}
                      />
                      <input
                        className="qlc-input"
                        style={{ width: 140 }}
                        placeholder={t('adminClientDetail.docPeriod')}
                        defaultValue={d.periodLabel || ''}
                        onChange={(e) => setOrgDraft((v) => ({ ...v, [d.id]: { ...v[d.id], periodLabel: e.target.value || null } }))}
                      />
                      <input
                        className="qlc-input"
                        style={{ width: 70 }}
                        type="number"
                        min={1}
                        max={12}
                        placeholder={t('adminClientDetail.docMonth')}
                        defaultValue={d.month || ''}
                        onChange={(e) => setOrgDraft((v) => ({ ...v, [d.id]: { ...v[d.id], month: e.target.value ? Number(e.target.value) : null } }))}
                      />
                      <button className="qlc-btn ghost" onClick={() => saveDocOrganization(d)}>
                        {t('common.save')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="qlc-empty">{t('adminClientDetail.noDocuments')}</div>
          )}

          {/* El admin no necesita volver a cargar un documento que ya
              existe — su rol aquí es visualizar/imprimir. Subir uno nuevo
              (identificación, u otra categoría) sigue disponible pero
              queda detrás de este botón en vez de ser lo primero que se ve. */}
          {showUploadForm ? (
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
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="qlc-btn primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? t('adminClientDetail.uploading') : t('adminClientDetail.uploadDocument')}
                </button>
                <button type="button" className="qlc-btn ghost" onClick={() => setShowUploadForm(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="qlc-btn ghost"
              style={{ marginTop: 14, width: '100%' }}
              onClick={() => setShowUploadForm(true)}
            >
              {t('adminClientDetail.uploadNewDocument')}
            </button>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.wallet')}</h3>
          {/* CORREGIR.xlsx ADMIN 10 — WALLET/RED/COPIAR siempre visibles,
              incluso sin dato registrado todavía. */}
          <p style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>
              <strong>{t('clientWallet.network')}:</strong> {client.walletNetwork || t('adminClientDetail.noWalletDataShort')}
            </span>
          </p>
          <p style={{ fontSize: 13, wordBreak: 'break-all', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <span>
              <strong>{t('clientWallet.address')}:</strong> {client.walletAddress || t('adminClientDetail.noWalletDataShort')}
            </span>
            <button
              className="qlc-btn ghost"
              style={{ flexShrink: 0 }}
              disabled={!client.walletAddress}
              onClick={() => copyWalletValue(client.walletAddress)}
            >
              {walletCopied ? t('clientPayments.walletCopied') : t('clientPayments.copyWallet')}
            </button>
          </p>
          {client.walletQrUrl && <img src={client.walletQrUrl} alt="QR wallet" style={{ width: 130, borderRadius: 10 }} />}
          {!client.walletAddress && <div className="qlc-empty">{t('adminClientDetail.noWallet')}</div>}
        </div>

        {/* CORREGIR.xlsx ADMIN 14 — mensajería manual admin→cliente. */}
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminMessages.title')}</h3>
          <form onSubmit={sendMessage}>
            <label className="qlc-label">{t('adminMessages.subject')}</label>
            <input
              className="qlc-input"
              value={messageForm.title}
              onChange={(e) => setMessageForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <label className="qlc-label">{t('adminMessages.content')}</label>
            <textarea
              className="qlc-textarea"
              rows={3}
              value={messageForm.message}
              onChange={(e) => setMessageForm((f) => ({ ...f, message: e.target.value }))}
              required
            />
            <button className="qlc-btn primary" style={{ marginTop: 10 }} disabled={sendingMessage}>
              {sendingMessage ? t('common.sending') : t('adminMessages.send')}
            </button>
          </form>

          {messages.length > 0 && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--qlc-line)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--qlc-muted)', marginBottom: 6 }}>{t('adminMessages.history')}</div>
              <ul className="qlc-plain-list">
                {messages.map((m) => (
                  <li key={m.id} style={{ fontSize: 12, marginBottom: 8 }}>
                    <strong>{m.title}</strong> — {new Date(m.createdAt).toLocaleString()}
                    <div style={{ color: 'var(--qlc-muted2)' }}>{m.message}</div>
                  </li>
                ))}
              </ul>
            </div>
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
        <Modal
          title={t('adminClientDetail.deleteClientTitle')}
          onClose={() => {
            setConfirmDeleteClient(false);
            setDeleteSecurityPassword('');
            setDeleteError('');
          }}
          width={440}
        >
          <p style={{ color: 'var(--qlc-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
            {t('adminClientDetail.deleteClientMessage').replace('{name}', `${client.firstName} ${client.lastName}`)}
          </p>
          <p style={{ color: 'var(--qlc-gold)', fontSize: 13, fontWeight: 600 }}>{t('modals.cannotBeUndone')}</p>
          <label className="qlc-label">{t('adminClientDetail.securityPasswordLabel')}</label>
          <input
            className="qlc-input"
            type="password"
            value={deleteSecurityPassword}
            onChange={(e) => setDeleteSecurityPassword(e.target.value)}
            autoFocus
          />
          {deleteError && <div className="qlc-field-error">{deleteError}</div>}
          <div className="qlc-form-actions">
            <button
              className="qlc-btn ghost"
              onClick={() => {
                setConfirmDeleteClient(false);
                setDeleteSecurityPassword('');
                setDeleteError('');
              }}
              disabled={deleting}
            >
              {t('modals.cancel')}
            </button>
            <button className="qlc-btn danger" onClick={deleteClientAccount} disabled={deleting || !deleteSecurityPassword}>
              {deleting ? t('modals.processing') : t('adminClientDetail.deleteClient')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

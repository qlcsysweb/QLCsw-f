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
import usePolling from '../../hooks/usePolling';
import CollapsibleSection from '../../components/CollapsibleSection';

// CORRECCIÓN 7 (bloque de 20) — fila reutilizable para no duplicar el JSX
// entre subcuentas activas/principal e inactivas colapsadas.
//
// GESTIÓN DINÁMICA DE SUBCUENTAS — toda subcuenta activa (removedAt=null)
// es, por definición, visible para el cliente; ya no existe el concepto de
// "oculta". En su lugar, cada subcuenta numerada (nunca la PRINCIPAL) puede
// eliminarse (onRemove) — eliminación lógica: deja de estar activa para el
// cliente, pero su historial se conserva.
function SubaccountRow({ s, id, t, language, apiStatusMap, onRemove }) {
  const apiStatus = statusOf(apiStatusMap, s.status, 'PENDIENTE');
  const cs = s.conditionsSummary || { confirmed: 0, total: 0, allConfirmed: false };
  return (
    <tr>
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
      <td style={{ display: 'flex', gap: 6 }}>
        <Link className="qlc-btn ghost" to={`/admin/clients/${id}/api-subaccounts/${s.id}`}>
          {t('adminClientsList.view')}
        </Link>
        {!s.isPrincipal && (
          <button type="button" className="qlc-btn ghost" onClick={() => onRemove(s)}>
            {t('adminClientDetail.removeSubaccount')}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [client, setClient] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [confirmDeleteWarn, setConfirmDeleteWarn] = useState(false);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);
  const [deleteSecurityPassword, setDeleteSecurityPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [creatingSubaccount, setCreatingSubaccount] = useState(false);
  const [newIdentifier, setNewIdentifier] = useState('');
  const [copiedWalletField, setCopiedWalletField] = useState(null);
  const [showInactiveSubaccounts, setShowInactiveSubaccounts] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approveCreateTarget, setApproveCreateTarget] = useState(null);
  const [approveIdentifier, setApproveIdentifier] = useState('');
  const [approveCapital, setApproveCapital] = useState('');
  const [approveDeleteTarget, setApproveDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [requestActionError, setRequestActionError] = useState('');
  // CORREGIR.xlsx ADMIN 14 — mensajería manual admin→cliente.
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ title: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  // CORREGIR.xlsx ADMIN 07 — organización Año/Periodo/Mes de documentos.
  const [orgDraft, setOrgDraft] = useState({});
  // AUDITORÍA QLC PARTE 1 — vista previa embebida (imagen ampliada / PDF
  // con visor nativo) antes de imprimir, sin salir de la página.
  const [previewDoc, setPreviewDoc] = useState(null);

  const accountStatusMap = ACCOUNT_STATUS(t);
  const apiStatusMap = API_CONNECTION_STATUS(t);
  const load = () => {
    api
      .get(`/admin/clients/${id}`)
      .then(({ data }) => setClient(data.client))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
    api.get(`/admin/clients/${id}/messages`).then(({ data }) => setMessages(data.messages));
    api
      .get('/admin/subaccount-requests', { params: { status: 'PENDING' } })
      .then(({ data }) => setPendingRequests(data.requests.filter((r) => r.clientId === id)));
  };
  useEffect(load, [id]);
  // Actualización sin refresh manual: si el cliente solicita una subcuenta,
  // reporta un pago, sube algo, etc., esta ficha lo refleja sola. Seguro
  // porque `client`/`messages` no alimentan ningún formulario en edición
  // (newIdentifier, messageForm, orgDraft, approveCapital, etc. son estado
  // aparte que esto nunca sobreescribe).
  usePolling(load, 8000);

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

  // AUDITORÍA QLC PARTE 1 — el documento se sirve "inline" (ver
  // documentController.downloadDocument), así que abrirlo en pestaña nueva
  // ya deja disponible el visor nativo del navegador. Igual que en el
  // archivo de Estados de Cuenta, intentamos además disparar el diálogo de
  // impresión automáticamente; si el navegador lo bloquea, el admin puede
  // imprimir manualmente desde esa misma pestaña.
  const printDocument = (doc) => {
    const win = window.open(`${API_BASE_URL}/admin/documents/${doc.id}/download`, '_blank');
    if (win) {
      win.onload = () => {
        try {
          win.print();
        } catch {
          // El admin puede imprimir manualmente desde el visor del navegador.
        }
      };
    }
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

  const copyWalletValue = (field, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedWalletField(field);
    setTimeout(() => setCopiedWalletField((f) => (f === field ? null : f)), 2000);
  };

  // GESTIÓN DINÁMICA DE SUBCUENTAS — eliminación lógica desde el panel admin
  // (sin pasar por una solicitud previa del cliente). Confirmación de dos
  // pasos porque es una acción sensible, aunque nunca borra el historial.
  const confirmRemoveSubaccount = async () => {
    await api.post(`/admin/clients/${id}/api-subaccounts/${removeTarget.id}/remove`);
    flash(t('adminClientDetail.subaccountRemoved'));
    load();
  };

  const openApproveCreate = (request) => {
    setApproveCreateTarget(request);
    setApproveIdentifier('');
    setApproveCapital('');
    setRequestActionError('');
  };

  const confirmApproveCreate = async () => {
    setRequestActionError('');
    try {
      await api.post(`/admin/subaccount-requests/${approveCreateTarget.id}/approve-create`, {
        ...(approveIdentifier ? { identifier: approveIdentifier } : {}),
        ...(approveCapital ? { requiredCapital: Number(approveCapital) } : {}),
      });
      setApproveCreateTarget(null);
      flash(t('adminClientDetail.requestApproved'));
      load();
    } catch (err) {
      setRequestActionError(translateBackendMessage(err.message, language));
    }
  };

  const confirmApproveDelete = async () => {
    await api.post(`/admin/subaccount-requests/${approveDeleteTarget.id}/approve-delete`);
    flash(t('adminClientDetail.requestApproved'));
    load();
  };

  const openReject = (request) => {
    setRejectTarget(request);
    setReviewNote('');
    setRequestActionError('');
  };

  const confirmReject = async () => {
    setRequestActionError('');
    try {
      await api.post(`/admin/subaccount-requests/${rejectTarget.id}/reject`, { reviewNote: reviewNote || undefined });
      setRejectTarget(null);
      flash(t('adminClientDetail.requestRejected'));
      load();
    } catch (err) {
      setRequestActionError(translateBackendMessage(err.message, language));
    }
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
  // GESTIÓN DINÁMICA DE SUBCUENTAS — `client.apiSubaccounts` trae TODO
  // (incluidas las eliminadas, para que el admin conserve acceso a su
  // historial); la vista principal solo debe considerar las activas.
  const numberedSubaccounts = subaccounts.filter((s) => !s.isPrincipal && !s.removedAt);
  const removedSubaccounts = subaccounts.filter((s) => !s.isPrincipal && s.removedAt);
  // La cuenta PRINCIPAL (isPrincipal) nunca cuenta contra el máximo de 20.
  const canAddSubaccount = numberedSubaccounts.length < 20;
  // CORRECCIÓN 7 (bloque de 20) — por defecto solo se listan las
  // subcuentas ACTIVAS (conectadas); las inactivas (desconectadas o
  // todavía pendientes) quedan minimizadas detrás de un control para
  // expandirlas. La PRINCIPAL siempre se muestra aparte, sin importar su
  // estado. Nunca se elimina ni se cambia el estado de nada, solo la vista.
  const principalSubaccount = subaccounts.find((s) => s.isPrincipal);
  const activeSubaccounts = numberedSubaccounts.filter((s) => s.status === 'CONECTADA');
  const inactiveSubaccounts = numberedSubaccounts.filter((s) => s.status !== 'CONECTADA');

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
          <button
            className="qlc-btn danger"
            onClick={() => setConfirmDeleteWarn(true)}
            disabled={client.user?.isActive}
            title={client.user?.isActive ? t('adminClientDetail.deleteClientMustDeactivateFirst') : undefined}
          >
            {t('adminClientDetail.deleteClient')}
          </button>
        </div>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      {pendingRequests.length > 0 && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-gold)', marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>
            {t('adminClientDetail.pendingRequestsTitle')} ({pendingRequests.length})
          </h3>
          <ul className="qlc-plain-list">
            {pendingRequests.map((r) => (
              <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
                <span style={{ fontSize: 13 }}>
                  {r.type === 'CREATE' ? t('clientSubaccounts.requestTypeCreate') : t('clientSubaccounts.requestTypeDelete')}
                  {r.apiSubaccount && ` — ${r.apiSubaccount.identifier || `#${r.apiSubaccount.slotIndex}`}`}
                  <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                    {new Date(r.requestedAt).toLocaleString()}
                    {r.reason && ` · ${r.reason}`}
                  </div>
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  {r.type === 'CREATE' ? (
                    <button className="qlc-btn primary" onClick={() => openApproveCreate(r)}>
                      {t('adminClientDetail.approveAction')}
                    </button>
                  ) : (
                    <button className="qlc-btn primary" onClick={() => setApproveDeleteTarget(r)}>
                      {t('adminClientDetail.approveAction')}
                    </button>
                  )}
                  <button type="button" className="qlc-btn ghost" onClick={() => openReject(r)}>
                    {t('adminPayments.reject')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CollapsibleSection
        className="qlc-collapsible-mb"
        title={`${t('adminClientDetail.subaccounts')} (${numberedSubaccounts.length}/20)`}
        summary={
          principalSubaccount || activeSubaccounts.length
            ? `${activeSubaccounts.length + (principalSubaccount ? 1 : 0)} ${t('adminClientDetail.subaccounts')}`
            : t('adminClientDetail.noSubaccounts')
        }
        badge={
          canAddSubaccount && (
            <span style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
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
          )
        }
      >
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
              {[principalSubaccount, ...activeSubaccounts].filter(Boolean).map((s) => (
                <SubaccountRow key={s.id} s={s} id={id} t={t} language={language} apiStatusMap={apiStatusMap} onRemove={setRemoveTarget} />
              ))}
              {inactiveSubaccounts.length > 0 && (
                <>
                  <tr>
                    <td colSpan={5}>
                      <button type="button" className="qlc-btn ghost" onClick={() => setShowInactiveSubaccounts((v) => !v)}>
                        {showInactiveSubaccounts ? '▾' : '▸'} {t('adminClientDetail.inactiveSubaccounts')} ({inactiveSubaccounts.length})
                      </button>
                    </td>
                  </tr>
                  {showInactiveSubaccounts &&
                    inactiveSubaccounts.map((s) => (
                      <SubaccountRow key={s.id} s={s} id={id} t={t} language={language} apiStatusMap={apiStatusMap} onRemove={setRemoveTarget} />
                    ))}
                </>
              )}
            </tbody>
          </table>
        )}
      </CollapsibleSection>

      {removedSubaccounts.length > 0 && (
        <CollapsibleSection
          className="qlc-collapsible-mb"
          title={t('adminClientDetail.removedSubaccountsTitle')}
          summary={`${removedSubaccounts.length} ${t('adminClientDetail.removedSubaccountsTitle')}`}
          defaultOpen={false}
        >
          <p style={{ color: 'var(--qlc-muted)', fontSize: 12, marginTop: 0 }}>{t('adminClientDetail.removedSubaccountsNotice')}</p>
          <table className="qlc-table">
            <thead>
              <tr>
                <th>{t('adminClientDetail.identifier')}</th>
                <th>{t('adminClientDetail.removedAtLabel')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {removedSubaccounts.map((s) => (
                <tr key={s.id}>
                  <td>{s.identifier || `#${s.slotIndex}`}</td>
                  <td>{new Date(s.removedAt).toLocaleString()}</td>
                  <td>
                    <Link className="qlc-btn ghost" to={`/admin/clients/${id}/api-subaccounts/${s.id}`}>
                      {t('adminClientsList.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      )}

      <CapitalIncreasePanel clientId={id} />
      <CapitalRescuePanel clientId={id} subaccounts={numberedSubaccounts} />

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
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" className="qlc-btn primary" onClick={() => setPreviewDoc(d)}>
                          {t('adminClientDetail.previewDocument')}
                        </button>
                        <a
                          className="qlc-btn ghost"
                          href={`${API_BASE_URL}/admin/documents/${d.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('adminClientDetail.viewDocument')}
                        </a>
                        <button className="qlc-btn ghost" onClick={() => printDocument(d)}>
                          {t('adminClientDetail.printDocument')}
                        </button>
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

          {/* CORRECCIÓN 7 (bloque de 20) — el administrador ya NO puede
              subir documentos desde la ficha del cliente: solo visualiza y
              descarga. La carga de documentos sigue existiendo, pero es
              exclusiva del cliente desde su propio panel. */}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminClientDetail.wallet')}</h3>
          {/* CORRECCIÓN 9 (bloque de 20) — WALLET/RED/COPIAR siempre
              visibles, incluso sin dato registrado todavía; estado
              explícito Registrada/No registrada, nunca información
              inventada (sin "liga" porque ese dato no existe para la
              wallet personal del cliente). */}
          <p style={{ fontSize: 13, marginBottom: 10 }}>
            <span className={`qlc-badge ${client.walletAddress ? 'ok' : 'muted'}`}>
              {client.walletAddress ? t('adminClientDetail.walletRegistered') : t('adminClientDetail.walletNotRegistered')}
            </span>
          </p>
          <p style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <span>
              <strong>{t('clientWallet.network')}:</strong> {client.walletNetwork || t('adminClientDetail.noWalletDataShort')}
            </span>
            <button
              className="qlc-btn ghost"
              style={{ flexShrink: 0 }}
              disabled={!client.walletNetwork}
              onClick={() => copyWalletValue('network', client.walletNetwork)}
            >
              {copiedWalletField === 'network' ? t('common.copied') : t('common.copy')}
            </button>
          </p>
          <p style={{ fontSize: 13, wordBreak: 'break-all', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <span>
              <strong>{t('clientWallet.address')}:</strong> {client.walletAddress || t('adminClientDetail.noWalletDataShort')}
            </span>
            <button
              className="qlc-btn ghost"
              style={{ flexShrink: 0 }}
              disabled={!client.walletAddress}
              onClick={() => copyWalletValue('address', client.walletAddress)}
            >
              {copiedWalletField === 'address' ? t('common.copied') : t('common.copy')}
            </button>
          </p>
          {client.walletQrUrl && <img src={client.walletQrUrl} alt="QR wallet" style={{ width: 130, borderRadius: 10 }} />}
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

      {previewDoc && (
        <Modal title={previewDoc.fileName} subtitle={previewDoc.category} onClose={() => setPreviewDoc(null)} width={860}>
          {previewDoc.mimeType?.startsWith('image/') ? (
            <img
              src={`${API_BASE_URL}/admin/documents/${previewDoc.id}/download`}
              alt={previewDoc.fileName}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto', borderRadius: 8 }}
            />
          ) : previewDoc.mimeType === 'application/pdf' ? (
            <iframe
              id="qlc-doc-preview-frame"
              title={previewDoc.fileName}
              src={`${API_BASE_URL}/admin/documents/${previewDoc.id}/download`}
              style={{ width: '100%', height: '70vh', border: '1px solid var(--qlc-line)', borderRadius: 8 }}
            />
          ) : (
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{t('adminClientDetail.previewNotAvailable')}</p>
          )}
          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={() => printDocument(previewDoc)}>
              {t('adminClientDetail.printDocument')}
            </button>
            <a
              className="qlc-btn primary"
              href={`${API_BASE_URL}/admin/documents/${previewDoc.id}/download`}
              target="_blank"
              rel="noreferrer"
            >
              {t('adminClientDetail.viewDocument')}
            </a>
          </div>
        </Modal>
      )}

      {/* Confirmación 1 de 2: advertencia completa de lo que se va a borrar,
          sin la contraseña todavía — igual patrón que AdminsPage/ConfirmModal
          twoStep, pero en dos pasos separados porque el paso 2 real (abajo)
          necesita además la contraseña de seguridad del administrador
          general. */}
      {confirmDeleteWarn && (
        <ConfirmModal
          title={t('adminClientDetail.deleteClientTitle')}
          message={t('adminClientDetail.deleteClientMessage').replace('{name}', `${client.firstName} ${client.lastName}`)}
          confirmLabel={t('adminClientDetail.deleteClient')}
          onClose={() => setConfirmDeleteWarn(false)}
          onConfirm={() => {
            setConfirmDeleteWarn(false);
            setConfirmDeleteClient(true);
          }}
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
            {t('adminClientDetail.deleteClientPasswordPrompt')}
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

      {removeTarget && (
        <ConfirmModal
          title={t('adminClientDetail.removeSubaccountTitle')}
          message={`${t('adminClientDetail.removeSubaccountMessage')} ${t('adminClientDetail.removeSubaccountKeepsHistory')}`}
          confirmLabel={t('adminClientDetail.removeSubaccount')}
          twoStep
          onClose={() => setRemoveTarget(null)}
          onConfirm={confirmRemoveSubaccount}
        />
      )}

      {approveDeleteTarget && (
        <ConfirmModal
          title={t('adminClientDetail.approveDeleteTitle')}
          message={`${t('adminClientDetail.removeSubaccountMessage')} ${t('adminClientDetail.removeSubaccountKeepsHistory')}`}
          confirmLabel={t('adminClientDetail.approveAction')}
          twoStep
          onClose={() => setApproveDeleteTarget(null)}
          onConfirm={confirmApproveDelete}
        />
      )}

      {approveCreateTarget && (
        <Modal
          title={t('adminClientDetail.approveCreateTitle')}
          onClose={() => setApproveCreateTarget(null)}
          width={440}
        >
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 0 }}>{t('adminClientDetail.approveCreateHint')}</p>
          <label className="qlc-label">{t('adminClientDetail.identifierPlaceholder')}</label>
          <input
            className="qlc-input"
            value={approveIdentifier}
            onChange={(e) => setApproveIdentifier(e.target.value)}
            placeholder="PCB-1-A-1"
          />
          <label className="qlc-label">{t('adminClientDetail.revealCapitalLabel')}</label>
          <input
            className="qlc-input"
            type="number"
            step="0.01"
            min="0.01"
            value={approveCapital}
            onChange={(e) => setApproveCapital(e.target.value)}
          />
          {requestActionError && <div className="qlc-field-error">{requestActionError}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn ghost" onClick={() => setApproveCreateTarget(null)}>
              {t('modals.cancel')}
            </button>
            <button className="qlc-btn primary" onClick={confirmApproveCreate}>
              {t('adminClientDetail.approveAction')}
            </button>
          </div>
        </Modal>
      )}

      {rejectTarget && (
        <Modal title={t('adminClientDetail.rejectRequestTitle')} onClose={() => setRejectTarget(null)} width={440}>
          <label className="qlc-label">{t('adminClientDetail.reviewNoteLabelOptional')}</label>
          <textarea className="qlc-textarea" rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
          {requestActionError && <div className="qlc-field-error">{requestActionError}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn ghost" onClick={() => setRejectTarget(null)}>
              {t('modals.cancel')}
            </button>
            <button className="qlc-btn danger" onClick={confirmReject}>
              {t('adminPayments.reject')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

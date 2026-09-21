import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { downloadAuthenticatedFile } from '../../utils/downloadFile';
import { ACCOUNT_STATUS, API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import CapitalIncreasePanel from './CapitalIncreasePanel';
import CapitalRescuePanel from './CapitalRescuePanel';
import usePolling from '../../hooks/usePolling';
import CollapsibleSection from '../../components/CollapsibleSection';

// CORRECCIÓN 7 (bloque de 20) — fila reutilizable para no duplicar el JSX
// entre subcuentas activas/principal e inactivas.
//
// GESTIÓN DINÁMICA DE SUBCUENTAS — las subcuentas funcionan por ESTADO
// (ACTIVA/INACTIVA), nunca por eliminación: deactivatedAt=null es, por
// definición, ACTIVA y visible para el cliente; con fecha es INACTIVA
// (oculta para el cliente, pero su historial de estados de cuenta/pagos/
// documentos se conserva íntegro). El admin puede alternar libremente entre
// ambos estados (onDeactivate/onActivate) — nunca es un archivo de
// "eliminadas", solo dos estados reversibles.
function SubaccountRow({ s, id, t, language, apiStatusMap, onDeactivate, onActivate }) {
  const apiStatus = statusOf(apiStatusMap, s.status, 'PENDIENTE');
  const cs = s.conditionsSummary || { confirmed: 0, total: 0, allConfirmed: false };
  const isInactive = Boolean(s.deactivatedAt);
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
      <td>
        <span className={`qlc-badge ${isInactive ? 'muted' : 'ok'}`}>
          {isInactive ? t('adminClientDetail.statusInactive') : t('adminClientDetail.statusActive')}
        </span>
      </td>
      <td style={{ display: 'flex', gap: 6 }}>
        <Link className="qlc-btn ghost" to={`/admin/clients/${id}/api-subaccounts/${s.id}`}>
          {t('adminClientsList.view')}
        </Link>
        {!s.isPrincipal &&
          (isInactive ? (
            <button type="button" className="qlc-btn ghost" onClick={() => onActivate(s)}>
              {t('adminClientDetail.activateSubaccount')}
            </button>
          ) : (
            <button type="button" className="qlc-btn ghost" onClick={() => onDeactivate(s)}>
              {t('adminClientDetail.deactivateSubaccount')}
            </button>
          ))}
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
  // "Desconectadas" es el estado de la conexión API (CONECTADA/no) — un eje
  // totalmente distinto de ACTIVA/INACTIVA (estado de la subcuenta misma).
  const [showDisconnectedSubaccounts, setShowDisconnectedSubaccounts] = useState(false);
  const [showInactiveStatusSubaccounts, setShowInactiveStatusSubaccounts] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [activateTarget, setActivateTarget] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approveCreateTarget, setApproveCreateTarget] = useState(null);
  const [approveIdentifier, setApproveIdentifier] = useState('');
  const [approveCapital, setApproveCapital] = useState('');
  const [approveDeactivateTarget, setApproveDeactivateTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [requestActionError, setRequestActionError] = useState('');
  // NOMENCLATURA ÚNICA — se asigna UNA sola vez; sin este modal no existe
  // ninguna otra forma de fijarla desde la interfaz, y una vez guardada no
  // hay botón de editar en ningún lado.
  const [showAssignUsername, setShowAssignUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [assigningUsername, setAssigningUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  // CORREGIR.xlsx ADMIN 14 — mensajería manual admin→cliente.
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ title: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  // Vista previa autenticada (Blob, nunca la URL directa del backend) — ver
  // components/DocumentViewerModal.jsx, compartido con el panel del cliente.
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

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
  // (newIdentifier, messageForm, approveCapital, etc. son estado aparte que
  // esto nunca sobreescribe).
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

  // Descarga autenticada por Blob — nunca abre la URL directa del backend
  // (ver utils/downloadFile.js).
  const downloadDoc = async (doc) => {
    setDownloadingDocId(doc.id);
    try {
      await downloadAuthenticatedFile(api, `/admin/documents/${doc.id}/download`, doc.fileName);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setDownloadingDocId(null);
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
      const { data } = await api.delete(`/admin/clients/${id}`, { data: { securityPassword: deleteSecurityPassword } });
      // El backend nunca afirma que la carpeta de Drive se borró si no se
      // confirmó de verdad — se lleva ese estado real a la lista de
      // clientes para que el admin lo vea, en vez de perderlo al navegar.
      navigate('/admin/clients', {
        state: { driveDeletionStatus: data.driveDeletionStatus, driveDeletionError: data.driveDeletionError },
      });
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

  // GESTIÓN DINÁMICA DE SUBCUENTAS — cambio de estado (ACTIVA/INACTIVA)
  // desde el panel admin (sin pasar por una solicitud previa del cliente).
  // Reversible en cualquier momento; nunca borra el historial.
  const confirmDeactivateSubaccount = async () => {
    await api.post(`/admin/clients/${id}/api-subaccounts/${deactivateTarget.id}/deactivate`);
    flash(t('adminClientDetail.subaccountDeactivated'));
    load();
  };

  const confirmActivateSubaccount = async () => {
    await api.post(`/admin/clients/${id}/api-subaccounts/${activateTarget.id}/activate`);
    flash(t('adminClientDetail.subaccountActivated'));
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

  const confirmApproveDeactivate = async () => {
    await api.post(`/admin/subaccount-requests/${approveDeactivateTarget.id}/approve-deactivate`);
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

  // NOMENCLATURA ÚNICA §7/§9 — solo se puede ASIGNAR cuando el cliente
  // todavía no tiene una (el backend rechaza el resto de los casos). Nunca
  // hay una forma de editarla después: ni este botón ni ningún otro
  // aparecen una vez que client.username ya tiene un valor.
  const confirmAssignUsername = async () => {
    setAssigningUsername(true);
    setUsernameError('');
    try {
      await api.post(`/admin/clients/${id}/assign-username`, { username: usernameDraft });
      setShowAssignUsername(false);
      setUsernameDraft('');
      flash(t('adminClientDetail.usernameAssigned'));
      load();
    } catch (err) {
      setUsernameError(translateBackendMessage(err.message, language));
    } finally {
      setAssigningUsername(false);
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
  // GESTIÓN DINÁMICA DE SUBCUENTAS — `client.apiSubaccounts` trae TODAS
  // (activas e inactivas) para que el admin conserve acceso completo. Las
  // numeradas se separan por su ESTADO (deactivatedAt) — nunca por
  // "eliminadas" — y solo las ACTIVAS cuentan contra el máximo de 20.
  const numberedSubaccounts = subaccounts.filter((s) => !s.isPrincipal);
  const activeNumberedSubaccounts = numberedSubaccounts.filter((s) => !s.deactivatedAt);
  const inactiveStatusSubaccounts = numberedSubaccounts.filter((s) => s.deactivatedAt);
  const canAddSubaccount = activeNumberedSubaccounts.length < 20;
  // CORRECCIÓN 7 (bloque de 20) — dentro de las ACTIVAS, por defecto solo se
  // listan las CONECTADAS; las desconectadas o todavía pendientes quedan
  // minimizadas detrás de un control para expandirlas. Este eje (conexión
  // API) es independiente del estado ACTIVA/INACTIVA de arriba. La
  // PRINCIPAL siempre se muestra aparte, sin importar su estado.
  const principalSubaccount = subaccounts.find((s) => s.isPrincipal);
  const connectedSubaccounts = activeNumberedSubaccounts.filter((s) => s.status === 'CONECTADA');
  const disconnectedSubaccounts = activeNumberedSubaccounts.filter((s) => s.status !== 'CONECTADA');

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
          <div style={{ color: 'var(--qlc-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('adminClientDetail.usernameLabel')}:{' '}
            {client.username ? (
              <>
                <code>{client.username}</code>
                <span className="qlc-badge muted" style={{ fontSize: 10 }} title={t('adminClientDetail.usernameLockedHint')}>
                  🔒 {t('adminClientDetail.usernameLocked')}
                </span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--qlc-warn)' }}>{t('adminClientDetail.usernamePending')}</span>
                <button
                  type="button"
                  className="qlc-btn ghost"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => setShowAssignUsername(true)}
                >
                  {t('adminClientDetail.assignUsername')}
                </button>
              </>
            )}
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
                  {r.type === 'CREATE' ? t('clientSubaccounts.requestTypeCreate') : t('clientSubaccounts.requestTypeDeactivate')}
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
                    <button className="qlc-btn primary" onClick={() => setApproveDeactivateTarget(r)}>
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
        title={`${t('adminClientDetail.subaccounts')} (${activeNumberedSubaccounts.length}/20)`}
        summary={
          principalSubaccount || activeNumberedSubaccounts.length
            ? `${activeNumberedSubaccounts.length + (principalSubaccount ? 1 : 0)} ${t('adminClientDetail.subaccounts')}`
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
                <th>{t('adminClientDetail.subaccountStatus')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[principalSubaccount, ...connectedSubaccounts].filter(Boolean).map((s) => (
                <SubaccountRow
                  key={s.id}
                  s={s}
                  id={id}
                  t={t}
                  language={language}
                  apiStatusMap={apiStatusMap}
                  onDeactivate={setDeactivateTarget}
                  onActivate={setActivateTarget}
                />
              ))}
              {disconnectedSubaccounts.length > 0 && (
                <>
                  <tr>
                    <td colSpan={6}>
                      <button type="button" className="qlc-btn ghost" onClick={() => setShowDisconnectedSubaccounts((v) => !v)}>
                        {showDisconnectedSubaccounts ? '▾' : '▸'} {t('adminClientDetail.disconnectedSubaccounts')} ({disconnectedSubaccounts.length})
                      </button>
                    </td>
                  </tr>
                  {showDisconnectedSubaccounts &&
                    disconnectedSubaccounts.map((s) => (
                      <SubaccountRow
                        key={s.id}
                        s={s}
                        id={id}
                        t={t}
                        language={language}
                        apiStatusMap={apiStatusMap}
                        onDeactivate={setDeactivateTarget}
                        onActivate={setActivateTarget}
                      />
                    ))}
                </>
              )}
              {inactiveStatusSubaccounts.length > 0 && (
                <>
                  <tr>
                    <td colSpan={6}>
                      <button type="button" className="qlc-btn ghost" onClick={() => setShowInactiveStatusSubaccounts((v) => !v)}>
                        {showInactiveStatusSubaccounts ? '▾' : '▸'} {t('adminClientDetail.inactiveStatusSubaccounts')} ({inactiveStatusSubaccounts.length})
                      </button>
                    </td>
                  </tr>
                  {showInactiveStatusSubaccounts &&
                    inactiveStatusSubaccounts.map((s) => (
                      <SubaccountRow
                        key={s.id}
                        s={s}
                        id={id}
                        t={t}
                        language={language}
                        apiStatusMap={apiStatusMap}
                        onDeactivate={setDeactivateTarget}
                        onActivate={setActivateTarget}
                      />
                    ))}
                </>
              )}
            </tbody>
          </table>
        )}
      </CollapsibleSection>

      <CapitalIncreasePanel clientId={id} />
      <CapitalRescuePanel clientId={id} subaccounts={activeNumberedSubaccounts} />

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminClientDetail.documents')} ({client.documents?.length || 0})
          </h3>
          {client.documents?.length ? (
            <ul className="qlc-plain-list">
              {client.documents.map((d) => (
                <li key={d.id} className="qlc-doc-card">
                  <div className="qlc-doc-card-info">
                    <strong className="qlc-doc-card-name">{d.fileName}</strong>
                    <span style={{ color: 'var(--qlc-muted2)' }}>({d.category})</span>
                    {d.clientEditUnlocked && (
                      <span className="qlc-badge warn">{t('adminClientDetail.unlockedForClient')}</span>
                    )}
                    {d._count?.corrections > 0 && (
                      <span className="qlc-badge ok">
                        {t('adminClientDetail.correctedBadge').replace('{count}', d._count.corrections)}
                      </span>
                    )}
                  </div>
                  <div className="qlc-doc-card-actions">
                    <button type="button" className="qlc-btn primary" onClick={() => setPreviewDoc(d)}>
                      {t('adminClientDetail.previewDocument')}
                    </button>
                    <button type="button" className="qlc-btn ghost" disabled={downloadingDocId === d.id} onClick={() => downloadDoc(d)}>
                      {downloadingDocId === d.id ? t('common.loading') : t('common.download')}
                    </button>
                    <button type="button" className="qlc-btn ghost" onClick={() => toggleDocUnlock(d)}>
                      {d.clientEditUnlocked ? t('adminClientDetail.lockDocument') : t('adminClientDetail.unlockDocument')}
                    </button>
                    <button type="button" className="qlc-btn ghost" onClick={() => setConfirmDeleteDoc(d)}>
                      {t('adminClientDetail.delete')}
                    </button>
                  </div>
                </li>
              ))}
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
          {(client.walletQrDriveFileId || client.walletQrUrl) && (
            <img
              src={client.walletQrDriveFileId ? `${API_BASE_URL}/admin/clients/${id}/wallet-qr` : client.walletQrUrl}
              alt="QR wallet"
              style={{ width: 130, borderRadius: 10 }}
            />
          )}
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
        <DocumentViewerModal
          url={`/admin/documents/${previewDoc.id}/download`}
          fileName={previewDoc.fileName}
          onClose={() => setPreviewDoc(null)}
        />
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

      {showAssignUsername && (
        <Modal
          title={t('adminClientDetail.assignUsernameTitle')}
          onClose={() => {
            setShowAssignUsername(false);
            setUsernameError('');
          }}
          width={440}
        >
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
            {t('adminClientDetail.assignUsernameNotice')}
          </p>
          <label className="qlc-label">{t('adminClientDetail.usernameLabel')}</label>
          <input
            className="qlc-input"
            value={usernameDraft}
            onChange={(e) => setUsernameDraft(e.target.value.slice(0, 30))}
            maxLength={30}
            autoFocus
          />
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 4 }}>{usernameDraft.length}/30</p>
          {usernameError && <div className="qlc-field-error">{usernameError}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn ghost" onClick={() => setShowAssignUsername(false)} disabled={assigningUsername}>
              {t('modals.cancel')}
            </button>
            <button className="qlc-btn primary" onClick={confirmAssignUsername} disabled={assigningUsername || !usernameDraft.trim()}>
              {assigningUsername ? t('common.saving') : t('adminClientDetail.assignUsername')}
            </button>
          </div>
        </Modal>
      )}

      {deactivateTarget && (
        <ConfirmModal
          title={t('adminClientDetail.deactivateSubaccountTitle')}
          message={`${t('adminClientDetail.deactivateSubaccountMessage')} ${t('adminClientDetail.deactivateSubaccountKeepsHistory')}`}
          confirmLabel={t('adminClientDetail.deactivateSubaccount')}
          danger={false}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={confirmDeactivateSubaccount}
        />
      )}

      {activateTarget && (
        <ConfirmModal
          title={t('adminClientDetail.activateSubaccountTitle')}
          message={t('adminClientDetail.activateSubaccountMessage')}
          confirmLabel={t('adminClientDetail.activateSubaccount')}
          danger={false}
          onClose={() => setActivateTarget(null)}
          onConfirm={confirmActivateSubaccount}
        />
      )}

      {approveDeactivateTarget && (
        <ConfirmModal
          title={t('adminClientDetail.approveDeactivateTitle')}
          message={`${t('adminClientDetail.deactivateSubaccountMessage')} ${t('adminClientDetail.deactivateSubaccountKeepsHistory')}`}
          confirmLabel={t('adminClientDetail.approveAction')}
          onClose={() => setApproveDeactivateTarget(null)}
          onConfirm={confirmApproveDeactivate}
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

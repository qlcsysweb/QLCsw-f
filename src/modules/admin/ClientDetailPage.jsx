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

// CORRECCIÓN 7 (bloque de 20) — fila reutilizable para no duplicar el JSX
// entre subcuentas activas/principal e inactivas colapsadas.
//
// CORRECCIÓN (subcuentas ocultas) — una subcuenta numerada nace oculta para
// el cliente (visibleToClient=false); aquí se ve el badge "Oculta" y el
// botón para revelarla (onReveal), que pide el capital operativo requerido
// en el mismo paso.
function SubaccountRow({ s, id, t, language, apiStatusMap, onReveal }) {
  const apiStatus = statusOf(apiStatusMap, s.status, 'PENDIENTE');
  const cs = s.conditionsSummary || { confirmed: 0, total: 0, allConfirmed: false };
  const hidden = !s.isPrincipal && !s.visibleToClient;
  return (
    <tr>
      <td>
        {s.isPrincipal ? t('clientSubaccounts.principalLabel') : (s.identifier || t('adminClientDetail.unassignedIdentifier'))}
        {hidden && (
          <span className="qlc-badge muted" style={{ marginLeft: 6 }}>
            {t('adminClientDetail.hiddenFromClient')}
          </span>
        )}
      </td>
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
        {hidden && (
          <button type="button" className="qlc-btn ghost" onClick={() => onReveal(s)}>
            {t('adminClientDetail.revealAction')}
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
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);
  const [deleteSecurityPassword, setDeleteSecurityPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [creatingSubaccount, setCreatingSubaccount] = useState(false);
  const [newIdentifier, setNewIdentifier] = useState('');
  const [copiedWalletField, setCopiedWalletField] = useState(null);
  const [showInactiveSubaccounts, setShowInactiveSubaccounts] = useState(false);
  const [revealTarget, setRevealTarget] = useState(null);
  const [revealCapital, setRevealCapital] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState('');
  // CORREGIR.xlsx ADMIN 14 — mensajería manual admin→cliente.
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ title: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  // CORREGIR.xlsx ADMIN 07 — organización Año/Periodo/Mes de documentos.
  const [orgDraft, setOrgDraft] = useState({});

  const accountStatusMap = ACCOUNT_STATUS(t);
  const apiStatusMap = API_CONNECTION_STATUS(t);
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

  const copyWalletValue = (field, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedWalletField(field);
    setTimeout(() => setCopiedWalletField((f) => (f === field ? null : f)), 2000);
  };

  // CORRECCIÓN (subcuentas ocultas) — revelar exige capturar el capital
  // operativo requerido en el mismo paso (si la subcuenta todavía no lo
  // tenía), para que el cliente nunca vea "pendiente de configuración"
  // justo cuando se le habilita.
  const openReveal = (s) => {
    setRevealTarget(s);
    setRevealCapital(s.requiredCapital != null ? String(s.requiredCapital) : '');
    setRevealError('');
  };

  const confirmReveal = async () => {
    if (!revealCapital || Number(revealCapital) <= 0) {
      setRevealError(t('adminClientDetail.revealCapitalRequired'));
      return;
    }
    setRevealing(true);
    setRevealError('');
    try {
      await api.patch(`/admin/api-subaccounts/${revealTarget.id}`, {
        visibleToClient: true,
        requiredCapital: Number(revealCapital),
      });
      setRevealTarget(null);
      flash(t('adminClientDetail.subaccountRevealed'));
      load();
    } catch (err) {
      setRevealError(translateBackendMessage(err.message, language));
    } finally {
      setRevealing(false);
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
  // La cuenta PRINCIPAL (isPrincipal) nunca cuenta contra el máximo de 20.
  const numberedSubaccounts = subaccounts.filter((s) => !s.isPrincipal);
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
          <button className="qlc-btn danger" onClick={() => setConfirmDeleteClient(true)}>
            {t('adminClientDetail.deleteClient')}
          </button>
        </div>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      {client.subaccountRequestedAt && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-gold)', marginBottom: 16 }}>
          {t('adminClientDetail.subaccountRequestBanner')} {new Date(client.subaccountRequestedAt).toLocaleString()}
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
              {[principalSubaccount, ...activeSubaccounts].filter(Boolean).map((s) => (
                <SubaccountRow key={s.id} s={s} id={id} t={t} language={language} apiStatusMap={apiStatusMap} onReveal={openReveal} />
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
                      <SubaccountRow key={s.id} s={s} id={id} t={t} language={language} apiStatusMap={apiStatusMap} onReveal={openReveal} />
                    ))}
                </>
              )}
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

      {revealTarget && (
        <Modal
          title={t('adminClientDetail.revealTitle')}
          subtitle={t('adminClientDetail.revealSubtitle')}
          onClose={() => setRevealTarget(null)}
          width={440}
        >
          <label className="qlc-label">{t('adminClientDetail.revealCapitalLabel')}</label>
          <input
            className="qlc-input"
            type="number"
            step="0.01"
            min="0.01"
            value={revealCapital}
            onChange={(e) => setRevealCapital(e.target.value)}
            autoFocus
          />
          {revealError && <div className="qlc-field-error">{revealError}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn ghost" onClick={() => setRevealTarget(null)} disabled={revealing}>
              {t('modals.cancel')}
            </button>
            <button className="qlc-btn primary" onClick={confirmReveal} disabled={revealing}>
              {revealing ? t('modals.processing') : t('adminClientDetail.revealConfirm')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

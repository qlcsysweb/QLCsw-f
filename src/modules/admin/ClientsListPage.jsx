import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { ACCOUNT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';

// NOMENCLATURA ÚNICA §7/§8 — "username" es la nomenclatura única que el
// ADMIN asigna al registrar manualmente a un cliente: obligatoria, máximo
// 30 caracteres, cualquier carácter, sin ejemplo sugerido (para no imponer
// un formato) y NUNCA editable después de guardarse — este modal es la
// única forma de fijarla en la creación; no hay forma de cambiarla luego.
function CreateClientModal({ onClose, onCreated }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', password: '', nationality: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admin/clients', form);
      onCreated();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-modal-overlay">
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{t('adminClientsList.modalTitle')}</h2>
        <form onSubmit={submit}>
          <label className="qlc-label">{t('adminClientsList.username')}</label>
          <input
            className="qlc-input"
            value={form.username}
            onChange={(e) => update('username')({ target: { value: e.target.value.slice(0, 30) } })}
            maxLength={30}
            required
          />
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -4, marginBottom: 10 }}>
            {t('adminClientsList.usernameHint')} ({form.username.length}/30)
          </p>
          <label className="qlc-label">{t('adminClientsList.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('adminClientsList.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
          <label className="qlc-label">{t('adminClientsList.nationality')}</label>
          <input className="qlc-input" value={form.nationality} onChange={update('nationality')} />
          <label className="qlc-label">{t('adminClientsList.email')}</label>
          <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
          <label className="qlc-label">{t('adminClientsList.initialPassword')}</label>
          <input
            className="qlc-input"
            type="password"
            value={form.password}
            onChange={update('password')}
            required
            minLength={8}
          />

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="qlc-btn primary" disabled={saving}>
              {saving ? t('common.saving') : t('adminClientsList.createClient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// CORRECCIÓN 2 (bloque de 20) — modal de edición: usuario, nombre completo,
// correo y contraseña, todos independientes. La contraseña es opcional: si
// se deja vacía, se conserva la actual. Pide confirmación antes de guardar
// y valida correo duplicado (el backend es la fuente real de esa
// validación; aquí solo se muestra el error que devuelva).
//
// NOMENCLATURA ÚNICA §11 — "username" NO aparece en este modal a propósito:
// una vez asignada, ni el cliente ni el admin pueden editarla (se asigna
// una sola vez desde la ficha del cliente, con "Asignar nomenclatura", y
// solo si todavía no tiene una).
function EditClientModal({ client, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    email: client.user?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const requestSave = (e) => {
    e.preventDefault();
    setError('');
    if (form.password && form.password !== form.confirmPassword) {
      setError(t('adminClientsList.passwordMismatch'));
      return;
    }
    setConfirming(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
      };
      await api.patch(`/admin/clients/${client.id}`, payload);
      onSaved();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-modal-overlay">
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{t('adminClientsList.editClient')}</h2>
        {!confirming ? (
          <form onSubmit={requestSave}>
            <label className="qlc-label">{t('adminClientsList.firstName')}</label>
            <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
            <label className="qlc-label">{t('adminClientsList.lastName')}</label>
            <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
            <label className="qlc-label">{t('adminClientsList.email')}</label>
            <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
            <label className="qlc-label">{t('adminClientsList.newPasswordOptional')}</label>
            <input className="qlc-input" type="password" value={form.password} onChange={update('password')} minLength={8} placeholder={t('adminClientsList.leaveBlankPassword')} />
            {form.password && (
              <>
                <label className="qlc-label">{t('adminClientsList.confirmPassword')}</label>
                <input className="qlc-input" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} minLength={8} />
              </>
            )}
            {error && <div className="qlc-field-error">{error}</div>}
            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="qlc-btn primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{t('adminClientsList.confirmChangesIntro')}</p>
            <ul className="qlc-plain-list" style={{ fontSize: 13, marginBottom: 16 }}>
              <li>{t('adminClientsList.firstName')} / {t('adminClientsList.lastName')}: {form.firstName} {form.lastName}</li>
              <li>{t('adminClientsList.email')}: {form.email}</li>
              <li>{t('adminClientsList.newPasswordOptional')}: {form.password ? t('adminClientsList.willChange') : t('adminClientsList.willKeep')}</li>
            </ul>
            {error && <div className="qlc-field-error">{error}</div>}
            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={() => setConfirming(false)} disabled={saving}>
                {t('common.back')}
              </button>
              <button type="button" className="qlc-btn primary" onClick={confirmSave} disabled={saving}>
                {saving ? t('common.saving') : t('adminClientsList.confirmAndSave')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// AUDITORÍA QLC PARTE 6 — progreso de UNA subcuenta/API: cuántas de sus 4
// condiciones de activación (Garantía, Capital, API, Activación) ya
// están confirmadas. Mismo cálculo que usa el backend (summarizeConditions
// en clientController.js), replicado aquí porque el listado ya trae el
// detalle completo de cada subcuenta (conditions) y no hace falta pedirlo
// de nuevo al servidor.
function subaccountProgress(subaccount) {
  const conditions = subaccount.process?.conditions || [];
  const total = conditions.length || 5;
  const confirmed = conditions.filter((c) => c.status === 'CONFIRMED').length;
  return { confirmed, total };
}

// AUDITORÍA QLC PARTE 6 — representación visual del progreso (además del
// texto "X/5"), para que no dependa solo de leer un número.
function ProgressBar({ confirmed, total, width = 70 }) {
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  return (
    <div
      style={{ width, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle' }}
      role="progressbar"
      aria-valuenow={confirmed}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: pct === 100 ? 'var(--qlc-ok)' : 'var(--qlc-blue2)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

export default function ClientsListPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [showProgressHelp, setShowProgressHelp] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmDeactivateClient, setConfirmDeactivateClient] = useState(null);
  // Resultado real de la eliminación de la carpeta de Drive de un cliente
  // que se acaba de borrar permanentemente (ver ClientDetailPage.jsx) —
  // nunca se afirma que se borró si no se confirmó de verdad.
  const driveDeletionResult = location.state?.driveDeletionStatus;

  const accountStatusMap = ACCOUNT_STATUS(t);

  // GESTIÓN DINÁMICA DE SUBCUENTAS — cola de solicitudes de creación/
  // eliminación pendientes, visible en el mismo lugar donde el admin ya
  // administra clientes.
  const loadPendingRequests = () => {
    api.get('/admin/subaccount-requests', { params: { status: 'PENDING' } }).then(({ data }) => setPendingRequests(data.requests));
  };
  useEffect(loadPendingRequests, []);
  usePolling(loadPendingRequests, 8000);

  const rejectSubaccountRequest = async (requestId) => {
    await api.post(`/admin/subaccount-requests/${requestId}/reject`);
    loadPendingRequests();
  };

  const toggleClientActive = async (clientId, isActive) => {
    await api.patch(`/admin/clients/${clientId}/active`, { isActive });
    load();
  };

  const load = () => {
    setLoading(true);
    api
      .get('/admin/clients', { params: { search: search || undefined } })
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Actualización sin refresh manual: nuevos registros o cambios de estado
  // aparecen solos, sin el parpadeo de "Cargando..." que sí tiene la
  // búsqueda manual (esta variante nunca toca `loading`).
  usePolling(() => {
    api
      .get('/admin/clients', { params: { search: search || undefined } })
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
      });
  }, 8000);

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">{t('adminClientsList.kicker')}</div>
          <h1 style={{ margin: 0 }}>
            {t('adminClientsList.title')} ({total})
          </h1>
        </div>
        <button className="qlc-btn primary" onClick={() => setShowCreate(true)}>
          {t('adminClientsList.newClient')}
        </button>
      </div>

      {driveDeletionResult && (
        <div
          className="qlc-card"
          style={{ marginBottom: 18, borderColor: driveDeletionResult === 'error' ? 'var(--qlc-danger-border)' : 'var(--qlc-ok-border)' }}
        >
          <p style={{ margin: 0, fontSize: 13 }}>
            {t('adminClientsList.clientDeletedNotice')}{' '}
            {t(`adminClientsList.driveDeletionStatus_${driveDeletionResult}`)}
            {driveDeletionResult === 'error' && location.state?.driveDeletionError ? ` (${location.state.driveDeletionError})` : ''}
          </p>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="qlc-card" style={{ marginBottom: 18, borderColor: 'var(--qlc-warn-border)' }}>
          <h3 style={{ marginTop: 0 }}>
            {t('adminClientsList.pendingSubaccountRequests')} ({pendingRequests.length})
          </h3>
          <ul className="qlc-plain-list">
            {pendingRequests.map((r) => (
              <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
                <span style={{ fontSize: 13 }}>
                  <strong>{r.client.username || '—'}</strong> — {r.client.firstName} {r.client.lastName}
                  <span style={{ color: 'var(--qlc-muted2)' }}> ({r.client.user?.email})</span>
                  <span className="qlc-badge" style={{ marginLeft: 8 }}>
                    {r.type === 'CREATE' ? t('clientSubaccounts.requestTypeCreate') : t('clientSubaccounts.requestTypeDeactivate')}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
                    {t('adminClientsList.requestedOn')} {new Date(r.requestedAt).toLocaleString()}
                    {r.apiSubaccount && ` · ${r.apiSubaccount.identifier || `#${r.apiSubaccount.slotIndex}`}`}
                    {r.reason && ` · ${r.reason}`}
                  </div>
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <Link className="qlc-btn primary" to={`/admin/clients/${r.clientId}`}>
                    {t('adminClientsList.reviewAndApprove')}
                  </Link>
                  <button type="button" className="qlc-btn ghost" onClick={() => rejectSubaccountRequest(r.id)}>
                    {t('adminPayments.reject')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <input
        className="qlc-input"
        style={{ maxWidth: 320, marginBottom: 18 }}
        placeholder={t('adminClientsList.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="qlc-empty">{t('adminClientsList.loading')}</div>
      ) : items.length === 0 ? (
        <div className="qlc-empty">{t('adminClientsList.none')}</div>
      ) : (
        <div className="qlc-table-wrap">
          <table className="qlc-table">
            <thead>
              <tr>
                <th></th>
                <th>{t('adminClientsList.username')}</th>
                <th>{t('adminClientsList.client')}</th>
                <th>{t('adminClientsList.status')}</th>
                <th>{t('adminClientsList.subaccounts')}</th>
                <th>
                  {t('adminClientsList.process')}{' '}
                  <button
                    type="button"
                    onClick={() => setShowProgressHelp(true)}
                    title={t('adminClientsList.progressHelpTitle')}
                    style={{ border: 'none', background: 'transparent', color: 'var(--qlc-muted2)', cursor: 'pointer', fontSize: 11 }}
                  >
                    ⓘ
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const accStatus = statusOf(accountStatusMap, c.status);
                const summary = c.subaccountsSummary || { total: 0, activated: 0, readyToActivate: 0 };
                const subaccounts = c.apiSubaccounts || [];
                const isExpanded = expandedClientId === c.id;
                // AUDITORÍA QLC PARTE 6 — progreso "global" mostrado en la
                // fila principal: el de la cuenta PRINCIPAL (o la primera
                // subcuenta disponible) — el desglose completo, subcuenta
                // por subcuenta, aparece al desplegar la fila.
                const principal = subaccounts.find((s) => s.isPrincipal) || subaccounts[0];
                const principalProgress = principal ? subaccountProgress(principal) : null;
                return (
                  <Fragment key={c.id}>
                    <tr>
                      <td>
                        {subaccounts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedClientId(isExpanded ? null : c.id)}
                            title={t('adminClientsList.expandSubaccounts')}
                            style={{ border: 'none', background: 'transparent', color: 'var(--qlc-blue2)', cursor: 'pointer', fontSize: 14 }}
                          >
                            {isExpanded ? '▾' : '▸'}
                          </button>
                        )}
                      </td>
                      <td>{c.username || <span style={{ color: 'var(--qlc-muted2)' }}>—</span>}</td>
                      <td>
                        {c.firstName} {c.lastName}
                        <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{c.user?.email}</div>
                      </td>
                      <td>
                        <span className={`qlc-badge ${accStatus.className}`}>{accStatus.text}</span>
                        {c.subaccountRequestedAt && (
                          <div style={{ marginTop: 4 }}>
                            <span className="qlc-badge warn" title={t('adminClientsList.subaccountRequestPending')}>
                              ! {t('adminClientsList.subaccountRequestPending')}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {summary.total} <span style={{ color: 'var(--qlc-muted2)' }}>({summary.activated} {t('adminClientsList.activatedShort')})</span>
                      </td>
                      <td>
                        {principalProgress ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              className={`qlc-badge ${principalProgress.confirmed === principalProgress.total ? 'ok' : 'warn'}`}
                              title={t('adminClientsList.progressHelpTitle')}
                            >
                              {principalProgress.confirmed}/{principalProgress.total}
                            </span>
                            <ProgressBar confirmed={principalProgress.confirmed} total={principalProgress.total} />
                          </div>
                        ) : (
                          <span className="qlc-badge muted">—</span>
                        )}
                      </td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" className="qlc-btn ghost" onClick={() => setEditingClient(c)}>
                          {t('common.edit')}
                        </button>
                        <Link className="qlc-btn ghost" to={`/admin/clients/${c.id}`}>
                          {t('adminClientsList.view')}
                        </Link>
                        {c.user?.isActive ? (
                          <button type="button" className="qlc-btn ghost" onClick={() => setConfirmDeactivateClient(c)}>
                            {t('adminClientDetail.deactivate')}
                          </button>
                        ) : (
                          <button type="button" className="qlc-btn ghost" onClick={() => toggleClientActive(c.id, true)}>
                            {t('adminClientDetail.activateAccount')}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td></td>
                        <td colSpan={6} style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ padding: '6px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {subaccounts.map((s) => {
                              const progress = subaccountProgress(s);
                              return (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                                  <span style={{ minWidth: 110, color: 'var(--qlc-blue2)' }}>
                                    {s.isPrincipal ? t('clientSubaccounts.principalLabel') : s.identifier || t('clientSubaccounts.unassignedIdentifier')}
                                  </span>
                                  <span className={`qlc-badge ${progress.confirmed === progress.total ? 'ok' : 'warn'}`}>
                                    {progress.confirmed}/{progress.total}
                                  </span>
                                  <ProgressBar confirmed={progress.confirmed} total={progress.total} width={50} />
                                  <span style={{ color: 'var(--qlc-muted2)' }}>
                                    {s.process?.isActivated ? t('adminClientsList.subaccountActivated') : t('adminClientsList.subaccountNotActivated')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showProgressHelp && (
        <div className="qlc-modal-overlay" onClick={() => setShowProgressHelp(false)}>
          <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{t('adminClientsList.progressHelpTitle')}</h2>
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{t('adminClientsList.progressHelpBody')}</p>
            <div className="qlc-form-actions">
              <button className="qlc-btn primary" onClick={() => setShowProgressHelp(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaved={() => {
            setEditingClient(null);
            load();
          }}
        />
      )}

      {confirmDeactivateClient && (
        <ConfirmModal
          title={t('adminClientDetail.deactivateTitle')}
          message={t('adminClientDetail.deactivateMessage').replace(
            '{name}',
            `${confirmDeactivateClient.firstName} ${confirmDeactivateClient.lastName}`
          )}
          confirmLabel={t('adminClientDetail.deactivate')}
          onClose={() => setConfirmDeactivateClient(null)}
          onConfirm={() => toggleClientActive(confirmDeactivateClient.id, false)}
        />
      )}
    </div>
  );
}

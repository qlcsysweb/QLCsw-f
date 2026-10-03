import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatCdmxDateTime, formatDateOnly } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatParticipationSplit } from '../../components/ParticipationModelSummary';
import StatementStatus, { StatementBadge } from '../../components/StatementStatus';
import ConfirmModal from '../../components/ConfirmModal';
import TransferReportList from './TransferReportList';
import CapitalDistributionCard from './CapitalDistributionCard';
import StatementAttachments from './StatementAttachments';
import AffiliatePrepaymentStep from './AffiliatePrepaymentStep';
import usePolling from '../../hooks/usePolling';
import LoadingScreen from '../../components/LoadingScreen';

// Orden alineado al flujo real del cliente (ver
// backend/src/utils/subaccountProvisioning.js).
const CONDITION_ORDER = ['PAYMENT', 'FUNDS', 'API', 'ACTIVATION'];

const EMPTY_STATEMENT_FORM = {
  periodStart: '', periodEnd: '', startingBalance: '', endingBalance: '', resultAmount: '', resultPercentage: '', volatility: '', netResult: '', commission: '0', affiliateCommission: '', activityNotes: '', adminNotes: '',
};
// BORRADOR guardado → valores del formulario (fechas-calendario sin zona
// horaria, igual que formatDateOnly).
const dateInput = (value) => (value ? String(value).slice(0, 10) : '');
const numInput = (value) => (value === null || value === undefined ? '' : String(Number(value)));
function statementFormFromDraft(draft) {
  return {
    periodStart: dateInput(draft.periodStart),
    periodEnd: dateInput(draft.periodEnd),
    startingBalance: numInput(draft.startingBalance),
    endingBalance: numInput(draft.endingBalance),
    resultAmount: numInput(draft.resultAmount),
    resultPercentage: numInput(draft.resultPercentage),
    volatility: draft.volatility || '',
    netResult: numInput(draft.netResult),
    commission: numInput(draft.commission) || '0',
    affiliateCommission: numInput(draft.affiliateCommissionAmount),
    activityNotes: draft.activityNotes || '',
    adminNotes: draft.adminNotes || '',
  };
}

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

// Dentro del sistema (usuario ya autenticado) no se oculta información
// operativa: el valor siempre se muestra completo, con su botón Copiar al
// lado. La protección real vive en el backend (rutas por rol/pertenencia),
// no en máscaras visuales.
function SecretField({ label, value, t }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
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
      <code style={{ flex: 1, wordBreak: 'break-all', color: 'var(--qlc-text)' }}>{value}</code>
      <button type="button" className="qlc-btn ghost" onClick={copy}>
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </div>
  );
}

// QLC AFFILIATE PROGRAM — vista previa de la distribución de la RENTABILIDAD
// GENERADA que se registrará al emitir (el backend la recalcula y la guarda).
// Comisión del afiliador sugerida con el % vigente (solo con afiliador directo).
export function suggestedAffiliateCommission(resultAmount, distribution) {
  const profit = Number(resultAmount) > 0 ? Number(resultAmount) : 0;
  if (!distribution?.hasReferrer) return 0;
  return Math.round(((profit * distribution.affiliateSharePct) / 100) * 100) / 100;
}

function DistributionPreview({ resultAmount, distribution, affiliateCommission, t }) {
  const profit = Number(resultAmount) > 0 ? Number(resultAmount) : 0;
  const r2 = (n) => Math.round(n * 100) / 100;
  const client = r2((profit * distribution.clientSharePct) / 100);
  const affiliate =
    distribution.hasReferrer && affiliateCommission !== '' && affiliateCommission !== undefined
      ? r2(Number(affiliateCommission) || 0)
      : r2((profit * distribution.affiliateSharePct) / 100);
  const qlc = r2(profit - client - affiliate);
  return (
    <div className="qlc-invite-code" style={{ marginTop: 12 }}>
      <span>{t('statementStatus.distributionTitle')}</span>
      {profit > 0 ? (
        <small style={{ display: 'grid', gap: 2 }}>
          <span>
            {t('statementStatus.distClient')} ({distribution.clientSharePct}%): <strong>{client} USDT</strong>
          </span>
          <span>
            {t('statementStatus.distQlc')} ({distribution.qlcSharePct}%): <strong>{qlc} USDT</strong>
          </span>
          <span>
            {t('statementStatus.distAffiliate')} ({distribution.affiliateSharePct}%): <strong>{affiliate} USDT</strong>
          </span>
          {!distribution.hasReferrer && <span>{t('statementStatus.distNoAffiliate')}</span>}
        </small>
      ) : (
        <small>{t('statementStatus.distNoProfit')}</small>
      )}
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
  const [currentStatement, setCurrentStatement] = useState(null);
  // BORRADOR del estado de cuenta (uno por subcuenta, invisible para el cliente).
  const [statementDraft, setStatementDraft] = useState(null);
  // Porcentajes vigentes del QLC Affiliate Program + si el cliente tiene afiliador directo.
  const [statementDistribution, setStatementDistribution] = useState(null);
  // PAGO PREVIO al promotor afiliador (obligatorio antes de generar con
  // rentabilidad). `affiliateNoProfit` = el admin indica que el periodo no
  // tuvo rentabilidad (no hay comisión que pagar).
  const [affiliatePrepayment, setAffiliatePrepayment] = useState(null);
  const [affiliateNoProfit, setAffiliateNoProfit] = useState(false);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(false);
  // UID de recepción GENERAL (solo lectura aquí; se edita en Configuración · Plataforma).
  const [receiveUid, setReceiveUid] = useState('');
  const [confirmMarkPaid, setConfirmMarkPaid] = useState(null);
  // CORREGIR.xlsx CLIENTE 13 — reportes de distribución de capital, revisados por el admin.
  const [distributionReports, setDistributionReports] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [apiForm, setApiForm] = useState({ identifier: '', exchangeName: '', status: 'PENDIENTE', requiredCapital: '', ipRequired: false, ipAddress: '' });
  // CORRECCIÓN 6 (bloque de 20) — editar las credenciales API exige una
  // segunda confirmación explícita antes de guardar: este estado guarda el
  // resumen de lo que se va a cambiar mientras se espera esa confirmación.
  const [pendingApiSave, setPendingApiSave] = useState(null);
  const [statementForm, setStatementFormState] = useState(EMPTY_STATEMENT_FORM);
  // Mientras el admin edita, el sondeo no reemplaza el formulario con el borrador guardado.
  const statementDirty = useRef(false);
  const setStatementForm = (updater) => {
    statementDirty.current = true;
    setStatementFormState(updater);
  };
  const [creatingStatement, setCreatingStatement] = useState(false);
  // Bloqueo síncrono contra doble submit en Guardar borrador / Finalizar.
  const statementBusy = useRef(false);
  // PDF del estado de cuenta que el admin carga (se envía al cliente).
  const [statementPdf, setStatementPdf] = useState(null);
  const statementPdfRef = useRef(null);

  const apiStatusMap = API_CONNECTION_STATUS(t);

  // Evento del historial de conexión que el admin quiere borrar.
  const [deletingEvent, setDeletingEvent] = useState(null);
  // Estado de cuenta anterior que el admin quiere borrar del historial.
  const [hidingStatement, setHidingStatement] = useState(null);

  const applyStatements = (data) => {
    setStatementDistribution(data.distribution || null);
    setAffiliatePrepayment(data.affiliatePrepayment || null);
    setStatements(data.statements);
    setCurrentStatement(data.current);
    setStatementDraft(data.draft || null);
    // El borrador persistido se precarga en el formulario (solo si el admin
    // no está escribiendo en este momento).
    if (data.draft && !statementDirty.current) setStatementFormState(statementFormFromDraft(data.draft));
  };

  const load = () => {
    api.get(`/admin/clients/${clientId}`).then(({ data }) => {
      const found = data.client.apiSubaccounts.find((s) => s.id === id);
      setSubaccount(found);
      if (found) {
        setApiForm((f) => ({
          ...f,
          // Identificador interno: se precarga con el vigente, salvo que el
          // admin lo esté editando (el sondeo no pisa lo que escribe).
          identifier: f.identifierEdited ? f.identifier : found.identifier || '',
          status: found.status,
          requiredCapital: found.requiredCapital ?? '',
          ipRequired: Boolean(found.ipRequired),
          ipAddress: found.ipAddress || '',
        }));
      }
    });
    api.get(`/admin/api-subaccounts/${id}/secrets`).then(({ data }) => setSecrets(data.secrets));
    api.get('/admin/payment-reports', { params: { apiSubaccountId: id } }).then(({ data }) => setPayments(data.reports));
    api.get(`/admin/api-subaccounts/${id}/statements`).then(({ data }) => applyStatements(data));
    api
      .get('/admin/payment-configuration')
      .then(({ data }) => setReceiveUid(data.paymentData?.bitgetReceiveUid || ''))
      .catch(() => {});
    api
      .get('/admin/capital-distribution-reports', { params: { apiSubaccountId: id } })
      .then(({ data }) => setDistributionReports(data.reports));
  };
  // Al cambiar de subcuenta se vacían los datos dependientes (evita mezclar
  // pagos/datos de pago entre subcuentas si una respuesta falla o tarda).
  useEffect(() => {
    setPayments([]);
    setStatements([]);
    setCurrentStatement(null);
    setStatementDraft(null);
    statementDirty.current = false;
    setStatementFormState(EMPTY_STATEMENT_FORM);
    setDistributionReports([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Actualización sin refresh manual (sin re-ejecutar el load() completo,
  // que pisaría lo que el admin esté escribiendo en el formulario de
  // Conexión API): refresca reportes de transferencia, estado de cuenta,
  // reportes de distribución de capital y los campos de solo lectura de la
  // subcuenta (condiciones del proceso, historial de conexión, bandera de
  // "capital ya distribuido") — así una acción del CLIENTE (reportar pago,
  // reportar distribución) aparece aquí sin F5. Reutiliza el mismo
  // usePolling ya usado en el resto del panel (mensajes, notificaciones,
  // dashboard) en vez de un setInterval propio.
  const refreshLive = () => {
    api.get(`/admin/clients/${clientId}`).then(({ data }) => {
      const found = data.client.apiSubaccounts.find((s) => s.id === id);
      if (found) setSubaccount(found);
    });
    api.get('/admin/payment-reports', { params: { apiSubaccountId: id } }).then(({ data }) => setPayments(data.reports));
    api.get(`/admin/api-subaccounts/${id}/statements`).then(({ data }) => applyStatements(data));
    api
      .get('/admin/capital-distribution-reports', { params: { apiSubaccountId: id } })
      .then(({ data }) => setDistributionReports(data.reports));
  };
  usePolling(refreshLive, 8000);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!subaccount) return <LoadingScreen />;

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

  // CORRECCIÓN 6 (bloque de 20) — no guarda directamente: arma el payload y
  // un resumen legible de los cambios, y espera la segunda confirmación del
  // admin (ver pendingApiSave / confirmSaveApi) antes de llamar al backend.
  const requestSaveApi = (e) => {
    e.preventDefault();
    const payload = { status: apiForm.status, ipRequired: apiForm.ipRequired };
    const summary = [];
    // Obligatorio: siempre se envía (el backend también lo exige).
    payload.identifier = apiForm.identifier.trim();
    summary.push([t('adminClientDetail.internalIdentifier'), payload.identifier]);
    if (apiForm.exchangeName) { payload.exchangeName = apiForm.exchangeName; summary.push(['Exchange', apiForm.exchangeName]); }
    if (apiForm.requiredCapital !== '') { payload.requiredCapital = Number(apiForm.requiredCapital); summary.push([t('adminClientDetail.requiredCapital'), `${apiForm.requiredCapital} USDT`]); }
    payload.ipAddress = apiForm.ipRequired ? apiForm.ipAddress || null : null;
    summary.push([t('adminClientDetail.ipRequired'), apiForm.ipRequired ? t('common.yes') : t('common.no')]);
    if (apiForm.ipRequired && apiForm.ipAddress) summary.push(['IP', apiForm.ipAddress]);
    summary.push([t('adminClientDetail.status'), apiForm.status]);
    setPendingApiSave({ payload, summary });
  };

  const confirmSaveApi = async () => {
    if (!pendingApiSave) return;
    try {
      await api.patch(`/admin/api-subaccounts/${id}`, pendingApiSave.payload);
      setApiForm((f) => ({ ...f, identifierEdited: false }));
      setPendingApiSave(null);
      flash(t('adminClientDetail.apiConnectionUpdated'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setPendingApiSave(null);
    }
  };

  // CORRECCIÓN 5: "desde" se autocompleta en el backend a partir del fin del
  // periodo anterior de esta subcuenta/API — solo se envía si todavía no
  // existe ningún estado de cuenta previo (primer periodo).
  const hasPreviousStatement = statements.length > 0;
  const latestPeriodEnd = hasPreviousStatement
    ? statements.reduce((max, s) => (new Date(s.periodEnd) > new Date(max) ? s.periodEnd : max), statements[0].periodEnd)
    : null;

  // GUARDAR BORRADOR — UPDATE del único borrador de la subcuenta (lo crea la
  // primera vez). Sin PDF ni Drive: el PDF definitivo solo se sube al finalizar.
  // Valores a enviar: la comisión del afiliador, si el admin no la tocó, es la
  // sugerida con el % vigente (solo con afiliador directo).
  const affiliateGateLocked = Boolean(
    statementDistribution?.hasReferrer && affiliatePrepayment?.referrer && !affiliatePrepayment?.prepayment && !affiliateNoProfit
  );
  const paidAffiliateAmount = affiliatePrepayment?.prepayment ? String(affiliatePrepayment.prepayment.amount) : null;
  const effectiveStatementForm = () => ({
    ...statementForm,
    affiliateCommission: statementDistribution?.hasReferrer
      ? paidAffiliateAmount ?? (statementForm.affiliateCommission === ''
        ? String(suggestedAffiliateCommission(statementForm.resultAmount, statementDistribution))
        : statementForm.affiliateCommission)
      : '',
  });

  const saveStatementDraft = async () => {
    if (statementBusy.current) return;
    statementBusy.current = true;
    setCreatingStatement(true);
    setError('');
    try {
      const payload = {};
      Object.entries(effectiveStatementForm()).forEach(([key, value]) => {
        if (key === 'periodStart' && hasPreviousStatement) return;
        if (value !== '' && value !== null && value !== undefined) payload[key] = value;
      });
      const { data } = await api.put(`/admin/api-subaccounts/${id}/statements/draft`, payload);
      statementDirty.current = false;
      setStatementDraft(data.draft);
      setStatementFormState(statementFormFromDraft(data.draft));
      flash(t('statementStatus.draftSaved'));
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      statementBusy.current = false;
      setCreatingStatement(false);
    }
  };

  // FINALIZAR — el backend convierte el borrador (si existe) en el estado de
  // cuenta emitido: mismo registro, nunca uno nuevo.
  const createStatement = async (e) => {
    e.preventDefault();
    if (statementBusy.current) return;
    if (!statementPdf) {
      setError(t('statementStatus.pdfRequired'));
      return;
    }
    statementBusy.current = true;
    setCreatingStatement(true);
    setError('');
    try {
      // multipart: campos + el PDF del estado de cuenta (se adjunta al correo
      // del cliente y queda en su subcuenta). Los campos vacíos no se envían.
      const fd = new FormData();
      Object.entries(effectiveStatementForm()).forEach(([key, value]) => {
        if (key === 'periodStart' && hasPreviousStatement) return;
        if (value !== '' && value !== null && value !== undefined) fd.append(key, value);
      });
      fd.append('file', statementPdf);
      const { data } = await api.post(`/admin/api-subaccounts/${id}/statements`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      flash(data.emailSent ? t('statementStatus.generatedWithEmail') : t('statementStatus.generatedNoEmail'));
      statementDirty.current = false;
      setStatementDraft(null);
      setStatementFormState(EMPTY_STATEMENT_FORM);
      setStatementPdf(null);
      if (statementPdfRef.current) statementPdfRef.current.value = '';
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      statementBusy.current = false;
      setCreatingStatement(false);
    }
  };

  const deleteStatementDraft = async () => {
    await api.delete(`/admin/statements/${statementDraft.id}/draft`);
    statementDirty.current = false;
    setStatementDraft(null);
    setStatementFormState(EMPTY_STATEMENT_FORM);
    flash(t('statementStatus.draftDeleted'));
    load();
  };

  const markStatementPaid = async () => {
    await api.patch(`/admin/statements/${confirmMarkPaid}/mark-paid`);
    flash(t('statementStatus.markedPaid'));
    load();
  };

  const status = statusOf(apiStatusMap, subaccount.status, 'PENDIENTE');
  const conditionsSummary = subaccount.conditionsSummary || { total: 0, confirmed: 0, allConfirmed: false };
  const statementStatus = currentStatement?.status || 'NO_GENERADO';
  const hasUnpaidStatement = statementStatus === 'PENDIENTE_DE_PAGO' || statementStatus === 'VENCIDO_SIN_PAGAR';
  const latestStatement = statements[0] || null;

  return (
    <div>
      <Link to={`/admin/clients/${clientId}`} style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
        {t('adminClientDetail.backToClient')}
      </Link>

      <div className="qlc-page-header" style={{ marginTop: 10 }}>
        <div>
          <div className="qlc-kicker">{t('adminClientDetail.kicker')}</div>
          <h1 style={{ margin: 0 }}>
            {subaccount.isPrincipal ? t('clientSubaccounts.principalLabel') : `${t('clientSubaccounts.subaccountLabel')} #${subaccount.slotIndex}`}
          </h1>
          {/* PCB = identificador interno que QLC le asigna a esta cuenta. Se
              captura abajo, en "Conexión API" → "Identificador interno". */}
          <div style={{ fontSize: 13, color: subaccount.identifier ? 'var(--qlc-muted)' : 'var(--qlc-warn)' }}>
            {subaccount.identifier ? (
              <>
                PCB <code style={{ color: 'var(--qlc-blue2)' }}>{subaccount.identifier}</code>
              </>
            ) : (
              t('adminClientDetail.pcbUnassignedHowTo')
            )}
          </div>
        </div>
        <span className={`qlc-badge ${status.className}`}>{status.text}</span>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <div className="qlc-detail-grid masonry">
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
            {formatParticipationSplit(subaccount.clientModel?.model, t)}
          </p>

          <h3>{t('adminClientDetail.apiConnection')} ({subaccount.exchangeName || 'Bitget'})</h3>
          {secrets && (secrets.apiKey || secrets.apiSecret || secrets.apiPassphrase) && (
            <div style={{ borderBottom: '1px solid var(--qlc-line)', paddingBottom: 12, marginBottom: 12 }}>
              <SecretField label="API Key" value={secrets.apiKey} t={t} />
              <SecretField label="Secret Key" value={secrets.apiSecret} t={t} />
              <SecretField label="Passphrase" value={secrets.apiPassphrase} t={t} />
            </div>
          )}
          <form onSubmit={requestSaveApi}>
            {/* IDENTIFICADOR INTERNO — obligatorio, editable y guardado junto con
                la API Key. Control interno de QLC: el cliente no lo ve. */}
            <label className="qlc-label" htmlFor="internal-identifier">
              {t('adminClientDetail.internalIdentifier')} *
            </label>
            <input
              id="internal-identifier"
              className="qlc-input"
              value={apiForm.identifier}
              onChange={(e) => setApiForm((f) => ({ ...f, identifier: e.target.value, identifierEdited: true }))}
              placeholder="PCB-1-A-1"
              maxLength={60}
              required
              aria-required="true"
            />
            <p style={{ fontSize: 11, color: 'var(--qlc-muted)', margin: '4px 0 0' }}>{t('adminClientDetail.internalIdentifierHint')}</p>
            <label className="qlc-label">{t('adminClientDetail.requiredCapital')}</label>
            <input className="qlc-input" type="number" step="0.01" value={apiForm.requiredCapital} onChange={(e) => setApiForm((f) => ({ ...f, requiredCapital: e.target.value }))} placeholder="100" min="0" />
            <p style={{ fontSize: 11, color: 'var(--qlc-muted)', margin: '4px 0 0' }}>{t('adminClientDetail.requiredCapitalHint')}</p>
            <label className="qlc-label">{t('adminClientDetail.status')}</label>
            <select className="qlc-select" value={apiForm.status} onChange={(e) => setApiForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="PENDIENTE">{t('adminClientDetail.apiStatusPending')}</option>
              <option value="CONECTADA">{t('adminClientDetail.apiStatusConnected')}</option>
              <option value="DESCONECTADA">{t('adminClientDetail.apiStatusDisconnected')}</option>
            </select>
            {/* Motivo, API Key, Secret Key y Passphrase se retiraron de este
                formulario a pedido de QLC: aquí el admin solo administra el
                identificador, el capital requerido, el estado y la IP. Las
                credenciales registradas se siguen viendo/copiando arriba. */}

            {/* CORRECCIÓN 6/18 (bloque de 20) — dato administrativo; nunca
                se conecta ni valida contra el exchange. */}
            <label className="qlc-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <input
                type="checkbox"
                checked={apiForm.ipRequired}
                onChange={(e) => setApiForm((f) => ({ ...f, ipRequired: e.target.checked }))}
              />
              {t('adminClientDetail.ipRequired')}
            </label>
            {apiForm.ipRequired && (
              <>
                <label className="qlc-label">IP</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="qlc-input"
                    value={apiForm.ipAddress}
                    onChange={(e) => setApiForm((f) => ({ ...f, ipAddress: e.target.value }))}
                    placeholder="203.0.113.10"
                  />
                  {subaccount.ipAddress && (
                    <button
                      type="button"
                      className="qlc-btn ghost"
                      style={{ flexShrink: 0 }}
                      onClick={() => navigator.clipboard.writeText(subaccount.ipAddress).catch(() => {})}
                    >
                      {t('common.copy')}
                    </button>
                  )}
                </div>
              </>
            )}

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
                  <li key={ev.id} className="qlc-history-item">
                    <span>
                      <span className={`qlc-badge ${ev.eventType === 'DISCONNECTED' ? 'danger' : 'ok'}`}>
                        {t(`adminClientDetail.connectionEvent${ev.eventType}`)}
                      </span>{' '}
                      {formatCdmxDate(ev.occurredAt)}
                      {ev.reason && ` — ${ev.reason}`}
                    </span>
                    <button
                      type="button"
                      className="qlc-btn ghost qlc-trash-btn qlc-icon-only"
                      onClick={() => setDeletingEvent(ev)}
                      title={t('adminClientDetail.deleteHistoryEvent')}
                      aria-label={t('adminClientDetail.deleteHistoryEvent')}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminPayments.reports')} ({payments.filter((p) => !p.adminHiddenAt).length})
          </h3>
          {/* El UID de recepción es GENERAL (Configuración · Plataforma):
              aquí solo se muestra como referencia para revisar reportes. */}
          <p style={{ fontSize: 12, color: 'var(--qlc-muted)', marginTop: 0 }}>
            {t('adminPayments.receiveUid')}: <strong>{receiveUid || t('adminPayments.notConfigured')}</strong> ·{' '}
            <Link to="/admin/settings/platform">{t('adminPayments.editGeneral')}</Link>
          </p>
          <TransferReportList reports={payments} receiveUid={receiveUid} onChanged={load} />
        </div>

        <CapitalDistributionCard reports={distributionReports} onChanged={load} onMessage={flash} />


        <div className={`qlc-card qlc-card-span-all${statementStatus === 'PENDIENTE_DE_PAGO' ? ' qlc-card-attention' : ''}`}>
          <div className="qlc-statement-card-head">
            <h3>{t('statementStatus.title')}</h3>
            <StatementStatus status={statementStatus} expiresAt={currentStatement?.expiresAt} onExpire={load} />
          </div>
          {latestStatement && (
            <p className="qlc-statement-meta">
              {formatDateOnly(latestStatement.periodStart)} – {formatDateOnly(latestStatement.periodEnd)}
              {Number(latestStatement.commission) > 0 ? ` · ${latestStatement.commission} USDT` : ''}
            </p>
          )}
          {latestStatement?.clientResultAmount != null && (
            <p className="qlc-statement-meta" style={{ fontSize: 12 }}>
              {t('statementStatus.distClient')} ({Number(latestStatement.clientSharePct)}%): {Number(latestStatement.clientResultAmount)} USDT ·{' '}
              {t('statementStatus.distQlc')} ({Number(latestStatement.qlcSharePct)}%): {Number(latestStatement.qlcCommissionAmount)} USDT ·{' '}
              {t('statementStatus.distAffiliate')} ({Number(latestStatement.affiliateSharePct)}%): {Number(latestStatement.affiliateCommissionAmount)} USDT
              {!latestStatement.affiliateReferrerClientId && Number(latestStatement.affiliateCommissionAmount) > 0 ? ` (${t('statementStatus.distNoAffiliateShort')})` : ''}
            </p>
          )}
          <div className="qlc-statement-actions">
            {latestStatement?.pdfDriveFileId && (
              <a className="qlc-btn ghost" href={`${API_BASE_URL}/admin/statements/${latestStatement.id}/download`} target="_blank" rel="noreferrer">
                {t('statementStatus.viewPdf')}
              </a>
            )}
            {hasUnpaidStatement && latestStatement && (
              <button type="button" className="qlc-btn primary" onClick={() => setConfirmMarkPaid(latestStatement.id)}>
                {t('statementStatus.markPaid')}
              </button>
            )}
          </div>
          {latestStatement && <StatementAttachments statement={latestStatement} onChanged={load} />}
          {statements.slice(1).some((s) => !s.adminHiddenAt) && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>{t('statementStatus.previous')}</div>
              <ul className="qlc-plain-list qlc-statement-history" style={{ margin: 0 }}>
                {statements.slice(1).filter((s) => !s.adminHiddenAt).map((s) => (
                  <li key={s.id}>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      {formatDateOnly(s.periodStart)} – {formatDateOnly(s.periodEnd)}
                      {s.pdfDriveFileId && (
                        <>
                          {' · '}
                          <a href={`${API_BASE_URL}/admin/statements/${s.id}/download`} target="_blank" rel="noreferrer">
                            {t('statementStatus.viewPdf')}
                          </a>
                        </>
                      )}
                      <StatementAttachments statement={s} onChanged={load} compact />
                    </span>
                    <span className="qlc-history-head-right">
                      <StatementBadge status={s.status} />
                      {s.status === 'PAGADO' && (
                        <button
                          type="button"
                          className="qlc-btn ghost qlc-trash-btn qlc-icon-only"
                          onClick={() => setHidingStatement(s)}
                          title={t('statementStatus.deleteFromHistory')}
                          aria-label={t('statementStatus.deleteFromHistory')}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
                          </svg>
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={createStatement} style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginTop: 14 }}>
            <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {t('statementStatus.generateTitle')}
              {statementDraft && <span className="qlc-badge muted">{t('statementStatus.draftBadge')}</span>}
            </h4>
            <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: 0 }}>
              {hasUnpaidStatement ? t('statementStatus.blockedUnpaid') : t('statementStatus.generateHint')}
            </p>
            {statementDraft && (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: '4px 0 0' }}>
                {t('statementStatus.draftHint').replace('{date}', formatCdmxDateTime(statementDraft.generatedAt))}
              </p>
            )}
            {/* Cliente con promotor afiliador: primero se le paga su comisión
                (a su UID de Bitget) y se carga el comprobante; hasta entonces
                el formulario queda bloqueado. */}
            {statementDistribution?.hasReferrer && affiliatePrepayment?.referrer && !hasUnpaidStatement && (
              <AffiliatePrepaymentStep
                subaccountId={id}
                info={affiliatePrepayment}
                noProfit={affiliateNoProfit}
                onNoProfitChange={setAffiliateNoProfit}
                onChanged={load}
                suggestedAmount={suggestedAffiliateCommission(statementForm.resultAmount, statementDistribution)}
              />
            )}
            {affiliateGateLocked && (
              <div className="qlc-aff-locked" role="status">
                🔒 {t('affiliatePrepay.lockedNotice')}
              </div>
            )}
            <fieldset disabled={hasUnpaidStatement || creatingStatement || affiliateGateLocked} className="qlc-plain-fieldset">
            <div className="qlc-statement-form-grid">
              {hasPreviousStatement ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="qlc-label">{t('adminClientDetail.periodStart')}</label>
                  <input className="qlc-input" value={formatDateOnly(latestPeriodEnd)} disabled />
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
              {/* CORRECCIÓN 8 (bloque de 20) — USDT junto a cada importe
                  monetario; nunca en el % de rendimiento ni en volatilidad
                  (dato libre, no necesariamente monetario). */}
              <div>
                <label className="qlc-label">{t('adminClientDetail.startingBalance')} (USDT)</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.startingBalance} onChange={(e) => setStatementForm((f) => ({ ...f, startingBalance: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.endingBalance')} (USDT)</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.endingBalance} onChange={(e) => setStatementForm((f) => ({ ...f, endingBalance: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.resultAmount')} (USDT)</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.resultAmount} onChange={(e) => setStatementForm((f) => ({ ...f, resultAmount: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.resultPercentage')} (%)</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.resultPercentage} onChange={(e) => setStatementForm((f) => ({ ...f, resultPercentage: e.target.value }))} required />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.volatility')}</label>
                <input className="qlc-input" value={statementForm.volatility} onChange={(e) => setStatementForm((f) => ({ ...f, volatility: e.target.value }))} />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.netResult')} (USDT)</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.netResult} onChange={(e) => setStatementForm((f) => ({ ...f, netResult: e.target.value }))} />
              </div>
              <div>
                <label className="qlc-label">{t('adminClientDetail.commission')} (USDT)</label>
                <input className="qlc-input" type="number" step="0.01" value={statementForm.commission} onChange={(e) => setStatementForm((f) => ({ ...f, commission: e.target.value }))} />
              </div>
              {/* COMISIÓN DEL AFILIADOR — se propone sola con el % vigente al
                  escribir la rentabilidad; el admin puede ajustarla. Al
                  generar, el cliente la ve en su estado de cuenta y el
                  afiliador en su Affiliate Dashboard al mismo tiempo. */}
              <div>
                <label className="qlc-label">{t('adminClientDetail.affiliateCommission')} (USDT)</label>
                <input
                  className="qlc-input"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!statementDistribution?.hasReferrer || Boolean(paidAffiliateAmount)}
                  value={
                    statementDistribution?.hasReferrer
                      ? paidAffiliateAmount ?? (statementForm.affiliateCommission === ''
                        ? String(suggestedAffiliateCommission(statementForm.resultAmount, statementDistribution))
                        : statementForm.affiliateCommission)
                      : '0'
                  }
                  onChange={(e) => setStatementForm((f) => ({ ...f, affiliateCommission: e.target.value }))}
                />
                <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>
                  {statementDistribution?.hasReferrer
                    ? paidAffiliateAmount
                      ? t('adminClientDetail.affiliateCommissionPaid')
                      : t('adminClientDetail.affiliateCommissionHint').replace('{pct}', statementDistribution.affiliateSharePct)
                    : t('adminClientDetail.affiliateCommissionNoReferrer')}
                </p>
              </div>
            </div>
            {statementDistribution && (
              <DistributionPreview
                resultAmount={statementForm.resultAmount}
                distribution={statementDistribution}
                affiliateCommission={paidAffiliateAmount ?? (statementForm.affiliateCommission === '' ? undefined : statementForm.affiliateCommission)}
                t={t}
              />
            )}
            <label className="qlc-label">{t('adminClientDetail.activityNotes')}</label>
            <textarea className="qlc-textarea" rows={2} value={statementForm.activityNotes} onChange={(e) => setStatementForm((f) => ({ ...f, activityNotes: e.target.value }))} />
            <label className="qlc-label">{t('adminClientDetail.adminNotes')}</label>
            <textarea className="qlc-textarea" rows={2} value={statementForm.adminNotes} onChange={(e) => setStatementForm((f) => ({ ...f, adminNotes: e.target.value }))} />
            {/* PDF del estado de cuenta: se envía al cliente adjunto en el
                correo, se avisa por mensajería interna y queda descargable
                en su subcuenta. */}
            <label className="qlc-label" htmlFor="statement-pdf">{t('statementStatus.pdfLabel')}</label>
            <input
              id="statement-pdf"
              ref={statementPdfRef}
              type="file"
              className="qlc-input"
              accept="application/pdf"
              required
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && file.type !== 'application/pdf') {
                  setError(t('statementStatus.pdfOnly'));
                  e.target.value = '';
                  setStatementPdf(null);
                  return;
                }
                setError('');
                setStatementPdf(file);
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>{t('statementStatus.pdfHint')}</p>
            <div className="qlc-form-actions" style={{ marginTop: 12, flexWrap: 'wrap' }}>
              <button type="button" className="qlc-btn ghost" onClick={saveStatementDraft}>
                {t('statementStatus.saveDraft')}
              </button>
              <button type="submit" className="qlc-btn primary">
                {creatingStatement ? t('common.saving') : statementDraft ? t('statementStatus.finalize') : t('statementStatus.generate')}
              </button>
              {statementDraft && (
                <button type="button" className="qlc-btn danger" onClick={() => setConfirmDeleteDraft(true)}>
                  {t('statementStatus.deleteDraft')}
                </button>
              )}
            </div>
            </fieldset>
          </form>
        </div>
      </div>

      {hidingStatement && (
        <ConfirmModal
          title={t('statementStatus.deleteFromHistoryTitle')}
          message={t('statementStatus.adminDeleteFromHistoryMessage').replace(
            '{period}',
            `${formatDateOnly(hidingStatement.periodStart)} – ${formatDateOnly(hidingStatement.periodEnd)}`
          )}
          confirmLabel={t('statementStatus.deleteFromHistory')}
          onClose={() => setHidingStatement(null)}
          onConfirm={async () => {
            await api.delete(`/admin/statements/${hidingStatement.id}/history`);
            load();
          }}
        />
      )}

      {deletingEvent && (
        <ConfirmModal
          title={t('adminClientDetail.deleteHistoryEventTitle')}
          message={t('adminClientDetail.deleteHistoryEventMessage')
            .replace('{event}', t(`adminClientDetail.connectionEvent${deletingEvent.eventType}`))
            .replace('{date}', formatCdmxDate(deletingEvent.occurredAt))}
          confirmLabel={t('adminClientDetail.deleteHistoryEvent')}
          onClose={() => setDeletingEvent(null)}
          onConfirm={async () => {
            await api.delete(`/admin/api-subaccounts/${id}/connection-events/${deletingEvent.id}`);
            load();
          }}
        />
      )}

      {confirmDeleteDraft && statementDraft && (
        <ConfirmModal
          title={t('statementStatus.deleteDraftTitle')}
          message={t('statementStatus.deleteDraftMessage')}
          confirmLabel={t('statementStatus.deleteDraft')}
          onClose={() => setConfirmDeleteDraft(false)}
          onConfirm={deleteStatementDraft}
        />
      )}

      {confirmMarkPaid && (
        <ConfirmModal
          title={t('statementStatus.markPaidTitle')}
          message={t('statementStatus.markPaidMessage')}
          confirmLabel={t('statementStatus.markPaid')}
          danger={false}
          onClose={() => setConfirmMarkPaid(null)}
          onConfirm={markStatementPaid}
        />
      )}

      {pendingApiSave && (
        <div className="qlc-modal-overlay">
          <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2>{t('adminClientDetail.confirmApiChangesTitle')}</h2>
            <ul className="qlc-plain-list" style={{ fontSize: 13, marginBottom: 16 }}>
              {pendingApiSave.summary.map(([label, value]) => (
                <li key={label}>
                  <strong>{label}:</strong> {value}
                </li>
              ))}
            </ul>
            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={() => setPendingApiSave(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="qlc-btn primary" onClick={confirmSaveApi}>
                {t('adminClientDetail.confirmAndSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

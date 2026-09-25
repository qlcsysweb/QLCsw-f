import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { API_CONNECTION_STATUS, PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatDateOnly } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import StatementStatus, { StatementBadge } from '../../components/StatementStatus';
import ConfirmModal from '../../components/ConfirmModal';
import TransferReportList from './TransferReportList';

// Orden alineado al flujo real del cliente (ver
// backend/src/utils/subaccountProvisioning.js).
const CONDITION_ORDER = ['PAYMENT', 'FUNDS', 'API', 'ACTIVATION'];

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

export default function AdminSubaccountDetailPage() {
  const { clientId, id } = useParams();
  const { t, language } = useLanguage();
  const [subaccount, setSubaccount] = useState(null);
  const [secrets, setSecrets] = useState(null);
  const [payments, setPayments] = useState([]);
  const [statements, setStatements] = useState([]);
  const [currentStatement, setCurrentStatement] = useState(null);
  const [receiveUid, setReceiveUid] = useState('');
  // DATOS DE PAGO de ESTA subcuenta (UID de recepción Bitget + instrucciones).
  const [paymentForm, setPaymentForm] = useState({ bitgetReceiveUid: '', instructions: '', dirty: false });
  const [savingPaymentData, setSavingPaymentData] = useState(false);
  const [paymentDataMsg, setPaymentDataMsg] = useState('');
  const [confirmMarkPaid, setConfirmMarkPaid] = useState(null);
  // CORREGIR.xlsx CLIENTE 13 — reportes de distribución de capital, revisados por el admin.
  const [distributionReports, setDistributionReports] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [apiForm, setApiForm] = useState({ identifier: '', exchangeName: '', apiKey: '', apiSecret: '', apiPassphrase: '', status: 'PENDIENTE', requiredCapital: '', connectionReason: '', ipRequired: false, ipAddress: '' });
  // CORRECCIÓN 6 (bloque de 20) — editar las credenciales API exige una
  // segunda confirmación explícita antes de guardar: este estado guarda el
  // resumen de lo que se va a cambiar mientras se espera esa confirmación.
  const [pendingApiSave, setPendingApiSave] = useState(null);
  const [statementForm, setStatementForm] = useState({
    periodStart: '', periodEnd: '', startingBalance: '', endingBalance: '', resultAmount: '', resultPercentage: '', volatility: '', netResult: '', commission: '0', activityNotes: '', adminNotes: '',
  });
  const [creatingStatement, setCreatingStatement] = useState(false);

  const apiStatusMap = API_CONNECTION_STATUS(t);
  const paymentStatusMap = PAYMENT_REPORT_STATUS(t);

  const load = () => {
    api.get(`/admin/clients/${clientId}`).then(({ data }) => {
      const found = data.client.apiSubaccounts.find((s) => s.id === id);
      setSubaccount(found);
      if (found) {
        setApiForm((f) => ({
          ...f,
          status: found.status,
          requiredCapital: found.requiredCapital ?? '',
          ipRequired: Boolean(found.ipRequired),
          ipAddress: found.ipAddress || '',
        }));
      }
    });
    api.get(`/admin/api-subaccounts/${id}/secrets`).then(({ data }) => setSecrets(data.secrets));
    api.get('/admin/payment-reports', { params: { apiSubaccountId: id } }).then(({ data }) => setPayments(data.reports));
    api.get(`/admin/api-subaccounts/${id}/statements`).then(({ data }) => {
      setStatements(data.statements);
      setCurrentStatement(data.current);
    });
    api
      .get(`/admin/api-subaccounts/${id}/payment-data`)
      .then(({ data }) => {
        setReceiveUid(data.paymentData?.bitgetReceiveUid || '');
        // No pisa lo que el admin está escribiendo en el formulario.
        setPaymentForm((f) => (f.dirty ? f : { bitgetReceiveUid: data.paymentData?.bitgetReceiveUid || '', instructions: data.paymentData?.instructions || '', dirty: false }));
      })
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
    setReceiveUid('');
    setPaymentForm({ bitgetReceiveUid: '', instructions: '', dirty: false });
    setDistributionReports([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Actualización sin refresh manual: reportes de transferencia y estado de
  // cuenta (sin re-ejecutar el load() completo, para no pisar formularios).
  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/admin/payment-reports', { params: { apiSubaccountId: id } }).then(({ data }) => setPayments(data.reports));
      api.get(`/admin/api-subaccounts/${id}/statements`).then(({ data }) => {
        setStatements(data.statements);
        setCurrentStatement(data.current);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [id]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const savePaymentData = async (e) => {
    e.preventDefault();
    setSavingPaymentData(true);
    setError('');
    try {
      await api.put(`/admin/api-subaccounts/${id}/payment-data`, {
        bitgetReceiveUid: paymentForm.bitgetReceiveUid.trim(),
        instructions: paymentForm.instructions,
      });
      setPaymentForm((f) => ({ ...f, dirty: false }));
      setPaymentDataMsg(t('adminPayments.updated'));
      setTimeout(() => setPaymentDataMsg(''), 3000);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSavingPaymentData(false);
    }
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

  // CORRECCIÓN 6 (bloque de 20) — no guarda directamente: arma el payload y
  // un resumen legible de los cambios, y espera la segunda confirmación del
  // admin (ver pendingApiSave / confirmSaveApi) antes de llamar al backend.
  const requestSaveApi = (e) => {
    e.preventDefault();
    const payload = { status: apiForm.status, ipRequired: apiForm.ipRequired };
    const summary = [];
    if (apiForm.identifier) { payload.identifier = apiForm.identifier; summary.push([t('adminClientDetail.identifier'), apiForm.identifier]); }
    if (apiForm.exchangeName) { payload.exchangeName = apiForm.exchangeName; summary.push(['Exchange', apiForm.exchangeName]); }
    if (apiForm.apiKey) { payload.apiKey = apiForm.apiKey; summary.push(['API Key', t('adminClientDetail.willChangeValue')]); }
    if (apiForm.apiSecret) { payload.apiSecret = apiForm.apiSecret; summary.push(['Secret Key', t('adminClientDetail.willChangeValue')]); }
    if (apiForm.apiPassphrase) { payload.apiPassphrase = apiForm.apiPassphrase; summary.push(['Passphrase', t('adminClientDetail.willChangeValue')]); }
    if (apiForm.requiredCapital !== '') { payload.requiredCapital = Number(apiForm.requiredCapital); summary.push([t('adminClientDetail.requiredCapital'), `${apiForm.requiredCapital} USDT`]); }
    if (apiForm.connectionReason) { payload.connectionReason = apiForm.connectionReason; summary.push([t('adminClientDetail.connectionReason'), apiForm.connectionReason]); }
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
      setApiForm((f) => ({ ...f, identifier: '', apiKey: '', apiSecret: '', apiPassphrase: '', connectionReason: '' }));
      setPendingApiSave(null);
      flash(t('adminClientDetail.apiConnectionUpdated'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setPendingApiSave(null);
    }
  };

  const reviewDistribution = async (reportId, status) => {
    await api.patch(`/admin/capital-distribution-reports/${reportId}`, { status });
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
      flash(t('statementStatus.generated'));
      setStatementForm({ periodStart: '', periodEnd: '', startingBalance: '', endingBalance: '', resultAmount: '', resultPercentage: '', volatility: '', netResult: '', commission: '0', activityNotes: '', adminNotes: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setCreatingStatement(false);
    }
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
              <SecretField label="API Key" value={secrets.apiKey} t={t} />
              <SecretField label="Secret Key" value={secrets.apiSecret} t={t} />
              <SecretField label="Passphrase" value={secrets.apiPassphrase} t={t} />
            </div>
          )}
          <form onSubmit={requestSaveApi}>
            <label className="qlc-label">{t('adminClientDetail.identifier')}</label>
            <input className="qlc-input" value={apiForm.identifier} onChange={(e) => setApiForm((f) => ({ ...f, identifier: e.target.value }))} placeholder={subaccount.identifier || 'PCB-1-A-1'} />
            <label className="qlc-label">{t('adminClientDetail.requiredCapital')}</label>
            <input className="qlc-input" type="number" step="0.01" value={apiForm.requiredCapital} onChange={(e) => setApiForm((f) => ({ ...f, requiredCapital: e.target.value }))} placeholder="20" />
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
            <input className="qlc-input" value={apiForm.apiSecret} onChange={(e) => setApiForm((f) => ({ ...f, apiSecret: e.target.value }))} placeholder={t('adminClientDetail.leaveBlank')} />
            <label className="qlc-label">Passphrase {subaccount.hasApiPassphrase ? t('adminClientDetail.alreadyRegistered') : ''}</label>
            <input className="qlc-input" value={apiForm.apiPassphrase} onChange={(e) => setApiForm((f) => ({ ...f, apiPassphrase: e.target.value }))} placeholder={t('adminClientDetail.leaveBlank')} />

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
          <h3 style={{ marginTop: 0 }}>{t('adminPayments.configTitle')}</h3>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted)', marginTop: 0 }}>{t('adminPayments.configHint')}</p>
          <form onSubmit={savePaymentData}>
            <label className="qlc-label" htmlFor="bitget-uid">{t('adminPayments.receiveUid')}</label>
            <input
              id="bitget-uid"
              className="qlc-input"
              inputMode="numeric"
              maxLength={40}
              placeholder={t('adminPayments.receiveUidPlaceholder')}
              value={paymentForm.bitgetReceiveUid}
              onChange={(e) => setPaymentForm((f) => ({ ...f, dirty: true, bitgetReceiveUid: e.target.value.replace(/\D/g, '') }))}
            />
            <label className="qlc-label" htmlFor="bitget-instructions">{t('adminPayments.instructions')}</label>
            <textarea
              id="bitget-instructions"
              className="qlc-textarea"
              rows={3}
              value={paymentForm.instructions}
              onChange={(e) => setPaymentForm((f) => ({ ...f, dirty: true, instructions: e.target.value }))}
            />
            <div className="qlc-form-actions">
              {paymentDataMsg && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{paymentDataMsg}</span>}
              <button className="qlc-btn primary" disabled={savingPaymentData}>{t('common.save')}</button>
            </div>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminPayments.reports')} ({payments.length})
          </h3>
          <TransferReportList reports={payments} receiveUid={receiveUid} onChanged={load} />
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminClientDetail.distributionReports')} ({distributionReports.length})
          </h3>
          {distributionReports.length ? (
            <ul className="qlc-plain-list">
              {distributionReports.map((r) => {
                const s = statusOf(paymentStatusMap, r.status, 'PENDING');
                return (
                  <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {r.amount} USDT — <span className={`qlc-badge ${s.className}`}>{s.text}</span>
                      {r.note && <span style={{ color: 'var(--qlc-muted2)' }}> · {r.note}</span>}
                    </span>
                    {r.status !== 'APROBADO' && (
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button className="qlc-btn ghost" onClick={() => reviewDistribution(r.id, 'APROBADO')}>{t('adminClientDetail.confirm')}</button>
                        <button className="qlc-btn ghost" onClick={() => reviewDistribution(r.id, 'RECHAZADO')}>{t('adminClientDetail.reject')}</button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="qlc-empty">{t('adminClientDetail.noDistributionReports')}</div>
          )}
        </div>

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
          {statements.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>{t('statementStatus.previous')}</div>
              <ul className="qlc-plain-list qlc-statement-history" style={{ margin: 0 }}>
                {statements.slice(1).map((s) => (
                  <li key={s.id}>
                    <span>
                      {formatDateOnly(s.periodStart)} – {formatDateOnly(s.periodEnd)}
                      {s.pdfDriveFileId && (
                        <>
                          {' · '}
                          <a href={`${API_BASE_URL}/admin/statements/${s.id}/download`} target="_blank" rel="noreferrer">
                            {t('statementStatus.viewPdf')}
                          </a>
                        </>
                      )}
                    </span>
                    <StatementBadge status={s.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={createStatement} style={{ borderTop: '1px solid var(--qlc-line)', paddingTop: 14, marginTop: 14 }}>
            <h4 style={{ margin: '0 0 4px' }}>{t('statementStatus.generateTitle')}</h4>
            <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: 0 }}>
              {hasUnpaidStatement ? t('statementStatus.blockedUnpaid') : t('statementStatus.generateHint')}
            </p>
            <fieldset disabled={hasUnpaidStatement || creatingStatement} className="qlc-plain-fieldset">
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
            </div>
            <label className="qlc-label">{t('adminClientDetail.activityNotes')}</label>
            <textarea className="qlc-textarea" rows={2} value={statementForm.activityNotes} onChange={(e) => setStatementForm((f) => ({ ...f, activityNotes: e.target.value }))} />
            <label className="qlc-label">{t('adminClientDetail.adminNotes')}</label>
            <textarea className="qlc-textarea" rows={2} value={statementForm.adminNotes} onChange={(e) => setStatementForm((f) => ({ ...f, adminNotes: e.target.value }))} />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }}>
              {creatingStatement ? t('common.saving') : t('statementStatus.generate')}
            </button>
            </fieldset>
          </form>
        </div>
      </div>

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

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import Modal from '../../components/Modal';
import { API_CONNECTION_STATUS, PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatDateOnly } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import ModelComparisonTable from '../../components/ModelComparisonTable';
import StatementStatus, { StatementBadge } from '../../components/StatementStatus';
import BitgetTransferSection from './BitgetTransferSection';
import usePolling from '../../hooks/usePolling';

function ModelDetailsModal({ model, onClose, onSelect, selecting, t }) {
  return (
    <Modal title={model.name} onClose={onClose} width={600}>
      {model.tagline && <p style={{ color: 'var(--qlc-blue2)', fontWeight: 600 }}>{model.tagline}</p>}
      <p style={{ color: 'var(--qlc-muted)', fontSize: 14, lineHeight: 1.6 }}>{model.description}</p>
      {model.conditions && (
        <p style={{ fontSize: 13 }}>
          <strong>{t('clientModels.conditions')}:</strong> {model.conditions}
        </p>
      )}
      {model.period && (
        <p style={{ fontSize: 13 }}>
          <strong>{t('clientModels.period')}:</strong> {model.period}
        </p>
      )}
      {model.objective && (
        <p style={{ fontSize: 13 }}>
          <strong>{t('clientModels.objective')}:</strong> {model.objective}
        </p>
      )}
      {model.detailsContent && (
        <p style={{ fontSize: 13, color: 'var(--qlc-muted)', whiteSpace: 'pre-line', marginTop: 14 }}>
          {model.detailsContent}
        </p>
      )}
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="qlc-btn primary" disabled={selecting} onClick={onSelect}>
          {selecting ? t('common.saving') : t('clientModels.selectConfirm').replace('{model}', model.name)}
        </button>
      </div>
    </Modal>
  );
}

export default function SubaccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [subaccount, setSubaccount] = useState(null);
  // Cuando la subcuenta ya no está disponible (desactivada, borrada de la
  // URL, o de otro cliente) guardamos por qué, y dejamos de sondear el
  // backend — evita el bucle de 404 infinitos reportado en consola.
  const [unavailable, setUnavailable] = useState(null);
  const [modelsRaw, setModelsRaw] = useState([]);
  const [detailsModel, setDetailsModel] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [apiForm, setApiForm] = useState({ exchangeName: '', apiKey: '', apiSecret: '', apiPassphrase: '', ipAddress: '' });
  const [savingApi, setSavingApi] = useState(false);
  const [payments, setPayments] = useState([]);
  const [statements, setStatements] = useState([]);
  const [currentStatement, setCurrentStatement] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const location = useLocation();
  const scrolledToHash = useRef(false);
  // CORREGIR.xlsx CLIENTE 13 — reporte real de distribución de capital.
  const [distributionReports, setDistributionReports] = useState([]);
  const [distributionForm, setDistributionForm] = useState({ note: '' });
  const [reportingDistribution, setReportingDistribution] = useState(false);

  const apiStatusMap = API_CONNECTION_STATUS(t);
  const paymentStatusMap = PAYMENT_REPORT_STATUS(t);

  const load = () => {
    api
      .get(`/client/api-subaccounts/${id}`)
      .then(({ data }) => {
        setSubaccount(data.subaccount);
        setApiForm((f) => ({ ...f, ipAddress: data.subaccount.ipAddress || '' }));
        setUnavailable(null);
        // Los datos dependientes de la subcuenta solo se piden si la
        // subcuenta principal existe y sigue activa — evita repetir el
        // patrón de 404 en cascada reportado (todos estos endpoints
        // dependen del mismo :id, así que fallan igual si la subcuenta ya
        // no está disponible).
        api.get('/client/models').then(({ data }) => setModelsRaw(data.models)).catch(() => {});
        api
          .get(`/client/api-subaccounts/${id}/payment-reports`)
          .then(({ data }) => setPayments(data.reports))
          .catch(() => {});
        api
          .get(`/client/api-subaccounts/${id}/statements`)
          .then(({ data }) => {
            setStatements(data.statements);
            setCurrentStatement(data.current);
          })
          .catch(() => {});
        // Datos de pago de ESTA subcuenta (no existe un dato general de pagos).
        api
          .get(`/client/api-subaccounts/${id}/payment-data`)
          .then(({ data }) => setPaymentConfig(data.paymentData))
          .catch(() => {});
        api
          .get(`/client/api-subaccounts/${id}/capital-distribution-reports`)
          .then(({ data }) => setDistributionReports(data.reports))
          .catch(() => {});
      })
      .catch((err) => {
        // 410 = existe y es del cliente, pero fue desactivada por
        // administración (respuesta controlada del backend, ver
        // apiSubaccountController.getMine). Cualquier otro código (404
        // típicamente) significa que no existe o no es del cliente; nunca
        // se distingue cuál de las dos cosas es, por protección IDOR.
        const isDeactivated = err.status === 410 || err.details?.code === 'SUBACCOUNT_DEACTIVATED';
        setUnavailable(
          isDeactivated ? translateBackendMessage(err.message, language) : t('clientSubaccountDetail.unavailableGeneric')
        );
      });
  };
  // Al cambiar de subcuenta se vacían TODOS los datos dependientes antes de
  // pedir los de la nueva: así una subcuenta jamás muestra (ni conserva por
  // un fallo de red) datos de la anterior.
  useEffect(() => {
    setSubaccount(null);
    setPayments([]);
    setStatements([]);
    setCurrentStatement(null);
    setPaymentConfig(null);
    setDistributionReports([]);
    setUnavailable(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Acceso directo "Ir a pagar" desde el dashboard (#garantia): una sola
  // vez, en cuanto la sección ya está renderizada.
  useEffect(() => {
    if (!subaccount || scrolledToHash.current || location.hash !== '#garantia') return;
    scrolledToHash.current = true;
    requestAnimationFrame(() => document.getElementById('garantia')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [subaccount, location.hash]);

  // Actualización sin refresh manual: si administración marca la
  // transferencia como recibida, el cliente lo ve sin recargar la página.
  // Reutiliza el mismo patrón de polling ya usado en el chat de soporte
  // (ChatPanel, SupportPage.jsx) — sin agregar WebSockets ni infraestructura
  // nueva. Se detiene solo (intervalMs=0) en cuanto la subcuenta deja de
  // estar disponible, en vez de insistir cada 8s contra un 404/410.
  usePolling(load, unavailable ? 0 : 8000);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  if (unavailable) {
    return (
      <div className="qlc-empty" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <p>{unavailable}</p>
        <button className="qlc-btn primary" onClick={() => navigate('/client/api-subaccounts')}>
          {t('clientSubaccountDetail.backToList')}
        </button>
      </div>
    );
  }

  if (!subaccount) return <div className="qlc-empty">{t('common.loading')}</div>;

  const status = statusOf(apiStatusMap, subaccount.status, 'PENDIENTE');
  const models = modelsRaw.map((m) => getLocalizedModel(m, language));
  const hasModel = Boolean(subaccount.clientModel);
  const modelConfirmed = Boolean(subaccount.clientModel?.confirmedAt);
  // Garantía confirmada = algún reporte de garantía (sin estado de cuenta
  // ligado) ya CONFIRMADO. `payments` viene ordenado desc. desde backend.
  const guaranteeConfirmed = payments.some((p) => !p.statementId && p.status === 'APROBADO');
  const statementStatus = currentStatement?.status || 'NO_GENERADO';
  const hasUnpaidStatement = statementStatus === 'PENDIENTE_DE_PAGO' || statementStatus === 'VENCIDO_SIN_PAGAR';
  const latestStatement = statements[0] || null;

  const selectModel = async (modelId) => {
    setSelecting(true);
    setError('');
    try {
      await api.post(`/client/api-subaccounts/${id}/model`, { modelId });
      setDetailsModel(null);
      flash(t('clientModels.confirmed'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSelecting(false);
    }
  };

  const confirmModel = async () => {
    setSelecting(true);
    setError('');
    try {
      await api.post(`/client/api-subaccounts/${id}/model/confirm`);
      flash(t('clientModels.confirmed'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSelecting(false);
    }
  };

  const saveApi = async (e) => {
    e.preventDefault();
    setSavingApi(true);
    setError('');
    try {
      const payload = {};
      if (apiForm.exchangeName) payload.exchangeName = apiForm.exchangeName;
      if (apiForm.apiKey) payload.apiKey = apiForm.apiKey;
      if (apiForm.apiSecret) payload.apiSecret = apiForm.apiSecret;
      if (apiForm.apiPassphrase) payload.apiPassphrase = apiForm.apiPassphrase;
      // CORRECCIÓN 18 (bloque de 20) — el cliente solo puede declarar su IP
      // cuando el admin ya la marcó como requerida; "ipRequired" en sí
      // nunca lo puede cambiar el cliente.
      if (subaccount.ipRequired && apiForm.ipAddress) payload.ipAddress = apiForm.ipAddress;
      await api.patch(`/client/api-subaccounts/${id}`, payload);
      setApiForm((f) => ({ ...f, exchangeName: '', apiKey: '', apiSecret: '', apiPassphrase: '' }));
      flash(t('clientApiConnection.savedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSavingApi(false);
    }
  };

  // CORREGIR.xlsx CLIENTE 13 — reporte real de distribución de capital
  // ("YA DISTRIBUÍ MI CAPITAL"), con el mismo patrón que el reporte de
  // pago: nota opcional, revisado por QLC (nunca auto-aprobado). El sistema
  // JAMÁS se conecta al exchange para validar el saldo. El monto ya NO lo
  // escribe el cliente — el backend lo toma directo de requiredCapital.
  const submitDistributionReport = async (e) => {
    e.preventDefault();
    if (subaccount.requiredCapital == null) return;
    setReportingDistribution(true);
    setError('');
    try {
      await api.post(`/client/api-subaccounts/${id}/capital-distribution-reports`, {
        note: distributionForm.note || undefined,
      });
      flash(t('clientApiConnection.capitalReportedOk'));
      setDistributionForm({ note: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setReportingDistribution(false);
    }
  };

  return (
    <div>
      <Link to="/client/api-subaccounts" style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
        {t('clientSubaccountDetail.back')}
      </Link>

      <div className="qlc-page-header" style={{ marginTop: 10 }}>
        <div>
          <div className="qlc-kicker">{t('clientSubaccountDetail.kicker')}</div>
          <h1 style={{ margin: 0 }}>{subaccount.identifier || t('clientSubaccounts.unassignedIdentifier')}</h1>
        </div>
        <span className={`qlc-badge ${status.className}`}>{status.text}</span>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      {subaccount.process && (
        <div className="qlc-card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('clientProcess.title')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {['PAYMENT', 'FUNDS', 'API', 'ACTIVATION'].map((type) => {
              const condition = subaccount.process.conditions.find((c) => c.type === type);
              const cStatus = condition?.status || 'PENDING';
              const info =
                cStatus === 'CONFIRMED'
                  ? { text: `✓ ${t('clientProcess.completed')}`, className: 'ok' }
                  : cStatus === 'REJECTED'
                    ? { text: `! ${t('clientProcess.needsAttention')}`, className: 'danger' }
                    : { text: `○ ${t('clientProcess.pending')}`, className: 'warn' };
              return (
                <div key={type} style={{ fontSize: 12 }}>
                  <div style={{ color: 'var(--qlc-muted2)', marginBottom: 4 }}>{t(`status.conditionType.${type}`)}</div>
                  <span className={`qlc-badge ${info.className}`}>{info.text}</span>
                </div>
              );
            })}
          </div>
          {subaccount.process.isActivated && (
            <p style={{ marginTop: 12, color: 'var(--qlc-ok)', fontSize: 13 }}>
              ✓ {t('clientProcess.activatedSince')} {formatCdmxDate(subaccount.process.activatedAt)}.
            </p>
          )}
        </div>
      )}

      <div className="qlc-detail-grid">
        {/* CORREGIR(2).xlsx CLIENTE 29 — "Tu contrato" ya no existe; esta
            tarjeta ocupa ahora ese espacio (grid-column: 1 / -1, ver
            theme.css) cuando muestra la tabla de comparación, para que no
            quede apretada en una sola columna de ~320px. */}
        <div className={`qlc-card${!hasModel ? ' qlc-card-span-all' : ''}`}>
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>{t('clientModels.title')}</h3>
          {!hasModel && (
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginBottom: 16 }}>{t('clientModels.subtitle')}</p>
          )}
          {hasModel ? (
            <>
              {!modelConfirmed && (
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--qlc-blue2)', marginBottom: 6 }}>
                  {t('clientModels.selectedBanner').replace('{model}', getLocalizedModel(subaccount.clientModel.model, language).name)}
                </p>
              )}
              {!modelConfirmed && (
                <p style={{ fontSize: 12, color: 'var(--qlc-muted)', marginBottom: 12 }}>{t('clientModels.selectedIntro')}</p>
              )}
              <p style={{ fontSize: 15, fontWeight: 600 }}>{getLocalizedModel(subaccount.clientModel.model, language).name}</p>
              <span className={`qlc-badge ${modelConfirmed ? 'ok' : 'warn'}`}>
                {modelConfirmed ? t('clientModels.currentModel') : t('clientModels.pendingConfirm')}
              </span>
              {!modelConfirmed && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="qlc-btn ghost" style={{ flex: 1 }} onClick={() => setDetailsModel(getLocalizedModel(subaccount.clientModel.model, language))}>
                    {t('clientModels.backToCompare')}
                  </button>
                  <button className="qlc-btn primary" style={{ flex: 1 }} disabled={selecting} onClick={confirmModel}>
                    {selecting ? t('common.saving') : t('clientModels.confirmSelection')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {models.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--qlc-line)', paddingBottom: 8 }}>
                    <span>{m.name}</span>
                    <button className="qlc-btn ghost" onClick={() => setDetailsModel(m)}>
                      {t('clientModels.details')}
                    </button>
                  </div>
                ))}
              </div>
              <h4 style={{ marginBottom: 10 }}>{t('clientModels.comparisonTitle')}</h4>
              <ModelComparisonTable />
              <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 10 }}>{t('clientModels.disclaimer')}</p>
            </>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientApiConnection.statusTitle')}</h3>
          {/* CORRECCIÓN 14 (bloque de 20) — siempre debe verse un estado
              claro, sea el valor fijo en USDT o el aviso de que todavía no
              se ha configurado (nunca lo puede editar el cliente). */}
          <p style={{ fontSize: 14 }}>
            <strong>{t('clientApiConnection.requiredCapital')}:</strong>{' '}
            {subaccount.requiredCapital != null ? (
              `${subaccount.requiredCapital} USDT`
            ) : (
              <span style={{ color: 'var(--qlc-muted2)' }}>{t('clientApiConnection.requiredCapitalPending')}</span>
            )}
          </p>
          {subaccount.clientReportedCapitalReady && (
            <p style={{ fontSize: 12, color: 'var(--qlc-ok)' }}>✓ {t('clientApiConnection.capitalReported')}</p>
          )}

          {/* CORRECCIÓN (monto no editable por el cliente) — el monto ya no
              lo escribe el cliente: siempre es el capital operativo
              requerido que fijó el admin (requiredCapital). Mientras el
              admin no lo configure, el reporte queda deshabilitado (antes
              se permitía reportar cualquier monto aunque no hubiera
              requiredCapital todavía — eso quedó revertido a propósito). */}
          <form
            onSubmit={submitDistributionReport}
            style={{ marginTop: 12, marginBottom: 16, borderTop: '1px solid var(--qlc-line)', paddingTop: 12 }}
          >
            <h4 style={{ margin: '0 0 4px' }}>{t('clientApiConnection.reportDistributionTitle')}</h4>
            <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 0, marginBottom: 10 }}>
              {t('clientApiConnection.requiredCapital')}:{' '}
              {subaccount.requiredCapital != null ? `${subaccount.requiredCapital} USDT` : t('clientApiConnection.requiredCapitalPending')}
            </p>
            <label className="qlc-label">{t('clientPayments.amount')}</label>
            <input
              className="qlc-input"
              value={subaccount.requiredCapital != null ? `${subaccount.requiredCapital} USDT` : t('clientApiConnection.requiredCapitalPending')}
              disabled
              readOnly
              title={t('clientApiConnection.amountFixedByAdmin')}
            />
            <label className="qlc-label">{t('clientApiConnection.distributionNote')}</label>
            <input
              className="qlc-input"
              value={distributionForm.note}
              onChange={(e) => setDistributionForm((f) => ({ ...f, note: e.target.value }))}
            />
            <button
              className="qlc-btn primary"
              style={{ marginTop: 10, width: '100%' }}
              disabled={reportingDistribution || subaccount.requiredCapital == null}
              title={subaccount.requiredCapital == null ? t('clientApiConnection.requiredCapitalPending') : undefined}
            >
              {reportingDistribution ? t('common.sending') : t('clientApiConnection.reportCapitalReady')}
            </button>

            {distributionReports.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--qlc-muted)', marginBottom: 6 }}>
                  {t('clientApiConnection.distributionHistory')}
                </div>
                <ul className="qlc-plain-list">
                  {distributionReports.map((r) => {
                    const st = statusOf(paymentStatusMap, r.status);
                    return (
                      <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>
                          {r.amount} USDT — {new Date(r.reportedAt).toLocaleDateString()}
                        </span>
                        <span className={`qlc-badge ${st.className}`}>{st.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </form>
          <form onSubmit={saveApi}>
            <label className="qlc-label">{t('clientApiConnection.exchange')}</label>
            <input className="qlc-input" value={apiForm.exchangeName} onChange={(e) => setApiForm((f) => ({ ...f, exchangeName: e.target.value }))} placeholder={subaccount.exchangeName || 'Bitget'} />
            <label className="qlc-label">API Key {subaccount.hasApiKey ? t('clientApiConnection.alreadyRegistered') : ''}</label>
            <input className="qlc-input" value={apiForm.apiKey} onChange={(e) => setApiForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder={t('clientApiConnection.leaveBlank')} />
            <label className="qlc-label">Secret Key {subaccount.hasApiSecret ? t('clientApiConnection.alreadyRegistered') : ''}</label>
            <input className="qlc-input" value={apiForm.apiSecret} onChange={(e) => setApiForm((f) => ({ ...f, apiSecret: e.target.value }))} placeholder={t('clientApiConnection.leaveBlank')} />
            <label className="qlc-label">Passphrase {subaccount.hasApiPassphrase ? t('clientApiConnection.alreadyRegistered') : ''}</label>
            <input className="qlc-input" value={apiForm.apiPassphrase} onChange={(e) => setApiForm((f) => ({ ...f, apiPassphrase: e.target.value }))} placeholder={t('clientApiConnection.leaveBlank')} />

            {/* CORRECCIÓN 18 (bloque de 20) — "IP requerida" la define
                exclusivamente el admin; el cliente solo ve el estado y, si
                aplica, declara su propia IP. */}
            <label className="qlc-label">{t('clientApiConnection.ipRequired')}</label>
            <p style={{ fontSize: 13, marginTop: 0 }}>
              <span className={`qlc-badge ${subaccount.ipRequired ? 'warn' : 'muted'}`}>
                {subaccount.ipRequired ? t('common.yes') : t('common.no')}
              </span>
            </p>
            {subaccount.ipRequired && (
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

            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={savingApi}>
              {savingApi ? t('common.saving') : t('clientApiConnection.save')}
            </button>
          </form>

          {subaccount.connectionEvents?.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--qlc-line)', paddingTop: 12 }}>
              <h4 style={{ margin: '0 0 8px' }}>{t('clientApiConnection.connectionHistory')}</h4>
              <ul className="qlc-plain-list">
                {subaccount.connectionEvents.map((ev) => (
                  <li key={ev.id} style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
                    <span className={`qlc-badge ${ev.eventType === 'DISCONNECTED' ? 'danger' : 'ok'}`}>
                      {t(`clientApiConnection.connectionEvent${ev.eventType}`)}
                    </span>{' '}
                    {formatCdmxDate(ev.occurredAt)}
                    {ev.reason && ` — ${ev.reason}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={`qlc-card${statementStatus === 'PENDIENTE_DE_PAGO' ? ' qlc-card-attention' : ''}`}>
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
            {latestStatement?.hasPdf && (
              <a className="qlc-btn ghost" href={`${API_BASE_URL}/client/statements/${latestStatement.id}/download`} target="_blank" rel="noreferrer">
                {t('statementStatus.viewPdf')}
              </a>
            )}
            {hasUnpaidStatement && (
              <a className="qlc-btn primary" href="#garantia">
                {t('statementStatus.goPay')}
              </a>
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
                      {s.hasPdf && (
                        <>
                          {' · '}
                          <a href={`${API_BASE_URL}/client/statements/${s.id}/download`} target="_blank" rel="noreferrer">
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
        </div>

        <BitgetTransferSection
          subaccountId={id}
          config={paymentConfig}
          reports={payments}
          hasUnpaidStatement={hasUnpaidStatement}
          guaranteeConfirmed={guaranteeConfirmed}
          onReported={load}
        />
      </div>

      {detailsModel && (
        <ModelDetailsModal
          model={detailsModel}
          onClose={() => setDetailsModel(null)}
          selecting={selecting}
          onSelect={() => selectModel(detailsModel.id)}
          t={t}
        />
      )}
    </div>
  );
}

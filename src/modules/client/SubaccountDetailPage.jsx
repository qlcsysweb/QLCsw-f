import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import Modal from '../../components/Modal';
import { API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatDateOnly } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { clientSubaccountLabel } from '../../utils/subaccountLabel';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import ParticipationModelSummary, { ParticipationModelDetails } from '../../components/ParticipationModelSummary';
import StatementStatus, { StatementBadge } from '../../components/StatementStatus';
import StatementDetails from './StatementDetails';
import BitgetTransferSection from './BitgetTransferSection';
import CapitalConfirmation, { DEFAULT_REQUIRED_CAPITAL } from './CapitalConfirmation';
import usePolling from '../../hooks/usePolling';

// Detalle (solo lectura) del modelo único de participación — ya no hay
// nada que elegir ni confirmar.
function ModelDetailsModal({ model, onClose, t }) {
  return (
    <Modal title={t('participationModel.title')} onClose={onClose} width={820} closeOnOverlayClick closeOnEscape>
      <ParticipationModelSummary model={model} showTitle={false} />
      {model.description && (
        <p style={{ color: 'var(--qlc-muted)', fontSize: 14, lineHeight: 1.6, margin: '14px 0' }}>{model.description}</p>
      )}
      <ParticipationModelDetails model={model} />
      <div className="qlc-form-actions">
        <button className="qlc-btn primary" onClick={onClose}>
          {t('clientSupport.close')}
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
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [apiForm, setApiForm] = useState({ exchangeName: '', apiKey: '', apiSecret: '', apiPassphrase: '', ipAddress: '' });
  // Evita que el sondeo en segundo plano (usePolling más abajo) pise la IP
  // mientras el cliente la está escribiendo: solo se refresca desde el
  // servidor si el campo no tiene cambios propios sin guardar.
  const [ipDirty, setIpDirty] = useState(false);
  const [savingApi, setSavingApi] = useState(false);
  const [payments, setPayments] = useState([]);
  const [statements, setStatements] = useState([]);
  const [currentStatement, setCurrentStatement] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const location = useLocation();
  const scrolledToHash = useRef(false);
  // CORREGIR.xlsx CLIENTE 13 — reporte real de distribución de capital.
  const [distributionReports, setDistributionReports] = useState([]);

  const apiStatusMap = API_CONNECTION_STATUS(t);

  const load = () => {
    api
      .get(`/client/api-subaccounts/${id}`)
      .then(({ data }) => {
        setSubaccount(data.subaccount);
        setApiForm((f) => (ipDirty ? f : { ...f, ipAddress: data.subaccount.ipAddress || '' }));
        setUnavailable(null);
        // Los datos dependientes de la subcuenta solo se piden si la
        // subcuenta principal existe y sigue activa — evita repetir el
        // patrón de 404 en cascada reportado (todos estos endpoints
        // dependen del mismo :id, así que fallan igual si la subcuenta ya
        // no está disponible).
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
  // Modelo único de participación (asignado automáticamente por el backend).
  const participationModel = subaccount.clientModel?.model ? getLocalizedModel(subaccount.clientModel.model, language) : null;
  // Garantía confirmada = algún reporte de garantía (sin estado de cuenta
  // ligado) ya CONFIRMADO. `payments` viene ordenado desc. desde backend.
  const guaranteeConfirmed = payments.some((p) => !p.statementId && p.status === 'APROBADO');
  const statementStatus = currentStatement?.status || 'NO_GENERADO';
  const hasUnpaidStatement = statementStatus === 'PENDIENTE_DE_PAGO' || statementStatus === 'VENCIDO_SIN_PAGAR';
  const latestStatement = statements[0] || null;

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
      setIpDirty(false);
      flash(t('clientApiConnection.savedOk'));
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSavingApi(false);
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
          <h1 style={{ margin: 0 }}>{clientSubaccountLabel(subaccount, t)}</h1>
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

      {/* En pantallas anchas: Modelo y Estado de cuenta juntos a la izquierda,
          "Estado de conexión" (la tarjeta más alta) a la derecha, y la
          Transferencia Bitget debajo a todo el ancho. En móvil, una columna
          en el orden del código. */}
      <div className="qlc-subaccount-layout">
        {/* MODELO ÚNICO DE PARTICIPACIÓN — sin selector: se muestra directo. */}
        <div className="qlc-card qlc-area-model">
          <ParticipationModelSummary model={participationModel} />
          {participationModel && (
            <button className="qlc-btn ghost" style={{ marginTop: 12 }} onClick={() => setShowModelDetails(true)}>
              {t('clientModels.details')}
            </button>
          )}
        </div>

        <div className="qlc-card qlc-area-connection">
          <h3 style={{ marginTop: 0 }}>{t('clientApiConnection.statusTitle')}</h3>
          {/* Capital operativo requerido: lo fija el ADMIN (solo lectura
              para el cliente). El cliente confirma con una frase escrita que
              lo tiene disponible — ver CapitalConfirmation. */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px' }}>{t('clientApiConnection.reportDistributionTitle')}</h4>
            <CapitalConfirmation
              subaccountId={id}
              requiredCapital={subaccount.requiredCapital ?? DEFAULT_REQUIRED_CAPITAL}
              reports={distributionReports}
              onReported={() => {
                flash(t('clientApiConnection.capitalReportedOk'));
                load();
              }}
            />
          </div>
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
                    onChange={(e) => {
                      setIpDirty(true);
                      setApiForm((f) => ({ ...f, ipAddress: e.target.value }));
                    }}
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

        <div className={`qlc-card qlc-area-statement${statementStatus === 'PENDIENTE_DE_PAGO' ? ' qlc-card-attention' : ''}`}>
          <div className="qlc-statement-card-head">
            <h3>{t('statementStatus.title')}</h3>
            <StatementStatus status={statementStatus} expiresAt={currentStatement?.expiresAt} onExpire={load} />
          </div>
          {latestStatement && <StatementDetails statement={latestStatement} />}
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
                  <li key={s.id} className="qlc-statement-history-item">
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
                    <details className="qlc-statement-more">
                      <summary>{t('statementStatus.viewDetails')}</summary>
                      <StatementDetails statement={s} />
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="qlc-area-transfer">
          <BitgetTransferSection
            subaccountId={id}
            config={paymentConfig}
            reports={payments}
            hasUnpaidStatement={hasUnpaidStatement}
            unpaidStatementId={hasUnpaidStatement ? latestStatement?.id : null}
            guaranteeConfirmed={guaranteeConfirmed}
            onReported={load}
          />
        </div>
      </div>

      {showModelDetails && participationModel && (
        <ModelDetailsModal model={participationModel} onClose={() => setShowModelDetails(false)} t={t} />
      )}
    </div>
  );
}

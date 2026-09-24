import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';
import StatementStatus from '../../components/StatementStatus';

const STATEMENT_HINT_KEYS = {
  NO_GENERADO: 'notGeneratedHint',
  PENDIENTE_DE_PAGO: 'pendingHint',
  PAGADO: 'paidHint',
  VENCIDO_SIN_PAGAR: 'overdueHint',
};

const APPOINTMENT_STATUS_KEYS = {
  PENDING: { text: 'pending', className: 'warn', dot: '◌' },
  AUTORIZADA: { text: 'authorized', className: 'ok', dot: '✓' },
  RECHAZADA: { text: 'rejected', className: 'danger', dot: '×' },
  COMPLETADA: { text: 'completed', className: 'ok', dot: '✓' },
  CANCELADA: { text: 'cancelled', className: 'danger', dot: '×' },
};

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [processSteps, setProcessSteps] = useState([]);
  const [error, setError] = useState('');
  // Desfase entre el reloj del dispositivo y el del servidor — el contador
  // se dibuja con la hora del servidor (fuente de verdad), no la local.
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  const load = () => {
    api
      .get('/client/dashboard')
      .then(({ data }) => {
        setDashboard(data.dashboard);
        if (data.serverTime) setServerOffsetMs(new Date(data.serverTime).getTime() - Date.now());
      })
      .catch((err) => setError(translateBackendMessage(err.message, language)));
    // CORREGIR.xlsx CLIENTE 07 — "Tu proceso paso a paso" ahora es
    // administrable desde el panel (CMS), el cliente solo lo consulta.
    api
      .get('/client/process-steps')
      .then(({ data }) => setProcessSteps(data.steps))
      .catch(() => {});
  };
  useEffect(load, []);
  // Actualización sin refresh manual: cambios que haga el admin (estado de
  // cuenta, subcuentas, citas, notificaciones) aparecen solos.
  usePolling(load, 8000);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!dashboard) return <div className="qlc-empty">{t('common.loading')}</div>;

  const statement = dashboard.statement || { status: 'NO_GENERADO' };
  // Iluminación azul QLC solo mientras hay un estado de cuenta PENDIENTE DE PAGO.
  const statementNeedsAttention = statement.status === 'PENDIENTE_DE_PAGO';
  const statementNeedsPayment = statement.status === 'PENDIENTE_DE_PAGO' || statement.status === 'VENCIDO_SIN_PAGAR';
  const appointmentStatus = dashboard.nextAppointment
    ? APPOINTMENT_STATUS_KEYS[dashboard.nextAppointment.status] || APPOINTMENT_STATUS_KEYS.PENDING
    : null;

  const downloadGuide = async () => {
    try {
      const { data } = await api.get('/client/guide');
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientDashboard.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientDashboard.welcome').replace('{name}', dashboard.firstName)}</h1>

      <div
        className="qlc-card"
        style={{
          borderColor: 'var(--qlc-warn-border)',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span className="qlc-badge warn" style={{ fontSize: 14, padding: '8px 12px', maxWidth: '100%', whiteSpace: 'normal' }}>
          ⚠ {t('clientDashboard.bitgetOnlyBadge')}
        </span>
        <span style={{ fontSize: 13, color: 'var(--qlc-muted)', flex: '1 1 240px', minWidth: 0 }}>{t('clientDashboard.bitgetOnlyNotice')}</span>
      </div>

      <div className="qlc-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>{t('clientDashboard.flowTitle')}</h3>
        {/* Rejilla equilibrada: 4 columnas en escritorio (8 pasos = 2 filas
            completas), 2 en tablet y 1 en móvil — sin huecos. La numeración
            es la posición real (1..N), nunca un número guardado con saltos. */}
        <ol className="qlc-process-steps">
          {processSteps.map((step, idx) => {
            const title = language === 'en' && step.titleEn ? step.titleEn : step.titleEs;
            return (
              <li key={step.id} className="qlc-process-step">
                <span className="qlc-process-step-num">{idx + 1}</span>
                <span className="qlc-process-step-title">{title}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="qlc-client-stats">
        <div className={`qlc-card qlc-stat-card qlc-client-statement${statementNeedsAttention ? ' qlc-card-attention' : ''}`}>
          <span className="qlc-stat-label">{t('clientDashboard.accountStatus')}</span>
          <StatementStatus status={statement.status} expiresAt={statement.expiresAt} onExpire={load} serverOffsetMs={serverOffsetMs} large />
          <span className="qlc-stat-hint">
            {t(`statementStatus.${STATEMENT_HINT_KEYS[statement.status] || 'notGeneratedHint'}`)}
            {statement.identifier && statementNeedsPayment ? ` · ${statement.identifier}` : ''}
          </span>
          {statement.pendingCount > 1 && (
            <span className="qlc-stat-hint">{t('statementStatus.pendingCount').replace('{count}', statement.pendingCount)}</span>
          )}
          {statementNeedsPayment && statement.apiSubaccountId && (
            <Link className="qlc-btn primary qlc-client-statement-cta" to={`/client/api-subaccounts/${statement.apiSubaccountId}#garantia`}>
              {t('statementStatus.goPay')}
            </Link>
          )}
        </div>
        <Link className="qlc-card qlc-stat-card" to="/client/api-subaccounts">
          <span className="qlc-stat-label">{t('clientDashboard.subaccounts')}</span>
          <strong className="qlc-stat-value">{dashboard.subaccounts.filter((s) => !s.isPrincipal).length}</strong>
        </Link>
        <Link className="qlc-card qlc-stat-card" to="/client/notifications">
          <span className="qlc-stat-label">{t('clientDashboard.unreadNotifications')}</span>
          <strong className="qlc-stat-value">{dashboard.unreadNotifications}</strong>
        </Link>
      </div>

      {dashboard.nextAppointment && (
        <div className="qlc-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('clientDashboard.nextAppointment')}</h3>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            {formatCdmxDate(dashboard.nextAppointment.requestedDate)} ·{' '}
            {dashboard.nextAppointment.requestedTime} —{' '}
            <span className={`qlc-badge ${appointmentStatus.className}`}>
              {appointmentStatus.dot} {t(`status.appointment.${appointmentStatus.text}`)}
            </span>
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Link className="qlc-btn primary" to="/client/api-subaccounts">
          {t('clientDashboard.viewSubaccounts')}
        </Link>
        <Link className="qlc-btn ghost" to="/client/support">
          {t('clientDashboard.support')}
        </Link>
        <Link className="qlc-btn ghost" to="/client/guides">
          {t('clientDashboard.readGuide')}
        </Link>
        <button className="qlc-btn ghost" onClick={downloadGuide}>
          {t('clientDashboard.downloadGuide')}
        </button>
      </div>
    </div>
  );
}

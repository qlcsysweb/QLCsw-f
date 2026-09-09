import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import { translateBackendMessage } from '../../i18n/backendMessages';

function StatCard({ label, status, to }) {
  const content = (
    <>
      <span className="qlc-stat-label">{label}</span>
      <span className={`qlc-badge ${status.className}`} style={{ fontSize: 14, padding: '8px 12px' }}>
        {status.text}
      </span>
    </>
  );
  if (to) {
    return (
      <Link className="qlc-card qlc-stat-card" to={to} style={{ display: 'flex', flexDirection: 'column' }}>
        {content}
      </Link>
    );
  }
  return <div className="qlc-card qlc-stat-card">{content}</div>;
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  const CONDITION_LABELS = {
    CONTRACT: t('status.conditionType.CONTRACT'),
    FUNDS: t('status.conditionType.FUNDS'),
    PAYMENT: t('status.conditionType.PAYMENT'),
    API: t('status.conditionType.API'),
    ACTIVATION: t('status.conditionType.ACTIVATION'),
  };
  const CONDITION_STATUS = {
    CONFIRMED: { text: `✓ ${t('status.condition.completed')}`, className: 'ok' },
    REJECTED: { text: `× ${t('status.condition.rejected')}`, className: 'danger' },
    PENDING: { text: `◌ ${t('status.condition.pending')}`, className: 'warn' },
  };
  const ACCOUNT_STATUS = {
    ACTIVE: { text: `● ${t('status.account.active')}`, className: 'ok' },
    PENDING: { text: `◌ ${t('status.account.pending')}`, className: 'warn' },
    REVIEW: { text: `! ${t('status.account.review')}`, className: 'warn' },
    INACTIVE: { text: `× ${t('status.account.inactive')}`, className: 'danger' },
  };
  const CONTRACT_STATUS = {
    PENDING: { text: `◌ ${t('status.contract.pending')}`, className: 'warn' },
    UPLOADED: { text: `! ${t('status.contract.uploaded')}`, className: 'warn' },
    RECEIVED_SIGNED: { text: `✓ ${t('status.contract.receivedSigned')}`, className: 'ok' },
    REJECTED: { text: `× ${t('status.contract.rejected')}`, className: 'danger' },
  };
  const API_STATUS = {
    CONECTADA: { text: `● ${t('status.apiConnection.connected')}`, className: 'ok' },
    DESCONECTADA: { text: `× ${t('status.apiConnection.disconnected')}`, className: 'danger' },
    PENDIENTE: { text: `◌ ${t('status.apiConnection.pending')}`, className: 'warn' },
  };
  const APPOINTMENT_STATUS = {
    PENDING: { text: `◌ ${t('status.appointment.pending')}`, className: 'warn' },
    AUTORIZADA: { text: `✓ ${t('status.appointment.authorized')}`, className: 'ok' },
    RECHAZADA: { text: `× ${t('status.appointment.rejected')}`, className: 'danger' },
    COMPLETADA: { text: `✓ ${t('status.appointment.completed')}`, className: 'ok' },
    CANCELADA: { text: `× ${t('status.appointment.cancelled')}`, className: 'danger' },
  };

  useEffect(() => {
    api
      .get('/client/dashboard')
      .then(({ data }) => setDashboard(data.dashboard))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  }, []);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!dashboard) return <div className="qlc-empty">{t('common.loading')}</div>;

  const accountStatus = ACCOUNT_STATUS[dashboard.status] || ACCOUNT_STATUS.PENDING;
  const contractStatus = CONTRACT_STATUS[dashboard.contractStatus] || CONTRACT_STATUS.PENDING;
  const apiStatus = API_STATUS[dashboard.apiConnectionStatus] || API_STATUS.PENDIENTE;
  const appointmentStatus = dashboard.nextAppointment
    ? APPOINTMENT_STATUS[dashboard.nextAppointment.status] || APPOINTMENT_STATUS.PENDING
    : null;

  return (
    <div>
      <div className="qlc-kicker">{t('clientDashboard.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientDashboard.welcome').replace('{name}', dashboard.firstName)}</h1>

      <div className="qlc-stat-grid">
        <StatCard label={t('clientDashboard.accountStatus')} status={accountStatus} />
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('clientDashboard.model')}</span>
          <strong className="qlc-stat-value" style={{ fontSize: 20 }}>
            {dashboard.model ? getLocalizedModel(dashboard.model, language).name : t('clientDashboard.unassigned')}
          </strong>
        </div>
        <StatCard label={t('clientDashboard.contract')} status={contractStatus} />
        <StatCard label={t('clientDashboard.apiConnection')} status={apiStatus} to="/client/api-connection" />
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('clientDashboard.unreadNotifications')}</span>
          <strong className="qlc-stat-value">{dashboard.unreadNotifications}</strong>
        </div>
      </div>

      <div className="qlc-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>{t('clientDashboard.activationProcess')}</h3>
        {dashboard.process?.conditions?.map((c) => {
          const s = CONDITION_STATUS[c.status] || CONDITION_STATUS.PENDING;
          return (
            <div key={c.id} className="qlc-condition-row" style={{ gridTemplateColumns: '1fr auto' }}>
              <span>{CONDITION_LABELS[c.type] || c.type}</span>
              <span className={`qlc-badge ${s.className}`}>{s.text}</span>
            </div>
          );
        })}
        {dashboard.process?.isActivated && (
          <div style={{ marginTop: 12, color: 'var(--qlc-ok)', fontSize: 13 }}>
            {t('clientDashboard.accountFullyActivated')}
          </div>
        )}
      </div>

      {dashboard.nextAppointment && (
        <div className="qlc-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('clientDashboard.nextAppointment')}</h3>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            {new Date(dashboard.nextAppointment.requestedDate).toLocaleDateString()} ·{' '}
            {dashboard.nextAppointment.requestedTime} —{' '}
            <span className={`qlc-badge ${appointmentStatus.className}`}>{appointmentStatus.text}</span>
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Link className="qlc-btn primary" to="/client/contract">
          {t('clientDashboard.viewContract')}
        </Link>
        <Link className="qlc-btn ghost" to="/client/payments">
          {t('clientDashboard.reportPayment')}
        </Link>
        <Link className="qlc-btn ghost" to="/client/support">
          {t('clientDashboard.support')}
        </Link>
      </div>
    </div>
  );
}

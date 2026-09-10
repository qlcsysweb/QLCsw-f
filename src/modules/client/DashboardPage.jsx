import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import { translateBackendMessage } from '../../i18n/backendMessages';

const ACCOUNT_STATUS_KEYS = {
  ACTIVE: { text: 'active', className: 'ok', dot: '●' },
  PENDING: { text: 'pending', className: 'warn', dot: '◌' },
  REVIEW: { text: 'review', className: 'warn', dot: '!' },
  INACTIVE: { text: 'inactive', className: 'danger', dot: '×' },
};

const CONTRACT_STATUS_KEYS = {
  PENDING: { text: 'pending', className: 'warn', dot: '◌' },
  UPLOADED: { text: 'uploaded', className: 'warn', dot: '!' },
  RECEIVED_SIGNED: { text: 'receivedSigned', className: 'ok', dot: '✓' },
  REJECTED: { text: 'rejected', className: 'danger', dot: '×' },
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
  const [error, setError] = useState('');

  const apiStatusMap = API_CONNECTION_STATUS(t);

  useEffect(() => {
    api
      .get('/client/dashboard')
      .then(({ data }) => setDashboard(data.dashboard))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  }, []);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!dashboard) return <div className="qlc-empty">{t('common.loading')}</div>;

  const accountStatus = ACCOUNT_STATUS_KEYS[dashboard.status] || ACCOUNT_STATUS_KEYS.PENDING;
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

      <div className="qlc-stat-grid">
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('clientDashboard.accountStatus')}</span>
          <span className={`qlc-badge ${accountStatus.className}`} style={{ fontSize: 14, padding: '8px 12px' }}>
            {accountStatus.dot} {t(`status.account.${accountStatus.text}`)}
          </span>
        </div>
        <Link className="qlc-card qlc-stat-card" to="/client/api-subaccounts" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="qlc-stat-label">{t('clientDashboard.subaccounts')}</span>
          <strong className="qlc-stat-value">{dashboard.subaccounts.length}</strong>
        </Link>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('clientDashboard.unreadNotifications')}</span>
          <strong className="qlc-stat-value">{dashboard.unreadNotifications}</strong>
        </div>
      </div>

      <div className="qlc-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>{t('clientDashboard.subaccounts')}</h3>
        {dashboard.subaccounts.length === 0 ? (
          <div className="qlc-empty">{t('clientSubaccounts.none')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {dashboard.subaccounts.map((s) => {
              const apiStatus = statusOf(apiStatusMap, s.apiStatus, 'PENDIENTE');
              const contractStatus = CONTRACT_STATUS_KEYS[s.contractStatus] || CONTRACT_STATUS_KEYS.PENDING;
              return (
                <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{s.identifier || t('clientSubaccounts.unassignedIdentifier')}</strong>{' '}
                    <span style={{ color: 'var(--qlc-muted2)' }}>
                      {s.model ? getLocalizedModel(s.model, language).name : t('clientSubaccounts.noModel')}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <span className={`qlc-badge ${apiStatus.className}`}>{apiStatus.text}</span>
                    <span className={`qlc-badge ${contractStatus.className}`}>
                      {contractStatus.dot} {t(`status.contract.${contractStatus.text}`)}
                    </span>
                    <Link className="qlc-btn ghost" to={`/client/api-subaccounts/${s.id}`}>
                      {t('adminClientsList.view')}
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
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
        <button className="qlc-btn ghost" onClick={downloadGuide}>
          {t('clientDashboard.downloadGuide')}
        </button>
      </div>
    </div>
  );
}

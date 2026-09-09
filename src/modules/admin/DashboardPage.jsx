import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

function StatCard({ label, value, hint }) {
  return (
    <div className="qlc-card qlc-stat-card">
      <span className="qlc-stat-label">{label}</span>
      <strong className="qlc-stat-value">{value}</strong>
      {hint && <span className="qlc-stat-hint">{hint}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setSummary(data.summary))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  }, []);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!summary) return <div className="qlc-empty">{t('adminDashboard.loadingIndicators')}</div>;

  return (
    <div>
      <div className="qlc-kicker">{t('adminDashboard.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminDashboard.title')}</h1>

      <div className="qlc-stat-grid">
        <StatCard label={t('adminDashboard.totalClients')} value={summary.clients.total} />
        <StatCard label={t('adminDashboard.activeClients')} value={summary.clients.active} />
        <StatCard label={t('adminDashboard.pendingClients')} value={summary.clients.pending} />
        <StatCard label={t('adminDashboard.underReview')} value={summary.clients.review} />
        <StatCard label={t('adminDashboard.newProspects')} value={summary.prospects.new} />
        <StatCard
          label={t('adminDashboard.unregisteredProspects')}
          value={summary.prospects.unregistered}
          hint={t('adminDashboard.unregisteredProspectsHint')}
        />
        <StatCard label={t('adminDashboard.pendingAppointments')} value={summary.appointments.pending} />
        <StatCard label={t('adminDashboard.pendingPayments')} value={summary.payments.pending} />
        <StatCard label={t('adminDashboard.pendingContracts')} value={summary.contracts.pending} />
        <StatCard label={t('adminDashboard.apiConnected')} value={summary.apiConnections.connected} hint="Bitget" />
        <StatCard label={t('adminDashboard.apiDisconnected')} value={summary.apiConnections.disconnected} />
        <StatCard label={t('adminDashboard.apiPending')} value={summary.apiConnections.pending} />
      </div>

      <div className="qlc-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>{t('adminDashboard.recentDocuments')}</h3>
        {summary.recentDocuments.length === 0 ? (
          <div className="qlc-empty">{t('adminDashboard.noRecentDocuments')}</div>
        ) : (
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('adminDashboard.client')}</th>
                  <th>{t('adminDashboard.category')}</th>
                  <th>{t('adminDashboard.file')}</th>
                  <th>{t('adminDashboard.date')}</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      {doc.client?.firstName} {doc.client?.lastName}
                    </td>
                    <td>{doc.category}</td>
                    <td>{doc.fileName}</td>
                    <td>{new Date(doc.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

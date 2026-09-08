import { useEffect, useState } from 'react';
import api from '../../services/api';

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
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setSummary(data.summary))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!summary) return <div className="qlc-empty">Cargando indicadores…</div>;

  return (
    <div>
      <div className="qlc-kicker">PANEL ADMINISTRATIVO</div>
      <h1 style={{ marginTop: 0 }}>Resumen general</h1>

      <div className="qlc-stat-grid">
        <StatCard label="Clientes totales" value={summary.clients.total} />
        <StatCard label="Clientes activos" value={summary.clients.active} />
        <StatCard label="Clientes pendientes" value={summary.clients.pending} />
        <StatCard label="En revisión" value={summary.clients.review} />
        <StatCard label="Prospectos nuevos" value={summary.prospects.new} />
        <StatCard
          label="Prospectos sin registro"
          value={summary.prospects.unregistered}
          hint="Solicitaron información pero no tienen cuenta"
        />
        <StatCard label="Citas pendientes" value={summary.appointments.pending} />
        <StatCard label="Pagos por revisar" value={summary.payments.pending} />
        <StatCard label="Contratos pendientes" value={summary.contracts.pending} />
        <StatCard label="API conectadas" value={summary.apiConnections.connected} hint="Bitget" />
        <StatCard label="API desconectadas" value={summary.apiConnections.disconnected} />
        <StatCard label="API pendientes" value={summary.apiConnections.pending} />
      </div>

      <div className="qlc-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Documentos recientes</h3>
        {summary.recentDocuments.length === 0 ? (
          <div className="qlc-empty">Sin documentos recientes.</div>
        ) : (
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Categoría</th>
                  <th>Archivo</th>
                  <th>Fecha</th>
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

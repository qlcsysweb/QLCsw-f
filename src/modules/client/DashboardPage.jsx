import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const CONDITION_LABELS = {
  CONTRACT: 'Contrato firmado',
  FUNDS: 'Fondos disponibles',
  PAYMENT: 'Pago reportado',
  API: 'Conexión API',
  ACTIVATION: 'Activación',
};

const CONDITION_STATUS = {
  CONFIRMED: { text: '✓ Completado', className: 'ok' },
  REJECTED: { text: '× Rechazado', className: 'danger' },
  PENDING: { text: '◌ Pendiente', className: 'warn' },
};

const ACCOUNT_STATUS = {
  ACTIVE: { text: '● Activa', className: 'ok' },
  PENDING: { text: '◌ Pendiente', className: 'warn' },
  REVIEW: { text: '! En revisión', className: 'warn' },
  INACTIVE: { text: '× Inactiva', className: 'danger' },
};

const CONTRACT_STATUS = {
  PENDING: { text: '◌ Pendiente', className: 'warn' },
  UPLOADED: { text: '! Requiere tu firma', className: 'warn' },
  RECEIVED_SIGNED: { text: '✓ Enviado', className: 'ok' },
  REJECTED: { text: '× Rechazado', className: 'danger' },
};

const API_STATUS = {
  CONECTADA: { text: '● Conectada', className: 'ok' },
  DESCONECTADA: { text: '× Desconectada', className: 'danger' },
  PENDIENTE: { text: '◌ Pendiente', className: 'warn' },
};

const APPOINTMENT_STATUS = {
  PENDING: { text: '◌ Pendiente de respuesta', className: 'warn' },
  AUTORIZADA: { text: '✓ Autorizada', className: 'ok' },
  RECHAZADA: { text: '× Rechazada', className: 'danger' },
  COMPLETADA: { text: '✓ Completada', className: 'ok' },
  CANCELADA: { text: '× Cancelada', className: 'danger' },
};

function StatCard({ label, status }) {
  return (
    <div className="qlc-card qlc-stat-card">
      <span className="qlc-stat-label">{label}</span>
      <span className={`qlc-badge ${status.className}`} style={{ fontSize: 14, padding: '8px 12px' }}>
        {status.text}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/client/dashboard')
      .then(({ data }) => setDashboard(data.dashboard))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!dashboard) return <div className="qlc-empty">Cargando…</div>;

  const accountStatus = ACCOUNT_STATUS[dashboard.status] || ACCOUNT_STATUS.PENDING;
  const contractStatus = CONTRACT_STATUS[dashboard.contractStatus] || CONTRACT_STATUS.PENDING;
  const apiStatus = API_STATUS[dashboard.apiConnectionStatus] || API_STATUS.PENDIENTE;
  const appointmentStatus = dashboard.nextAppointment
    ? APPOINTMENT_STATUS[dashboard.nextAppointment.status] || APPOINTMENT_STATUS.PENDING
    : null;

  return (
    <div>
      <div className="qlc-kicker">PORTAL DEL CLIENTE</div>
      <h1 style={{ marginTop: 0 }}>Bienvenido, {dashboard.firstName}</h1>

      <div className="qlc-stat-grid">
        <StatCard label="Estado de cuenta" status={accountStatus} />
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">Modelo</span>
          <strong className="qlc-stat-value" style={{ fontSize: 20 }}>
            {dashboard.model?.name || 'Sin asignar'}
          </strong>
        </div>
        <StatCard label="Contrato" status={contractStatus} />
        <StatCard label="Conexión API" status={apiStatus} />
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">Notificaciones sin leer</span>
          <strong className="qlc-stat-value">{dashboard.unreadNotifications}</strong>
        </div>
      </div>

      <div className="qlc-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Proceso de activación</h3>
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
            ✓ Tu cuenta está completamente activada.
          </div>
        )}
      </div>

      {dashboard.nextAppointment && (
        <div className="qlc-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Próxima cita</h3>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            {new Date(dashboard.nextAppointment.requestedDate).toLocaleDateString()} ·{' '}
            {dashboard.nextAppointment.requestedTime} —{' '}
            <span className={`qlc-badge ${appointmentStatus.className}`}>{appointmentStatus.text}</span>
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Link className="qlc-btn primary" to="/client/contract">
          Ver contrato
        </Link>
        <Link className="qlc-btn ghost" to="/client/payments">
          Reportar pago
        </Link>
        <Link className="qlc-btn ghost" to="/client/support">
          Soporte
        </Link>
      </div>
    </div>
  );
}

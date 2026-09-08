import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/client', label: 'Dashboard', end: true },
  { to: '/client/profile', label: 'Perfil' },
  { to: '/client/models', label: 'Modelos' },
  { to: '/client/process', label: 'Proceso' },
  { to: '/client/contract', label: 'Contrato' },
  { to: '/client/documents', label: 'Documentos' },
  { to: '/client/payments', label: 'Pagos' },
  { to: '/client/support', label: 'Soporte' },
  { to: '/client/appointments', label: 'Citas' },
];

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/client/notifications').then(({ data }) => {
      setUnread(data.notifications.filter((n) => !n.isRead).length);
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="qlc-admin-shell">
      <aside className="qlc-admin-sidebar">
        <div className="qlc-admin-brand">
          <QlcLogo alt="QLC" />
          <span>QLC CLIENTE</span>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `qlc-admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/client/notifications"
            className={({ isActive }) => `qlc-admin-nav-link${isActive ? ' active' : ''}`}
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            Notificaciones
            {unread > 0 && <span className="qlc-badge warn">{unread}</span>}
          </NavLink>
        </nav>
        <div className="qlc-admin-user">
          <div className="qlc-admin-user-name">{user?.profile?.firstName}</div>
          <div className="qlc-admin-user-role">{user?.username}</div>
          <button className="qlc-btn ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="qlc-admin-content">
        <Outlet />
      </main>
    </div>
  );
}

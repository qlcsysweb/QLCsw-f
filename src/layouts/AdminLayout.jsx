import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QlcLogo from '../components/QlcLogo';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/clients', label: 'Clientes' },
  { to: '/admin/cms', label: 'Contenido del sitio' },
  { to: '/admin/payments', label: 'Pagos' },
  { to: '/admin/appointments', label: 'Citas' },
  { to: '/admin/support', label: 'Soporte' },
  { to: '/admin/prospects', label: 'Prospectos' },
  { to: '/admin/admins', label: 'Administradores' },
  { to: '/admin/settings/drive', label: 'Configuración · Google Drive' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="qlc-admin-shell">
      <aside className="qlc-admin-sidebar">
        <div className="qlc-admin-brand">
          <QlcLogo alt="QLC" />
          <span>QLC ADMIN</span>
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
        </nav>
        <div className="qlc-admin-user">
          <div className="qlc-admin-user-name">
            {user?.profile?.firstName} {user?.profile?.lastName}
          </div>
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

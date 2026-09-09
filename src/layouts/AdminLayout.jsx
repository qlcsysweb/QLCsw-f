import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcherCompact from '../i18n/LanguageSwitcherCompact';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { to: '/admin', label: t('adminNav.dashboard'), end: true },
    { to: '/admin/clients', label: t('adminNav.clients') },
    { to: '/admin/cms', label: t('adminNav.content') },
    { to: '/admin/payments', label: t('adminNav.payments') },
    { to: '/admin/appointments', label: t('adminNav.appointments') },
    { to: '/admin/support', label: t('adminNav.support') },
    { to: '/admin/prospects', label: t('adminNav.prospects') },
    { to: '/admin/admins', label: t('adminNav.admins') },
    { to: '/admin/settings/drive', label: t('adminNav.driveSettings') },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="qlc-admin-shell">
      <aside className="qlc-admin-sidebar">
        <div className="qlc-admin-brand">
          <QlcLogo alt="QLC" />
          <span>{t('adminNav.brand')}</span>
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
          <LanguageSwitcherCompact />
          <button className="qlc-btn ghost" onClick={handleLogout}>
            {t('common.logout')}
          </button>
        </div>
      </aside>
      <main className="qlc-admin-content">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcherCompact from '../i18n/LanguageSwitcherCompact';
import './AdminLayout.css';

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const NAV_ITEMS = [
    { to: '/client', label: t('clientNav.dashboard'), end: true },
    { to: '/client/profile', label: t('clientNav.profile') },
    { to: '/client/api-subaccounts', label: t('clientNav.subaccounts') },
    { to: '/client/documents', label: t('clientNav.documents') },
    { to: '/client/wallet', label: t('clientNav.wallet') },
    { to: '/client/support', label: t('clientNav.support') },
    { to: '/client/appointments', label: t('clientNav.appointments') },
  ];

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
          <span>{t('clientNav.brand')}</span>
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
            {t('clientNav.notifications')}
            {unread > 0 && <span className="qlc-badge warn">{unread}</span>}
          </NavLink>
        </nav>
        <div className="qlc-admin-user">
          <div className="qlc-admin-user-name">{user?.profile?.firstName}</div>
          <div className="qlc-admin-user-role">{user?.email}</div>
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

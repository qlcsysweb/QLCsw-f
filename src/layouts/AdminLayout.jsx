import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcherCompact from '../i18n/LanguageSwitcherCompact';
import usePolling from '../hooks/usePolling';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const loadUnread = () => {
    api.get('/admin/notifications').then(({ data }) => {
      setUnread(data.notifications.filter((n) => !n.isRead).length);
    });
  };
  useEffect(loadUnread, []);
  // Actualización sin refresh manual: si un cliente reporta un pago, pide
  // una subcuenta, etc., el badge se actualiza solo en cualquier página del
  // panel admin (vive en el layout, igual que en ClientLayout).
  usePolling(loadUnread, 8000);

  const NAV_ITEMS = [
    { to: '/admin', label: t('adminNav.dashboard'), end: true },
    { to: '/admin/clients', label: t('adminNav.clients') },
    { to: '/admin/cms', label: t('adminNav.content') },
    { to: '/admin/track-record', label: t('adminNav.trackRecord') },
    { to: '/admin/guides', label: t('adminNav.guides') },
    { to: '/admin/statements', label: t('adminNav.statements') },
    { to: '/admin/payments', label: t('adminNav.payments') },
    { to: '/admin/appointments', label: t('adminNav.appointments') },
    { to: '/admin/support', label: t('adminNav.support') },
    { to: '/admin/prospects', label: t('adminNav.prospects') },
    { to: '/admin/admins', label: t('adminNav.admins') },
    { to: '/admin/settings/drive', label: t('adminNav.driveSettings') },
    { to: '/admin/settings/email', label: t('adminNav.emailSettings') },
    { to: '/admin/settings/platform', label: t('adminNav.platformSettings') },
    { to: '/admin/settings/security', label: t('adminNav.securitySettings') },
    { to: '/admin/settings/process-steps', label: t('adminNav.processStepsSettings') },
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
          <NavLink
            to="/admin/notifications"
            className={({ isActive }) => `qlc-admin-nav-link${isActive ? ' active' : ''}`}
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            {t('clientNotifications.title')}
            {unread > 0 && <span className="qlc-badge warn">{unread}</span>}
          </NavLink>
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

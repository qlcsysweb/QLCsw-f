import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcherCompact from '../i18n/LanguageSwitcherCompact';
import usePolling from '../hooks/usePolling';
import './AdminLayout.css';

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // CORRECCIÓN 15 (bloque de 20) — Notificaciones va primero en el menú,
  // antes de cualquier otra opción funcional (se renderiza aparte, ver
  // abajo). CORRECCIÓN 16 — "Citas" ya no es un módulo independiente: se
  // solicita desde dentro de un caso de Soporte.
  const NAV_ITEMS = [
    { to: '/client', label: t('clientNav.dashboard'), end: true },
    { to: '/client/profile', label: t('clientNav.profile') },
    { to: '/client/api-subaccounts', label: t('clientNav.subaccounts') },
    { to: '/client/documents', label: t('clientNav.documents') },
    { to: '/client/guides', label: t('clientNav.guides') },
    { to: '/client/support', label: t('clientNav.support') },
  ];

  const loadUnread = () => {
    api.get('/client/notifications').then(({ data }) => {
      setUnread(data.notifications.filter((n) => !n.isRead).length);
    });
    // Sondeo de solo lectura — nunca marca nada como leído (eso solo pasa
    // al abrir de verdad la sección de Mensajes, ver MessagesPage.jsx).
    api.get('/client/messages').then(({ data }) => {
      setUnreadMessages(data.messages.filter((m) => !m.isRead && m.senderUserId !== user?.id).length);
    });
  };
  useEffect(loadUnread, []);
  // Actualización sin refresh manual: si el admin envía un mensaje o
  // aprueba/rechaza algo, el badge de "Notificaciones" (visible en TODAS
  // las páginas del cliente, porque vive en el layout) se actualiza solo.
  usePolling(loadUnread, 8000);

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
          <NavLink
            to="/client/notifications"
            className={({ isActive }) => `qlc-admin-nav-link${isActive ? ' active' : ''}`}
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            {t('clientNav.notifications')}
            {unread > 0 && <span className="qlc-badge warn">{unread}</span>}
          </NavLink>
          <NavLink
            to="/client/messages"
            className={({ isActive }) => `qlc-admin-nav-link${isActive ? ' active' : ''}`}
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            {t('clientNav.messages')}
            {unreadMessages > 0 && <span className="qlc-badge warn">{unreadMessages}</span>}
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

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, BITGET_MODAL_FLAG } from '../context/AuthContext';
import BitgetTransferModal from '../components/BitgetTransferModal';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import DualClock from '../components/DualClock';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcherCompact from '../i18n/LanguageSwitcherCompact';
import usePolling from '../hooks/usePolling';
import './AdminLayout.css';

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  // Modal "Transferencia interna Bitget": solo justo después de iniciar sesión.
  const [showBitgetModal, setShowBitgetModal] = useState(() => {
    try {
      return sessionStorage.getItem(BITGET_MODAL_FLAG) === '1';
    } catch {
      return false;
    }
  });
  const closeBitgetModal = () => {
    try {
      sessionStorage.removeItem(BITGET_MODAL_FLAG);
    } catch {
      // sin sessionStorage no hay nada que limpiar
    }
    setShowBitgetModal(false);
  };

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
    { to: '/client/affiliates', label: t('affiliate.nav') },
    { to: '/client/support', label: t('clientNav.support') },
  ];

  const loadUnread = () => {
    api.get('/client/notifications').then(({ data }) => {
      setUnread(data.notifications.filter((n) => !n.isRead).length);
    });
  };
  useEffect(loadUnread, []);
  // Actualización sin refresh manual: si el admin envía un mensaje o
  // aprueba/rechaza algo, el badge de "Notificaciones" (visible en TODAS
  // las páginas del cliente, porque vive en el layout) se actualiza solo.
  usePolling(loadUnread, 8000);

  // Al cerrar sesión se vuelve al inicio de la página pública (admin y
  // cliente). Se navega primero para que la ruta protegida no redirija al login.
  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  return (
    <div className="qlc-admin-shell">
      <aside className="qlc-admin-sidebar">
        <div className="qlc-admin-brand">
          <QlcLogo alt="QLC" />
          <span>{t('clientNav.brand')}</span>
        </div>
        {/* El cliente trabaja en UTC (citas, chat): solo se muestra esa hora. */}
        <DualClock zones={['UTC']} />
        <nav>
          <NavLink
            to="/client/notifications"
            className={({ isActive }) => `qlc-admin-nav-link${isActive ? ' active' : ''}`}
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            {t('clientNav.notifications')}
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
      {showBitgetModal && <BitgetTransferModal onClose={closeBitgetModal} />}
    </div>
  );
}

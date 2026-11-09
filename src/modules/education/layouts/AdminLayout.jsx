import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { WorkspaceProvider } from '../context/WorkspaceContext.jsx';
import { Brand, Disclaimer } from '../components/layout/Brand.jsx';
import { SessionClock } from '../components/layout/SessionClock.jsx';
import { ErrorState, Loading } from '../components/ui/States.jsx';
import { Card } from '../components/ui/Card.jsx';
import { tr } from '../i18n/tr.js';
import { SecurityNavButton } from '../features/security/AccountSecurity.jsx';
import { ADMIN_LEVELS } from '../utils/labels.js';
import { AppLayout } from './AppLayout.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher.jsx';

const NAV = [
  { group: 'general' },
  { to: '/admin', icon: '◎', label: 'dashboard', end: true },
  { to: '/admin/clientes', icon: '◫', label: 'clients' },
  { to: '/admin/solicitudes', icon: '✉', label: 'leads' },
  { to: '/admin/ejercicios', icon: '✎', label: 'exercises' },
  { to: '/admin/citas', icon: '◌', label: 'appointments' },
  { group: 'content' },
  { to: '/admin/archivos', icon: '▤', label: 'files' },
  { to: '/admin/aviso-copytrading', icon: '◬', label: 'loginNotice' },
  { group: 'commercial' },
  { to: '/admin/precios', icon: '◇', label: 'pricing' },
  { to: '/admin/pagos', icon: '⇄', label: 'payments' },
  { to: '/admin/pasarela', icon: '▣', label: 'gateway', full: true },
  { to: '/admin/suscriptores', icon: '◉', label: 'subscribers' },
  { to: '/admin/regalos', icon: '✦', label: 'gifts' },
  { group: 'generalAdmin', full: true },
  { to: '/admin/control-accesos', icon: '⚿', label: 'accessControl', full: true },
  { group: 'system' },
  { to: '/admin/integraciones', icon: '⚙', label: 'integrations' },
  { to: '/admin/equipo', icon: '◈', label: 'team', full: true },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app ${menuOpen ? 'menu-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Brand to="/admin" />
          <button type="button" className="icon-btn menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label={t('app.openMenu')} aria-expanded={menuOpen}>{menuOpen ? '×' : '☰'}</button>
        </div>
        <SessionClock zones={['CDMX', 'UTC']} />
        <nav className="nav">
          {NAV.filter((n) => !n.full || user?.adminLevel === 'FULL').map((n) =>
            n.group ? (
              <div key={n.group} className="nav-group">{t(`app.adminNav.${n.group}`)}</div>
            ) : (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <span className="ico">{n.icon}</span>{t(`app.adminNav.${n.label}`)}
              </NavLink>
            ),
          )}
          <SecurityNavButton />
          <button type="button" className="nav-logout" onClick={logout}><span className="ico">⎋</span>{t('app.logout')}</button>
        </nav>
        <div className="sidebar-lang"><LanguageSwitcher /></div>
        <div className="userbox">{t('app.admin')}: {user?.name}<br /><span>{ADMIN_LEVELS[user?.adminLevel] || t('app.noLevel')}</span></div>
      </aside>
      <main className="main">
        <div className="page-enter" key={`${location.pathname}-${lang}`}><Outlet /></div>
        <Disclaimer />
      </main>
    </div>
  );
}

export function AdminClientWorkspace() {
  const { clientId } = useParams();
  const [state, setState] = useState({ client: null, error: null });
  useEffect(() => {
    api.get(`/admin/clients/${clientId}`).then((client) => setState({ client, error: null })).catch((error) => setState({ client: null, error }));
  }, [clientId]);
  if (state.error) return <div className="main"><ErrorState error={state.error} /></div>;
  if (!state.client) return <Loading />;
  if (!state.client.dataShare) {
    return (
      <div className="main">
        <Link className="btn-secondary back" to={`/admin/clientes/${clientId}`}>{tr('← Volver al cliente')}</Link>
        <Card title={tr('Datos no compartidos')}>
          <p>{tr('{name} no ha autorizado compartir sus datos, o ya dejó de compartirlos. Para ver su panel, pídele que active «Compartir mis datos» desde Mi acceso o Asesoría personalizada.', { name: state.client.name })}</p>
        </Card>
      </div>
    );
  }
  return (
    <WorkspaceProvider key={clientId} clientId={clientId} client={state.client}>
      <AppLayout />
    </WorkspaceProvider>
  );
}

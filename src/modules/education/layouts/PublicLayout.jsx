import { Link, Outlet, useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar.jsx';
import { TradingBackdrop } from '../components/public/TradingBackdrop.jsx';
import { LegalLinks } from '../pages/public/legal/LegalPage.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

export function AuthLayout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className="auth-shell">
      <TradingBackdrop />
      <PublicNavbar onSelect={() => navigate('/')} extraLink={false} />
      <main className="auth-main">
        <Link to="/" className="auth-back"><span aria-hidden="true">←</span> {t('common.backHome')}</Link>
        <Outlet />
      </main>
      <p className="auth-legal">{t('common.disclaimer')}<br /><LegalLinks /></p>
    </div>
  );
}

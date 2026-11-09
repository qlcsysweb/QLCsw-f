import { Link, useLocation } from '../router.jsx';
import QlcLogo from '../components/QlcLogo';
import MarketBackdrop from '../components/MarketBackdrop';
import { useLanguage } from '../i18n/LanguageContext';
import PasswordResetForm from './PasswordResetForm';
import './LoginPage.css';

export default function PasswordResetPage() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <div className="qlc-login-screen">
      <MarketBackdrop />
      <div className="qlc-login-box qlc-card">
        <div className="qlc-login-brand">
          <QlcLogo className="qlc-login-logo" animated alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <div className="qlc-kicker">{t('passwordReset.kicker')}</div>
        <h1>{t('passwordReset.title')}</h1>
        <PasswordResetForm initialEmail={location.state?.email || ''} />
        <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
          <Link to="/login">{t('passwordReset.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}

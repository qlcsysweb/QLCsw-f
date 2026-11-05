import { Link, useLocation, useNavigate } from 'react-router-dom';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import PasswordResetFlow from './PasswordResetFlow';
import './LoginPage.css';

export default function PasswordResetPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="qlc-login-screen">
      <div className="qlc-login-box qlc-card">
        <div className="qlc-login-brand">
          <QlcLogo className="qlc-login-logo" animated alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <div className="qlc-kicker">{t('passwordReset.kicker')}</div>
        <h1>{t('passwordReset.title')}</h1>
        <PasswordResetFlow initialEmail={location.state?.email || ''} onGoLogin={() => navigate('/login')} />
        <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
          <Link to="/login">{t('passwordReset.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}

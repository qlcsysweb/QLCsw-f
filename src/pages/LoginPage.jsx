import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import './LoginPage.css';

export default function LoginPage() {
  const { login, loginWithTwoFactor } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const goAfterLogin = (user) => {
    const destination = from || (user.role === 'ADMIN' ? '/admin' : '/client');
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.twoFactorRequired) {
        setTempToken(result.tempToken);
      } else {
        goAfterLogin(result);
      }
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginWithTwoFactor(tempToken, code);
      goAfterLogin(user);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qlc-login-screen">
      <div className="qlc-login-box qlc-card">
        <div className="qlc-login-brand">
          <QlcLogo className="qlc-login-logo" animated alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <div className="qlc-kicker">{t('auth.kicker')}</div>
        <h1>{t('auth.title')}</h1>
        <p className="qlc-login-sub">{t('auth.subtitle')}</p>

        {!tempToken ? (
          <form onSubmit={handleSubmit}>
            <label className="qlc-label">{t('auth.email')}</label>
            <input
              className="qlc-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
            />
            <label className="qlc-label">{t('auth.password')}</label>
            <input
              className="qlc-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {error && <div className="qlc-login-error">{error}</div>}

            <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading}>
              {loading ? t('auth.submitting') : t('auth.submit')}
            </button>

            <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
              {t('auth.noAccount')} <Link to="/registro">{t('auth.createAccount')}</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleTwoFactorSubmit}>
            <label className="qlc-label">{t('auth.twoFactorCode')}</label>
            <input
              className="qlc-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
            />
            {error && <div className="qlc-login-error">{error}</div>}
            <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading}>
              {loading ? t('auth.submitting') : t('auth.verifyCode')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

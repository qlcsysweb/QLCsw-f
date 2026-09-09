import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      const destination = from || (user.role === 'ADMIN' ? '/admin' : '/client');
      navigate(destination, { replace: true });
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

        <form onSubmit={handleSubmit}>
          <label className="qlc-label">{t('auth.username')}</label>
          <input
            className="qlc-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.usernamePlaceholder')}
            autoComplete="username"
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
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import './LoginPage.css';

export default function LoginPage() {
  const { login, loginWithTwoFactor, loginWithCode } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState(null);
  // Acceso con contraseña O con código de Google Authenticator (uno de los dos).
  const [mode, setMode] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const goAfterLogin = (user) => {
    if (user.twoFactorSetupRequired) return navigate('/seguridad-2fa', { replace: true });
    const destination = from || (user.role === 'ADMIN' ? '/admin' : '/client');
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'code' ? await loginWithCode(email, code) : await login(email, password);
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
            <div className="qlc-login-modes" role="tablist" aria-label={t('auth.modeLabel')}>
              {['password', 'code'].map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  className={mode === m ? 'is-active' : ''}
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                >
                  {m === 'password' ? t('auth.modePassword') : t('auth.modeCode')}
                </button>
              ))}
            </div>
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
            {mode === 'code' ? (
              <>
                <label className="qlc-label" htmlFor="login-code">{t('auth.twoFactorCode')}</label>
                <input
                  id="login-code"
                  className="qlc-input qlc-otp-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
                <p className="qlc-login-sub" style={{ marginTop: 8, fontSize: 12 }}>{t('auth.codeModeHint')}</p>
              </>
            ) : (
              <>
                <label className="qlc-label">{t('auth.password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="qlc-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--qlc-muted)',
                      fontSize: 12,
                    }}
                  >
                    {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  </button>
                </div>

                <div className="qlc-login-forgot">
                  <button type="button" onClick={() => navigate('/restablecer-contrasena', { state: { email } })}>
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </>
            )}

            {error && <div className="qlc-login-error">{error}</div>}

            <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading || (mode === 'code' && code.length !== 6)}>
              {loading ? t('auth.submitting') : t('auth.submit')}
            </button>

            <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
              {t('auth.noAccount')} <Link to="/registro">{t('auth.createAccount')}</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleTwoFactorSubmit}>
            <p className="qlc-login-sub">{t('auth.twoFactorHint')}</p>
            <label className="qlc-label" htmlFor="login-2fa">{t('auth.twoFactorCode')}</label>
            <input
              id="login-2fa"
              className="qlc-input qlc-otp-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
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

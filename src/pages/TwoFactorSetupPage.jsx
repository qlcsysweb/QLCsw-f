import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import './LoginPage.css';

/*
 * 2FA OBLIGATORIO — toda cuenta sin Google
 * Authenticator llega aquí después de iniciar sesión (ProtectedRoute) y no
 * puede usar el panel hasta activarlo; el backend también bloquea el resto
 * de rutas (middleware/auth.js). Flujo: generar QR → escanear → código de 6
 * dígitos → activar.
 */
export default function TwoFactorSetupPage() {
  const { user, loading: authLoading, refresh, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const panel = user.role === 'ADMIN' ? '/admin' : '/client';
  if (!user.twoFactorSetupRequired) return <Navigate to={panel} replace />;

  const run = async (fn) => {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setLoading(false);
    }
  };

  const start = () =>
    run(async () => {
      const { data } = await api.post('/auth/2fa/setup');
      setSetup({ qr: data.qrCodeDataUrl, secret: data.secret });
      setCode('');
    });

  const confirm = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/auth/2fa/confirm', { code });
      await refresh();
      navigate(panel, { replace: true });
    });
  };

  return (
    <div className="qlc-login-screen">
      <div className="qlc-login-box qlc-2fa-box qlc-card">
        <div className="qlc-login-brand">
          <QlcLogo className="qlc-login-logo" animated alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <div className="qlc-kicker">{t('twoFactorSetup.kicker')}</div>
        <h1>{t('twoFactorSetup.title')}</h1>
        <p className="qlc-login-sub">{t('twoFactorSetup.intro')}</p>

        {!setup ? (
          <>
            <ol className="qlc-2fa-steps">
              <li>{t('twoFactorSetup.step1')}</li>
              <li>{t('twoFactorSetup.step2')}</li>
              <li>{t('twoFactorSetup.step3')}</li>
            </ol>
            {error && <div className="qlc-login-error">{error}</div>}
            <button type="button" className="qlc-btn primary qlc-login-submit" onClick={start} disabled={loading}>
              {loading ? t('auth.submitting') : t('twoFactorSetup.generate')}
            </button>
          </>
        ) : (
          <form onSubmit={confirm}>
            <div className="qlc-2fa-qr">
              <img src={setup.qr} alt={t('twoFactorSetup.qrAlt')} />
            </div>
            <p className="qlc-login-sub" style={{ marginBottom: 0 }}>{t('twoFactorSetup.manualKey')}</p>
            <code className="qlc-2fa-secret">{setup.secret}</code>
            <label className="qlc-label" htmlFor="twofa-code">{t('twoFactorSetup.codeLabel')}</label>
            <input
              id="twofa-code"
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
            <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading || code.length !== 6}>
              {loading ? t('auth.submitting') : t('twoFactorSetup.activate')}
            </button>
            <button type="button" className="qlc-btn ghost qlc-login-submit" onClick={start} disabled={loading}>
              {t('twoFactorSetup.regenerate')}
            </button>
          </form>
        )}

        <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
          <button
            type="button"
            className="qlc-btn ghost"
            onClick={async () => {
              // Igual que en los paneles: al cerrar sesión, al inicio público.
              navigate('/', { replace: true });
              await logout();
            }}
          >
            {t('twoFactorSetup.logout')}
          </button>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import './LoginPage.css';

/*
 * RESTABLECER CONTRASEÑA desde el inicio de sesión, con Google Authenticator:
 * 1) correo → Siguiente  2) código de 6 dígitos → Verificar
 * 3) contraseña nueva + confirmación → Guardar.
 * El backend valida correo + código y emite un token temporal de un solo uso
 * (10 min) para el paso 3; nunca revela si un correo existe.
 */
const STEPS = ['email', 'code', 'password', 'done'];

export default function PasswordResetPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const submitEmail = (e) => {
    e.preventDefault();
    setError('');
    setStep('code');
  };

  const submitCode = (e) => {
    e.preventDefault();
    run(async () => {
      const { data } = await api.post('/auth/password-reset/verify', { email: email.trim(), code });
      setResetToken(data.resetToken);
      setStep('password');
    });
  };

  const submitPassword = (e) => {
    e.preventDefault();
    if (password.length < 8) return setError(t('passwordReset.tooShort'));
    if (password !== confirm) return setError(t('passwordReset.mismatch'));
    run(async () => {
      await api.post('/auth/password-reset/complete', { resetToken, newPassword: password });
      setStep('done');
    });
  };

  const back = () => {
    setError('');
    setCode('');
    setStep('email');
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="qlc-login-screen">
      <div className="qlc-login-box qlc-card">
        <div className="qlc-login-brand">
          <QlcLogo className="qlc-login-logo" animated alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <div className="qlc-kicker">{t('passwordReset.kicker')}</div>
        <h1>{t('passwordReset.title')}</h1>

        {step !== 'done' && (
          <ol className="qlc-reset-steps" aria-label={t('passwordReset.title')}>
            {[t('passwordReset.stepEmail'), t('passwordReset.stepCode'), t('passwordReset.stepPassword')].map((label, i) => (
              <li key={label} className={i < stepIndex ? 'is-done' : i === stepIndex ? 'is-current' : ''}>
                <span>{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        )}

        {step === 'email' && (
          <form onSubmit={submitEmail}>
            <p className="qlc-login-sub">{t('passwordReset.emailIntro')}</p>
            <label className="qlc-label" htmlFor="reset-email">{t('passwordReset.emailLabel')}</label>
            <input
              id="reset-email"
              className="qlc-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              autoFocus
              required
            />
            <button className="qlc-btn primary qlc-login-submit" type="submit">
              {t('passwordReset.next')}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={submitCode}>
            <p className="qlc-login-sub">{t('passwordReset.codeIntro')}</p>
            <p className="qlc-reset-email">{email}</p>
            <label className="qlc-label" htmlFor="reset-code">{t('passwordReset.codeLabel')}</label>
            <input
              id="reset-code"
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
              {loading ? t('auth.submitting') : t('passwordReset.verify')}
            </button>
            <button type="button" className="qlc-btn ghost qlc-login-submit" onClick={back} disabled={loading}>
              {t('passwordReset.back')}
            </button>
            <p className="qlc-login-sub" style={{ marginTop: 14, fontSize: 12 }}>{t('passwordReset.noAuthenticator')}</p>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={submitPassword}>
            <p className="qlc-login-sub">{t('passwordReset.passwordIntro')}</p>
            <label className="qlc-label" htmlFor="reset-password">{t('passwordReset.newPassword')}</label>
            <input
              id="reset-password"
              className="qlc-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              autoFocus
              required
            />
            <label className="qlc-label" htmlFor="reset-confirm">{t('passwordReset.confirmPassword')}</label>
            <input
              id="reset-confirm"
              className="qlc-input"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <label className="qlc-reset-show">
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
              {t('auth.showPassword')}
            </label>
            {error && <div className="qlc-login-error">{error}</div>}
            <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading}>
              {loading ? t('auth.submitting') : t('passwordReset.save')}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div role="status">
            <p className="qlc-reset-done">✓ {t('passwordReset.doneTitle')}</p>
            <p className="qlc-login-sub">{t('passwordReset.doneText')}</p>
            <Link className="qlc-btn primary qlc-login-submit" to="/login" style={{ textAlign: 'center' }}>
              {t('passwordReset.goLogin')}
            </Link>
          </div>
        )}

        {step !== 'done' && (
          <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
            <Link to="/login">{t('passwordReset.backToLogin')}</Link>
          </p>
        )}
      </div>
    </div>
  );
}

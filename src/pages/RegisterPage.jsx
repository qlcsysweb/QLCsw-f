import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import { PrivacyNoticeModal, TermsAndConditionsModal } from '../components/LegalAcceptanceModal';
import './LoginPage.css';

const normalizeCode = (raw) => String(raw || '').trim().replace(/[\s-]+/g, '').toUpperCase();

// REGISTRO POR INVITACIÓN — el registro externo exige un código de afiliado
// válido (por enlace ?ref=CODIGO o escrito a mano). Sin invitación válida no
// se muestra el formulario; el backend vuelve a validar el código al crear la
// cuenta, así que quitar el ?ref o forzar el formulario no permite registrarse.
//
// Etapas: "gate" (pedir código) → "invite" (invitación válida) → "form" →
// "privacy" → "terms". "invalid" cuando el código no sirve. Tras crear la
// cuenta sigue el flujo de seguridad actual (2FA obligatorio en el primer
// acceso, ver ProtectedRoute) — la invitación no lo omite.
export default function RegisterPage() {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const refParam = normalizeCode(searchParams.get('ref'));

  const [codeInput, setCodeInput] = useState(refParam);
  const [invite, setInvite] = useState(null); // { code, inviterFirstName }
  const [checking, setChecking] = useState(Boolean(refParam));
  const [stage, setStage] = useState(refParam ? 'checking' : 'gate');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Bloqueo síncrono contra doble submit (el backend además rechaza un
  // segundo registro del mismo correo con 409).
  const submittingRef = useRef(false);

  const validate = async (rawCode) => {
    const code = normalizeCode(rawCode);
    if (!code) return;
    setChecking(true);
    setError('');
    try {
      const { data } = await api.get('/affiliate/validate', { params: { code } });
      setInvite({ code: data.code, inviterFirstName: data.inviterFirstName });
      setStage('invite');
      if (searchParams.get('ref') !== data.code) setSearchParams({ ref: data.code }, { replace: true });
    } catch (err) {
      setInvite(null);
      setStage(err.status && err.status < 500 && err.status !== 429 ? 'invalid' : 'gate');
      if (!(err.status && err.status < 500 && err.status !== 429)) setError(translateBackendMessage(err.message, language));
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (refParam) validate(refParam);
    // Solo al entrar con un enlace de invitación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToGate = () => {
    setInvite(null);
    setCodeInput('');
    setError('');
    setStage('gate');
    setSearchParams({}, { replace: true });
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleContinue = (e) => {
    e.preventDefault();
    setError('');
    setStage('privacy');
  };

  const completeRegistration = async () => {
    if (submittingRef.current || !invite) return;
    submittingRef.current = true;
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        affiliateCode: invite.code,
        privacyAccepted: true,
        termsAccepted: true,
        apiAuthorizationAccepted: true,
      });
      navigate('/client', { replace: true });
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setStage('form');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (stage === 'privacy') {
    return <PrivacyNoticeModal onAccept={() => setStage('terms')} />;
  }

  if (stage === 'terms') {
    return <TermsAndConditionsModal onAccept={completeRegistration} onBack={() => setStage('privacy')} loading={loading} />;
  }

  const brand = (
    <div className="qlc-login-brand">
      <QlcLogo className="qlc-login-logo" animated alt="QLC" />
      <span>QUANTUM LIQUIDITY CAPITAL</span>
    </div>
  );
  const signInLink = (
    <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
      {t('register.haveAccount')} <Link to="/login">{t('register.signIn')}</Link>
    </p>
  );

  let body;
  if (stage === 'checking') {
    body = (
      <>
        <div className="qlc-kicker">{t('invite.kicker')}</div>
        <p className="qlc-login-sub" role="status">{t('invite.validating')}</p>
      </>
    );
  } else if (stage === 'invalid') {
    body = (
      <>
        <div className="qlc-kicker">{t('invite.kicker')}</div>
        <h1>{t('invite.invalidTitle')}</h1>
        <p className="qlc-login-sub">{t('invite.invalidText')}</p>
        <button type="button" className="qlc-btn primary qlc-login-submit" onClick={resetToGate}>
          {t('invite.tryAnother')}
        </button>
        {signInLink}
      </>
    );
  } else if (stage === 'invite' && invite) {
    body = (
      <>
        <div className="qlc-kicker">{t('invite.kicker')}</div>
        <h1>{t('invite.validTitle')}</h1>
        <p className="qlc-login-sub">✓ {t('invite.validText')}</p>
        <div className="qlc-invite-code">
          <span>{t('invite.codeShown')}</span>
          <strong>{invite.code}</strong>
          {invite.inviterFirstName && (
            <small>
              {t('invite.invitedBy')}: {invite.inviterFirstName}
            </small>
          )}
        </div>
        <button type="button" className="qlc-btn primary qlc-login-submit" onClick={() => setStage('form')}>
          {t('invite.continue')}
        </button>
        <button type="button" className="qlc-btn ghost qlc-login-submit" onClick={resetToGate}>
          {t('invite.changeCode')}
        </button>
        {signInLink}
      </>
    );
  } else if (stage === 'form' && invite) {
    body = (
      <>
        <div className="qlc-kicker">{t('register.kicker')}</div>
        <h1>{t('register.title')}</h1>
        <p className="qlc-login-sub">{t('register.subtitle')}</p>
        <div className="qlc-invite-code is-compact">
          <span>{t('invite.codeShown')}</span>
          <strong>{invite.code}</strong>
        </div>
        <form onSubmit={handleContinue}>
          <label className="qlc-label">{t('register.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('register.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
          <label className="qlc-label">{t('register.email')}</label>
          <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
          <label className="qlc-label">{t('register.password')}</label>
          <div style={{ position: 'relative' }}>
            <input
              className="qlc-input"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              minLength={8}
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

          {error && <div className="qlc-login-error">{error}</div>}

          <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading}>
            {t('register.continue')}
          </button>
          {signInLink}
        </form>
      </>
    );
  } else {
    // Sin invitación: pantalla "Registro por invitación". No hay "Omitir".
    body = (
      <>
        <div className="qlc-kicker">{t('invite.kicker')}</div>
        <h1>{t('invite.gateTitle')}</h1>
        <p className="qlc-login-sub">{t('invite.gateText')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!checking) validate(codeInput);
          }}
        >
          <label className="qlc-label" htmlFor="affiliate-code">
            {t('invite.codeLabel')}
          </label>
          <input
            id="affiliate-code"
            className="qlc-input"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
            required
          />
          {error && <div className="qlc-login-error">{error}</div>}
          <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={checking || !normalizeCode(codeInput)}>
            {checking ? t('invite.validating') : t('invite.validate')}
          </button>
          {signInLink}
        </form>
      </>
    );
  }

  return (
    <div className="qlc-login-screen">
      <div className="qlc-login-box qlc-card">
        {brand}
        {body}
      </div>
    </div>
  );
}

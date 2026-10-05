import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import { PrivacyNoticeModal, TermsAndConditionsModal } from '../components/LegalAcceptanceModal';
import { suggestEmailFix } from '../utils/emailTypos';
import './LoginPage.css';

// Acepta el código o la liga completa pegada ("…/registro?ref=CODIGO").
const normalizeCode = (raw) => {
  const text = String(raw || '').trim();
  const fromLink = text.match(/[?&]ref=([^&#\s]+)/i);
  return (fromLink ? decodeURIComponent(fromLink[1]) : text).replace(/[\s-]+/g, '').toUpperCase();
};

// REGISTRO POR INVITACIÓN (QLC Affiliate Program §3.1) — se conserva la
// pantalla de registro actual (mismo diseño y campos) y se agrega el campo
// OBLIGATORIO "Liga o código de afiliación", precargado desde la URL
// (?ref=CODIGO). El código se valida contra el backend (existe y está
// activo); si es inválido o está suspendido el registro queda bloqueado con
// un mensaje claro. Antes de confirmar se muestra un aviso discreto sin datos
// del afiliador. El backend vuelve a validar el código al crear la cuenta.
// Tras el formulario siguen el Aviso de Privacidad y los Términos, y después
// el flujo de seguridad actual (2FA obligatorio en el primer acceso).
export default function RegisterPage() {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const refParam = normalizeCode(searchParams.get('ref'));

  const [codeInput, setCodeInput] = useState(refParam);
  // { code } cuando el código vigente del campo fue validado por el backend.
  const [invite, setInvite] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [checking, setChecking] = useState(false);
  const [stage, setStage] = useState('form');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // VERIFICACIÓN DEL CORREO — código de 6 dígitos enviado al correo escrito.
  // `codeSentTo` = correo al que se envió (si el cliente lo cambia, hay que
  // enviar un código nuevo). `cooldown` = segundos para poder reenviar.
  const [emailCode, setEmailCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [codeInfo, setCodeInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const sendingRef = useRef(false);
  // Bloqueo síncrono contra doble submit (el backend además rechaza un
  // segundo registro del mismo correo con 409).
  const submittingRef = useRef(false);

  const validate = async (rawCode) => {
    const code = normalizeCode(rawCode);
    if (!code) {
      setInvite(null);
      setCodeError(t('invite.gateText'));
      return null;
    }
    if (invite?.code === code) return invite;
    setChecking(true);
    setCodeError('');
    try {
      const { data } = await api.get('/affiliate/validate', { params: { code } });
      const valid = { code: data.code };
      setInvite(valid);
      if (searchParams.get('ref') !== data.code) setSearchParams({ ref: data.code }, { replace: true });
      return valid;
    } catch (err) {
      setInvite(null);
      // 4xx = código inexistente, suspendido o inválido; otro error = red/servidor.
      setCodeError(err.status && err.status < 500 && err.status !== 429 ? t('invite.invalidText') : translateBackendMessage(err.message, language));
      return null;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Liga abierta: el código llega precargado y se valida de inmediato.
    if (refParam) validate(refParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const emailTypoFix = suggestEmailFix(form.email);
  const codeSentToCurrent = Boolean(codeSentTo) && codeSentTo === form.email.trim().toLowerCase();

  const sendCode = async () => {
    if (sendingRef.current || cooldown > 0) return;
    setError('');
    setCodeInfo('');
    const valid = await validate(codeInput);
    if (!valid) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t('register.emailInvalid'));
      return;
    }
    sendingRef.current = true;
    setSendingCode(true);
    try {
      await api.post('/auth/register/email-code', {
        email: form.email.trim(),
        affiliateCode: valid.code,
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        language,
      });
      setCodeSentTo(form.email.trim().toLowerCase());
      setEmailCode('');
      setCodeInfo(t('register.codeSent').replace('{email}', form.email.trim()));
      setCooldown(60);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      sendingRef.current = false;
      setSendingCode(false);
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');
    const valid = await validate(codeInput);
    if (!valid) return;
    // El correo debe confirmarse con el código antes de continuar.
    if (!codeSentToCurrent) {
      setError(t('register.codeRequired'));
      return;
    }
    if (!/^\d{6}$/.test(emailCode.trim())) {
      setError(t('register.codeFormat'));
      return;
    }
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
        email: form.email.trim(),
        emailCode: emailCode.trim(),
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

  const codeIsCurrent = invite && invite.code === normalizeCode(codeInput);

  return (
    <div className="qlc-login-screen">
      <div className="qlc-login-box qlc-card">
        <div className="qlc-login-brand">
          <QlcLogo className="qlc-login-logo" animated alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <div className="qlc-kicker">{t('register.kicker')}</div>
        <h1>{t('register.title')}</h1>
        <p className="qlc-login-sub">{t('invite.gateText')}</p>

        <form onSubmit={handleContinue}>
          <label className="qlc-label" htmlFor="affiliate-code">
            {t('invite.codeLabel')} *
          </label>
          <input
            id="affiliate-code"
            className="qlc-input"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              setCodeError('');
            }}
            onBlur={() => codeInput.trim() && validate(codeInput)}
            maxLength={300}
            autoComplete="off"
            spellCheck={false}
            required
            aria-required="true"
            aria-invalid={Boolean(codeError)}
            aria-describedby="affiliate-code-status"
          />
          <div id="affiliate-code-status" role="status" style={{ minHeight: 18, fontSize: 12, marginTop: -4, marginBottom: 6 }}>
            {checking && <span style={{ color: 'var(--qlc-muted)' }}>{t('invite.validating')}</span>}
            {!checking && codeIsCurrent && <span style={{ color: 'var(--qlc-ok)' }}>✓ {t('invite.validText')}</span>}
            {!checking && codeError && <span className="qlc-field-error">{codeError}</span>}
          </div>

          <label className="qlc-label">{t('register.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('register.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
          <label className="qlc-label">{t('register.email')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="qlc-input"
              type="email"
              value={form.email}
              onChange={update('email')}
              required
              autoComplete="email"
              style={{ margin: 0, flex: 1, minWidth: 0 }}
            />
            <button
              type="button"
              className="qlc-btn ghost"
              style={{ flexShrink: 0 }}
              onClick={sendCode}
              disabled={sendingCode || cooldown > 0 || !form.email.trim()}
            >
              {sendingCode
                ? t('register.sendingCode')
                : cooldown > 0
                  ? t('register.resendIn').replace('{s}', cooldown)
                  : codeSentToCurrent
                    ? t('register.resendCode')
                    : t('register.sendCode')}
            </button>
          </div>
          {emailTypoFix && (
            <p style={{ fontSize: 12, color: 'var(--qlc-warn)', margin: '6px 0 0' }}>
              {t('register.typoQuestion')}{' '}
              <button type="button" className="qlc-link-btn" onClick={() => setForm((f) => ({ ...f, email: emailTypoFix }))}>
                {emailTypoFix}
              </button>
              ?
            </p>
          )}
          {codeInfo && codeSentToCurrent && <p style={{ fontSize: 12, color: 'var(--qlc-ok)', margin: '6px 0 0' }}>{codeInfo}</p>}
          {codeSentToCurrent && (
            <>
              <label className="qlc-label" htmlFor="email-code">
                {t('register.codeLabel')}
              </label>
              <input
                id="email-code"
                className="qlc-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                style={{ letterSpacing: '0.3em', fontVariantNumeric: 'tabular-nums' }}
              />
            </>
          )}
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

          {/* Aviso discreto antes de confirmar, sin información del afiliador. */}
          {codeIsCurrent && (
            <p className="qlc-invite-code is-compact" style={{ margin: '14px 0 0' }}>
              <span>{t('invite.notice')}</span>
            </p>
          )}

          {error && <div className="qlc-login-error">{error}</div>}

          <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading || checking || !normalizeCode(codeInput)}>
            {checking ? t('invite.validating') : t('register.continue')}
          </button>

          <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
            {t('register.haveAccount')} <Link to="/login">{t('register.signIn')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

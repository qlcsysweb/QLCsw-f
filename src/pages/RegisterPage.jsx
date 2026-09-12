import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import { PrivacyNoticeModal, TermsAndConditionsModal } from '../components/LegalAcceptanceModal';
import './LoginPage.css';

// CORRECCIÓN 5 — registro público directo: el visitante se convierte en
// cliente de inmediato (no pasa por "prospecto"). Solo pide nombre,
// apellidos, correo y contraseña — sin teléfono, sin username.
//
// El contrato ya NO forma parte del registro. Tras llenar el formulario, el
// registro se completa en dos pantallas legales (mismo estilo que el aviso
// anti-estafa): Aviso de Privacidad y luego Términos y Condiciones. Solo al
// aceptar ambas se crea la cuenta — "form" -> "privacy" -> "terms".
export default function RegisterPage() {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', nationality: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('form');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleContinue = (e) => {
    e.preventDefault();
    setError('');
    setStage('privacy');
  };

  const completeRegistration = async () => {
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        privacyAccepted: true,
        termsAccepted: true,
        apiAuthorizationAccepted: true,
      });
      navigate('/client', { replace: true });
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setStage('form');
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'privacy') {
    return <PrivacyNoticeModal onAccept={() => setStage('terms')} />;
  }

  if (stage === 'terms') {
    return (
      <TermsAndConditionsModal
        onAccept={completeRegistration}
        onBack={() => setStage('privacy')}
        loading={loading}
      />
    );
  }

  return (
    <div className="qlc-login-screen">
      <div className="qlc-login-box qlc-card">
        <div className="qlc-login-brand">
          <QlcLogo className="qlc-login-logo" animated alt="QLC" />
          <span>QUANTUM LIQUIDITY CAPITAL</span>
        </div>
        <div className="qlc-kicker">{t('register.kicker')}</div>
        <h1>{t('register.title')}</h1>
        <p className="qlc-login-sub">{t('register.subtitle')}</p>

        <form onSubmit={handleContinue}>
          <label className="qlc-label">{t('register.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('register.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
          <label className="qlc-label">{t('register.nationality')}</label>
          <input className="qlc-input" value={form.nationality} onChange={update('nationality')} required />
          <label className="qlc-label">{t('register.email')}</label>
          <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
          <label className="qlc-label">{t('register.password')}</label>
          <input
            className="qlc-input"
            type="password"
            value={form.password}
            onChange={update('password')}
            minLength={8}
            required
          />

          {error && <div className="qlc-login-error">{error}</div>}

          <button className="qlc-btn primary qlc-login-submit" type="submit">
            {t('register.continue')}
          </button>

          <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
            {t('register.haveAccount')} <Link to="/login">{t('register.signIn')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

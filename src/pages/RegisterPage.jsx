import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import './LoginPage.css';

// CORRECCIÓN 5 — registro público directo: el visitante se convierte en
// cliente de inmediato (no pasa por "prospecto"). Solo pide nombre,
// apellidos, correo y contraseña — sin teléfono, sin username.
export default function RegisterPage() {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/client', { replace: true });
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
        <div className="qlc-kicker">{t('register.kicker')}</div>
        <h1>{t('register.title')}</h1>
        <p className="qlc-login-sub">{t('register.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <label className="qlc-label">{t('register.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('register.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
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

          <button className="qlc-btn primary qlc-login-submit" type="submit" disabled={loading}>
            {loading ? t('register.submitting') : t('register.submit')}
          </button>

          <p className="qlc-login-sub" style={{ marginTop: 18, marginBottom: 0 }}>
            {t('register.haveAccount')} <Link to="/login">{t('register.signIn')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

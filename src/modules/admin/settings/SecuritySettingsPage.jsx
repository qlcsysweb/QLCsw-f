import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useLanguage } from '../../../i18n/LanguageContext';
import { translateBackendMessage } from '../../../i18n/backendMessages';

/*
 * CORREGIR.xlsx ADMIN 06 — solo el administrador general puede ver/editar
 * esta página (el backend rechaza con 403 a cualquier otro admin). Aquí se
 * configura la contraseña de seguridad exclusiva requerida para eliminar
 * clientes.
 */
export default function SecuritySettingsPage() {
  const { t, language } = useLanguage();
  const [configured, setConfigured] = useState(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/admin/security-config')
      .then(({ data }) => setConfigured(data.configured))
      .catch((err) => setError(translateBackendMessage(err.message, language)));

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/admin/security-config/password', { password });
      setPassword('');
      setMessage(t('adminSecurity.savedOk'));
      setTimeout(() => setMessage(''), 4000);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminSecurity.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminSecurity.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('adminSecurity.intro')}</p>

      {error && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>
          {error}
        </div>
      )}
      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      {configured !== null && (
        <div className="qlc-card" style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 13 }}>
            <strong>{t('adminSecurity.status')}:</strong>{' '}
            <span className={`qlc-badge ${configured ? 'ok' : 'warn'}`}>
              {configured ? t('adminSecurity.configured') : t('adminSecurity.notConfigured')}
            </span>
          </p>
          <form onSubmit={save}>
            <label className="qlc-label">{t('adminSecurity.newPassword')}</label>
            <input
              className="qlc-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button className="qlc-btn primary" style={{ marginTop: 12 }} disabled={saving}>
              {saving ? t('common.saving') : t('adminSecurity.save')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

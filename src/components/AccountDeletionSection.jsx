import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import Modal from './Modal';
import { ACCOUNT_NOTICE_KEY } from './AccountNotice';

/*
 * "Eliminar mi cuenta" — sección discreta al final del perfil del CLIENTE.
 * Exige contraseña actual + código de Google Authenticator + casilla de
 * confirmación; el backend vuelve a validar todo con la sesión (nunca con
 * un ID del navegador). No borra datos: registra la solicitud y desactiva el
 * acceso. Tras confirmarse, limpia la sesión local y lleva a la página
 * pública, donde AccountNotice muestra el aviso de solicitud registrada.
 */
export default function AccountDeletionSection() {
  const { t, language } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (submitting) return;
    setOpen(false);
    setPassword('');
    setCode('');
    setUnderstood(false);
    setError('');
  };

  const canSubmit = password.length > 0 && /^\d{6}$/.test(code) && understood && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/client/account/deletion-request', { password, code, confirm: true });
      try {
        sessionStorage.setItem(ACCOUNT_NOTICE_KEY, 'deletion-requested');
      } catch {
        // sin sessionStorage solo se omite el aviso; la sesión se cierra igual
      }
      setPassword('');
      setCode('');
      navigate('/', { replace: true });
      // El backend ya desactivó el acceso: esto limpia el token local y el usuario en memoria.
      logout().catch(() => {});
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setCode('');
      setSubmitting(false);
    }
  };

  return (
    <div className="qlc-card qlc-account-admin">
      <h3>{t('accountDeletion.sectionTitle')}</h3>
      <p>{t('accountDeletion.sectionText')}</p>
      <button type="button" className="qlc-btn ghost qlc-account-admin-btn" onClick={() => setOpen(true)}>
        {t('accountDeletion.button')}
      </button>

      {open && (
        <Modal title={t('accountDeletion.modalTitle')} onClose={close} width={480}>
          <form onSubmit={submit} autoComplete="off">
            <p className="qlc-account-admin-warning">{t('accountDeletion.modalMessage')}</p>

            <label className="qlc-label" htmlFor="qlc-del-password">
              {t('accountDeletion.passwordLabel')}
            </label>
            <input
              id="qlc-del-password"
              className="qlc-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />

            <label className="qlc-label" htmlFor="qlc-del-code">
              {t('accountDeletion.codeLabel')}
            </label>
            <input
              id="qlc-del-code"
              className="qlc-input qlc-account-admin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={submitting}
              required
            />

            <label className="qlc-account-admin-check">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} disabled={submitting} />
              <span>{t('accountDeletion.checkbox')}</span>
            </label>

            {error && <div className="qlc-field-error">{error}</div>}

            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={close} disabled={submitting}>
                {t('modals.cancel')}
              </button>
              <button type="submit" className="qlc-btn danger qlc-btn-destructive" disabled={!canSubmit}>
                {submitting ? t('modals.processing') : t('accountDeletion.confirm')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

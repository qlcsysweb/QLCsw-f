import { useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "¿No tienes código?" — deja nombre y correo; llega a Prospectos del admin
// (origen solicitud_codigo) con aviso en el panel y por correo.
// Va dentro del formulario de registro, así que no usa <form> propio.
export default function CodeRequestBox() {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim() || !EMAIL_RE.test(cleanEmail)) {
      setError(t('register.emailInvalid'));
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.post('/prospects', { firstName: name.trim(), email: cleanEmail, source: 'solicitud_codigo', language });
      setSentTo(cleanEmail);
    } catch (err) {
      setError(err?.message ? translateBackendMessage(err.message, language) : t('invite.requestError'));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="qlc-code-request" role="region" aria-label={t('invite.requestTitle')}>
      <b>{t('invite.requestTitle')}</b>
      <p>{t('invite.requestText')}</p>
      {sentTo ? (
        <p className="qlc-code-request-done" role="status">✓ {t('invite.requestDone').replace('{email}', sentTo)}</p>
      ) : (
        <>
          <div className="qlc-code-request-fields">
            <input className="qlc-input" placeholder={t('invite.requestName')} aria-label={t('invite.requestName')} value={name} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} onKeyDown={onKeyDown} />
            <input className="qlc-input" type="email" placeholder={t('invite.requestEmail')} aria-label={t('invite.requestEmail')} value={email} maxLength={200} autoComplete="email" onChange={(e) => setEmail(e.target.value)} onKeyDown={onKeyDown} />
          </div>
          {error && <span className="qlc-field-error">{error}</span>}
          <button type="button" className="qlc-btn primary qlc-code-request-btn" onClick={submit} disabled={sending}>
            {sending ? t('invite.requestSending') : t('invite.requestSubmit')}
          </button>
        </>
      )}
    </div>
  );
}

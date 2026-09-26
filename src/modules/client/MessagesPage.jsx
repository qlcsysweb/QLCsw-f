import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDateTime } from '../../utils/cdmxTime';

/*
 * MENSAJERÍA INTERNA — buzón admin↔cliente, deliberadamente distinto del
 * chat de citas (tiempo limitado, ligado a una cita autorizada) y de los
 * casos de soporte. Reutiliza Notification (kind=MANUAL) en el backend,
 * pero nunca se mezcla con la sección de Notificaciones automáticas.
 */
export default function MessagesPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = () => api.get('/client/messages').then(({ data }) => setMessages(data.messages));

  useEffect(() => {
    load();
    // Se marca como leído al ABRIR esta sección — nunca en el sondeo del
    // contador del menú, que usa el mismo GET pero sin este efecto.
    api.post('/client/messages/read-all').catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    setError('');
    setOk('');
    try {
      await api.post('/client/messages', form);
      setForm({ title: '', message: '' });
      setOk(t('clientMessages.sentOk'));
      setTimeout(() => setOk(''), 4000);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientMessages.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientMessages.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('clientMessages.intro')}</p>

      <div className="qlc-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>{t('clientMessages.history')}</h3>
        {messages.length === 0 ? (
          <div className="qlc-empty">{t('clientMessages.none')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {messages.map((m) => {
              const isMine = m.senderUserId === user?.id;
              return (
                <li key={m.id} className="qlc-message-item" style={{ borderLeft: `3px solid ${isMine ? 'var(--qlc-line)' : 'var(--qlc-blue3)'}`, paddingLeft: 10 }}>
                  <div className="qlc-message-head">
                    <strong>{m.title}</strong>
                    <span className="qlc-badge muted">{isMine ? t('clientMessages.fromMe') : t('clientMessages.fromQlc')}</span>
                  </div>
                  <div style={{ color: 'var(--qlc-muted2)', fontSize: 12 }}>{formatCdmxDateTime(m.createdAt)}</div>
                  <div style={{ overflowWrap: 'anywhere', marginTop: 4 }}>{m.message}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form className="qlc-card" style={{ maxWidth: 560 }} onSubmit={submit}>
        <h3 style={{ marginTop: 0 }}>{t('clientMessages.newTitle')}</h3>
        {ok && <p style={{ fontSize: 13, color: 'var(--qlc-ok)' }}>{ok}</p>}
        {error && <p className="qlc-field-error">{error}</p>}
        <label className="qlc-label">{t('clientMessages.subject')}</label>
        <input
          className="qlc-input"
          value={form.title}
          maxLength={150}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <label className="qlc-label">{t('clientMessages.content')}</label>
        <textarea
          className="qlc-textarea"
          rows={4}
          value={form.message}
          maxLength={2000}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          required
        />
        <button className="qlc-btn primary" style={{ marginTop: 10 }} disabled={sending}>
          {sending ? t('common.sending') : t('clientMessages.send')}
        </button>
      </form>
    </div>
  );
}

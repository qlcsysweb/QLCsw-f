import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_CASE_STATUS, CHAT_SESSION_STATUS, statusOf } from '../../utils/statusLabels';

function ChatPanel({ session, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [remaining, setRemaining] = useState(null);
  const [current, setCurrent] = useState(session);
  const pollRef = useRef(null);

  const refresh = () =>
    api.get(`/client/chat/${session.id}`).then(({ data }) => {
      setCurrent(data.session);
      setMessages(data.messages);
    });

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 4000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  useEffect(() => {
    if (current?.status !== 'ACTIVE' || !current.endsAt) {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const ms = new Date(current.endsAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [current]);

  const start = async () => {
    await api.post(`/client/chat/${session.id}/start`);
    refresh();
  };

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post(`/client/chat/${session.id}/messages`, { content });
      setContent('');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const minutes = remaining !== null ? Math.floor(remaining / 60) : null;
  const seconds = remaining !== null ? remaining % 60 : null;

  return (
    <div className="qlc-modal-overlay" onClick={onClose}>
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Chat de soporte</h2>
          <button className="qlc-btn ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {current?.status === 'SCHEDULED' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
              Tu cita fue autorizada. Tienes {current.durationMinutes} minutos de chat en vivo con el equipo de QLC.
            </p>
            <button className="qlc-btn primary" onClick={start}>
              Iniciar chat
            </button>
          </div>
        )}

        {current?.status === 'ACTIVE' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--qlc-gold)', margin: '10px 0' }}>
              Tiempo restante: {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--qlc-line)', borderRadius: 10, padding: 10 }}>
              {messages.length === 0 ? (
                <div className="qlc-empty">Sin mensajes todavía.</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ marginBottom: 8, fontSize: 13 }}>
                    <strong>{m.senderUserId === user.id ? 'Tú' : 'QLC'}:</strong> {m.content}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="qlc-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe un mensaje…"
              />
              <button className="qlc-btn primary">Enviar</button>
            </form>
          </>
        )}

        {current?.status === 'CLOSED' && (
          <div className="qlc-empty" style={{ marginTop: 20 }}>
            Esta sesión de chat ha finalizado.
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [activeChat, setActiveChat] = useState(null);

  const load = () => {
    api.get('/client/support-cases').then(({ data }) => setCases(data.cases));
    api.get('/client/chat-sessions').then(({ data }) => setSessions(data.sessions));
  };
  useEffect(load, []);

  const createCase = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    await api.post('/client/support-cases', form);
    setForm({ subject: '', message: '' });
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">SOPORTE</div>
      <h1 style={{ marginTop: 0 }}>Soporte y chat</h1>

      {sessions.filter((s) => s.status !== 'CLOSED').length > 0 && (
        <div className="qlc-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Chat disponible</h3>
          {sessions
            .filter((s) => s.status !== 'CLOSED')
            .map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span>
                  Sesión de {s.durationMinutes} minutos —{' '}
                  <span className={`qlc-badge ${statusOf(CHAT_SESSION_STATUS, s.status).className}`}>
                    {statusOf(CHAT_SESSION_STATUS, s.status).text}
                  </span>
                </span>
                <button className="qlc-btn primary" onClick={() => setActiveChat(s)}>
                  Abrir chat
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Mis casos ({cases.length})</h3>
          {cases.length === 0 ? (
            <div className="qlc-empty">Sin casos de soporte.</div>
          ) : (
            <ul className="qlc-plain-list">
              {cases.map((c) => (
                <li key={c.id}>
                  <strong>{c.subject}</strong> —{' '}
                  <span className={`qlc-badge ${statusOf(SUPPORT_CASE_STATUS, c.status).className}`}>
                    {statusOf(SUPPORT_CASE_STATUS, c.status).text}
                  </span>
                  <div style={{ color: 'var(--qlc-muted2)', fontSize: 12 }}>{c.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="qlc-card" onSubmit={createCase}>
          <h3 style={{ marginTop: 0 }}>Nuevo caso</h3>
          <label className="qlc-label">Asunto</label>
          <input className="qlc-input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
          <label className="qlc-label">Mensaje</label>
          <textarea className="qlc-textarea" rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          <div className="qlc-form-actions">
            <button className="qlc-btn primary">Crear caso</button>
          </div>
        </form>
      </div>

      {activeChat && <ChatPanel session={activeChat} onClose={() => { setActiveChat(null); load(); }} />}
    </div>
  );
}

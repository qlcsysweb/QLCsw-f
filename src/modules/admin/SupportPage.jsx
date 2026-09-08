import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function ChatPanel({ session, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [current, setCurrent] = useState(session);
  const [remaining, setRemaining] = useState(null);
  const pollRef = useRef(null);

  const refresh = () =>
    api.get(`/admin/chat/${session.id}`).then(({ data }) => {
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
    const tick = () => setRemaining(Math.max(0, Math.floor((new Date(current.endsAt).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [current]);

  const start = async () => {
    await api.post(`/admin/chat/${session.id}/start`);
    refresh();
  };

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post(`/admin/chat/${session.id}/messages`, { content });
      setContent('');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const close = async () => {
    await api.post(`/admin/chat/${session.id}/close`);
    onClose();
  };

  const minutes = remaining !== null ? Math.floor(remaining / 60) : null;
  const seconds = remaining !== null ? remaining % 60 : null;

  return (
    <div className="qlc-modal-overlay" onClick={onClose}>
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>
            Chat con {current.client?.firstName} {current.client?.lastName}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {current?.status !== 'CLOSED' && (
              <button className="qlc-btn ghost" onClick={close}>
                Cerrar sesión
              </button>
            )}
            <button className="qlc-btn ghost" onClick={onClose}>
              Salir
            </button>
          </div>
        </div>

        {current?.status === 'SCHEDULED' && (
          <div style={{ marginTop: 16 }}>
            <button className="qlc-btn primary" onClick={start}>
              Iniciar chat ({current.durationMinutes} min)
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
                    <strong>{m.senderUserId === user.id ? 'Tú (admin)' : 'Cliente'}:</strong> {m.content}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input className="qlc-input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escribe un mensaje…" />
              <button className="qlc-btn primary">Enviar</button>
            </form>
          </>
        )}

        {current?.status === 'CLOSED' && <div className="qlc-empty" style={{ marginTop: 20 }}>Esta sesión de chat ha finalizado.</div>}
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const load = () => {
    api.get('/admin/support-cases').then(({ data }) => setCases(data.cases));
    api.get('/admin/chat-sessions').then(({ data }) => setSessions(data.sessions));
  };
  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/support-cases/${id}`, { status });
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">SOPORTE</div>
      <h1 style={{ marginTop: 0 }}>Casos de soporte y chat</h1>

      {sessions.length > 0 && (
        <div className="qlc-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Sesiones de chat activas ({sessions.length})</h3>
          {sessions.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <span>
                {s.client?.firstName} {s.client?.lastName} — <span className="qlc-badge warn">{s.status}</span>
              </span>
              <button className="qlc-btn primary" onClick={() => setActiveChat(s)}>
                Abrir chat
              </button>
            </div>
          ))}
        </div>
      )}

      {cases.length === 0 ? (
        <div className="qlc-empty">No hay casos de soporte.</div>
      ) : (
        cases.map((c) => (
          <div className="qlc-card" key={c.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{c.subject}</strong>
              <span className="qlc-badge warn">{c.status}</span>
            </div>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{c.message}</p>
            <div style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginBottom: 8 }}>
              {c.client?.firstName} {c.client?.lastName}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {c.status !== 'IN_PROGRESS' && (
                <button className="qlc-btn ghost" onClick={() => updateStatus(c.id, 'IN_PROGRESS')}>
                  En progreso
                </button>
              )}
              {c.status !== 'CLOSED' && (
                <button className="qlc-btn ghost" onClick={() => updateStatus(c.id, 'CLOSED')}>
                  Cerrar caso
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {activeChat && (
        <ChatPanel
          session={activeChat}
          onClose={() => {
            setActiveChat(null);
            load();
          }}
        />
      )}
    </div>
  );
}

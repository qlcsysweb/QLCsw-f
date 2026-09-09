import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_CASE_STATUS, CHAT_SESSION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

function ChatPanel({ session, onClose }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
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
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
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
      alert(translateBackendMessage(err.message, language));
    }
  };

  const close = async () => {
    await api.post(`/admin/chat/${session.id}/close`);
    onClose();
  };

  const minutes = remaining !== null ? Math.floor(remaining / 60) : null;
  const seconds = remaining !== null ? remaining % 60 : null;

  return (
    <div className="qlc-modal-overlay">
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>
            {t('adminSupport.chatWith')} {current.client?.firstName} {current.client?.lastName}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {current?.status !== 'CLOSED' && (
              <button className="qlc-btn ghost" onClick={close}>
                {t('adminSupport.closeSession')}
              </button>
            )}
            <button className="qlc-btn ghost" onClick={onClose}>
              {t('adminSupport.exit')}
            </button>
          </div>
        </div>

        {current?.status === 'SCHEDULED' && (
          <div style={{ marginTop: 16 }}>
            <button className="qlc-btn primary" onClick={start}>
              {t('adminSupport.startChat')} ({current.durationMinutes} min)
            </button>
          </div>
        )}

        {current?.status === 'ACTIVE' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--qlc-gold)', margin: '10px 0' }}>
              {t('adminSupport.timeRemaining')}: {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--qlc-line)', borderRadius: 10, padding: 10 }}>
              {messages.length === 0 ? (
                <div className="qlc-empty">{t('adminSupport.noMessages')}</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ marginBottom: 8, fontSize: 13 }}>
                    <strong>{m.senderUserId === user.id ? t('adminSupport.youAdmin') : t('adminSupport.client')}:</strong> {m.content}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="qlc-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('adminSupport.messagePlaceholder')}
              />
              <button className="qlc-btn primary">{t('adminSupport.send')}</button>
            </form>
          </>
        )}

        {current?.status === 'CLOSED' && (
          <div className="qlc-empty" style={{ marginTop: 20 }}>
            {t('adminSupport.chatEnded')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupportPage() {
  const { t } = useLanguage();
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const supportCaseStatusMap = SUPPORT_CASE_STATUS(t);
  const chatSessionStatusMap = CHAT_SESSION_STATUS(t);

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
      <div className="qlc-kicker">{t('adminSupport.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminSupport.title')}</h1>

      {sessions.length > 0 && (
        <div className="qlc-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>
            {t('adminSupport.activeSessions')} ({sessions.length})
          </h3>
          {sessions.map((s) => {
            const sStatus = statusOf(chatSessionStatusMap, s.status);
            return (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span>
                  {s.client?.firstName} {s.client?.lastName} —{' '}
                  <span className={`qlc-badge ${sStatus.className}`}>{sStatus.text}</span>
                </span>
                <button className="qlc-btn primary" onClick={() => setActiveChat(s)}>
                  {t('adminSupport.openChat')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {cases.length === 0 ? (
        <div className="qlc-empty">{t('adminSupport.noCases')}</div>
      ) : (
        cases.map((c) => {
          const cStatus = statusOf(supportCaseStatusMap, c.status);
          return (
            <div className="qlc-card" key={c.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{c.subject}</strong>
                <span className={`qlc-badge ${cStatus.className}`}>{cStatus.text}</span>
              </div>
              <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{c.message}</p>
              <div style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginBottom: 8 }}>
                {c.client?.firstName} {c.client?.lastName}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {c.status !== 'IN_PROGRESS' && (
                  <button className="qlc-btn ghost" onClick={() => updateStatus(c.id, 'IN_PROGRESS')}>
                    {t('adminSupport.inProgress')}
                  </button>
                )}
                {c.status !== 'CLOSED' && (
                  <button className="qlc-btn ghost" onClick={() => updateStatus(c.id, 'CLOSED')}>
                    {t('adminSupport.closeCase')}
                  </button>
                )}
              </div>
            </div>
          );
        })
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

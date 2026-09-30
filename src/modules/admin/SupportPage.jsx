import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_CASE_STATUS, CHAT_SESSION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';
import CaseMessagesModal, { CaseMessagesButton } from '../../components/CaseMessagesModal';
import { formatCdmxDateTime } from '../../utils/cdmxTime';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { ChatMessages, ChatFileButton, chatOpensAt, chatOpensLabel } from '../../components/ChatParts';

function ChatPanel({ session, onClose }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [current, setCurrent] = useState(session);
  const [remaining, setRemaining] = useState(null);
  const [sendError, setSendError] = useState('');
  const [viewingPdf, setViewingPdf] = useState(false);

  const refresh = () =>
    api.get(`/admin/chat/${session.id}`).then(({ data }) => {
      setCurrent(data.session);
      setMessages(data.messages);
    });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);
  // usePolling en vez de un setInterval propio: gana el refetch al recuperar
  // foco/visibilidad.
  usePolling(refresh, 4000);

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

  // Solo a partir de la hora de la cita (UTC); el servidor también lo exige.
  const opensAt = chatOpensAt(current);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (current?.status !== 'SCHEDULED' || !opensAt || Date.now() >= opensAt.getTime()) return;
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, [current?.status, opensAt?.getTime()]);
  const tooEarly = Boolean(opensAt) && now < opensAt.getTime();

  const start = async () => {
    setSendError('');
    try {
      await api.post(`/admin/chat/${session.id}/start`);
      refresh();
    } catch (err) {
      setSendError(translateBackendMessage(err.message, language));
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSendError('');
    try {
      await api.post(`/admin/chat/${session.id}/messages`, { content });
      setContent('');
      refresh();
    } catch (err) {
      setSendError(translateBackendMessage(err.message, language));
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
            {current.appointment?.supportCase && (
              <span style={{ fontSize: 13, color: 'var(--qlc-muted2)', fontWeight: 400 }}>
                {' '}· {t('adminSupport.caseNumber')}#{current.appointment.supportCase.caseNumber}
              </span>
            )}
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
            {tooEarly && (
              <p style={{ fontSize: 13, color: 'var(--qlc-gold)', marginTop: 0 }}>
                {t('chatFiles.opensAt').replace('{time}', chatOpensLabel(current, t, { mexico: true }))}
              </p>
            )}
            <button className="qlc-btn primary" onClick={start} disabled={tooEarly}>
              {t('adminSupport.startChat')} ({current.durationMinutes} min)
            </button>
            {sendError && <div className="qlc-field-error" style={{ marginTop: 8 }}>{sendError}</div>}
          </div>
        )}

        {current?.status === 'ACTIVE' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--qlc-gold)', margin: '10px 0' }}>
              {t('adminSupport.timeRemaining')}: {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--qlc-line)', borderRadius: 10, padding: 10 }}>
              <ChatMessages
                messages={messages}
                currentUserId={user.id}
                youLabel={t('adminSupport.youAdmin')}
                otherLabel={t('adminSupport.client')}
                apiBase="/admin"
                sessionId={session.id}
                emptyLabel={t('adminSupport.noMessages')}
              />
            </div>
            {sendError && <div className="qlc-field-error" style={{ marginTop: 8 }}>{sendError}</div>}
            <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <ChatFileButton apiBase="/admin" sessionId={session.id} onSent={refresh} onError={setSendError} />
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

        {/* Sesión cerrada: queda archivada con toda la conversación y sus
            archivos (solo lectura) + PDF. */}
        {current?.status === 'CLOSED' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '12px 0 8px' }}>
              <span className="qlc-badge muted">{t('adminSupport.chatEnded')}</span>
              <button type="button" className="qlc-btn ghost" onClick={() => setViewingPdf(true)}>
                {t('adminSupport.downloadPdf')}
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--qlc-line)', borderRadius: 10, padding: 10 }}>
              <ChatMessages
                messages={messages}
                currentUserId={user.id}
                youLabel={t('adminSupport.youAdmin')}
                otherLabel={t('adminSupport.client')}
                apiBase="/admin"
                sessionId={session.id}
                emptyLabel={t('adminSupport.noMessages')}
              />
            </div>
          </>
        )}
        {viewingPdf && (
          <DocumentViewerModal url={`/admin/chat/${session.id}/pdf`} fileName={`chat-${session.id}.pdf`} onClose={() => setViewingPdf(false)} />
        )}
      </div>
    </div>
  );
}

// ARCHIVO DE SESIONES CERRADAS — cada chat finalizado queda guardado; se
// busca por N.º de caso y se abre en solo lectura (con sus archivos y PDF).
function ClosedSessionsArchive({ onOpen }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState(null);
  const [searched, setSearched] = useState('');

  const search = (caseNumber = '') => {
    const params = caseNumber ? { caseNumber } : {};
    api.get('/admin/chat-sessions/closed', { params }).then(({ data }) => {
      setSessions(data.sessions);
      setSearched(caseNumber);
    });
  };
  useEffect(() => search(''), []);

  return (
    <div className="qlc-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>{t('adminSupport.closedArchiveTitle')}</h3>
      <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 0 }}>{t('adminSupport.closedArchiveIntro')}</p>
      <form
        className="qlc-archive-search"
        onSubmit={(e) => {
          e.preventDefault();
          search(query.trim().replace(/^#/, ''));
        }}
      >
        <input
          className="qlc-input"
          inputMode="numeric"
          value={query}
          onChange={(e) => setQuery(e.target.value.replace(/[^\d#]/g, ''))}
          placeholder={t('adminSupport.searchByCase')}
          aria-label={t('adminSupport.searchByCase')}
        />
        <button className="qlc-btn primary">{t('adminSupport.search')}</button>
        {searched && (
          <button
            type="button"
            className="qlc-btn ghost"
            onClick={() => {
              setQuery('');
              search('');
            }}
          >
            {t('adminSupport.clearSearch')}
          </button>
        )}
      </form>
      {sessions === null ? (
        <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('common.loading')}</p>
      ) : sessions.length === 0 ? (
        <div className="qlc-empty">{searched ? t('adminSupport.noClosedForCase').replace('{number}', searched) : t('adminSupport.noClosedSessions')}</div>
      ) : (
        <ul className="qlc-plain-list">
          {sessions.map((s) => (
            <li key={s.id} className="qlc-archive-item">
              <span>
                {s.appointment?.supportCase ? (
                  <strong>
                    {t('adminSupport.caseNumber')}#{s.appointment.supportCase.caseNumber}
                  </strong>
                ) : (
                  <strong>—</strong>
                )}{' '}
                · {s.client?.firstName} {s.client?.lastName}
                <span style={{ color: 'var(--qlc-muted2)', fontSize: 12 }}>
                  {' '}· {s.startedAt ? formatCdmxDateTime(s.startedAt) : t('adminSupport.notStarted')} · {s._count?.messages ?? 0}{' '}
                  {t('adminSupport.messagesCount')}
                </span>
              </span>
              <button className="qlc-btn ghost" onClick={() => onOpen(s)}>
                {t('adminSupport.openChat')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  // Caso cuya mensajería interna está abierta en el modal.
  const [openCaseId, setOpenCaseId] = useState(null);

  const supportCaseStatusMap = SUPPORT_CASE_STATUS(t);
  const chatSessionStatusMap = CHAT_SESSION_STATUS(t);

  const load = () => {
    api.get('/admin/support-cases').then(({ data }) => setCases(data.cases));
    api.get('/admin/chat-sessions').then(({ data }) => setSessions(data.sessions));
  };
  useEffect(() => {
    load();
  }, []);
  // Actualización sin refresh manual: casos/citas nuevos del cliente
  // aparecen solos (el chat abierto ya se refresca aparte, cada 4s).
  usePolling(load, 8000);

  // CORREGIR(2).xlsx ADMIN 28 — "Entrar al chat" desde una cita autorizada
  // llega aquí con ?chat=<sessionId>; se abre automáticamente.
  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (!chatId || sessions.length === 0) return;
    const target = sessions.find((s) => s.id === chatId);
    if (target) {
      setActiveChat(target);
      searchParams.delete('chat');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // Acceso directo desde una notificación (nuevo caso / nuevo mensaje):
  // llega aquí con ?case=<caseId> y expande ese caso automáticamente.
  useEffect(() => {
    const caseId = searchParams.get('case');
    if (!caseId || cases.length === 0) return;
    const target = cases.find((c) => c.id === caseId);
    if (target) {
      setOpenCaseId(target.id);
      searchParams.delete('case');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases]);

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

      <ClosedSessionsArchive onOpen={setActiveChat} />

      {cases.length === 0 ? (
        <div className="qlc-empty">{t('adminSupport.noCases')}</div>
      ) : (
        cases.map((c) => {
          const cStatus = statusOf(supportCaseStatusMap, c.status);
          return (
            <div className="qlc-card" key={c.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>
                  <span style={{ color: 'var(--qlc-muted2)', fontWeight: 400 }}>
                    {t('adminSupport.caseNumber')}#{c.caseNumber}
                  </span>{' '}
                  {c.subject}
                </strong>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {c.clientHiddenAt && <span className="qlc-badge muted">{t('adminSupport.hiddenByClient')}</span>}
                  <span className={`qlc-badge ${cStatus.className}`}>{cStatus.text}</span>
                </span>
              </div>
              <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{c.message}</p>
              <div style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginBottom: 8 }}>
                {c.client?.firstName} {c.client?.lastName}
              </div>
              <div className="qlc-case-actions">
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
                <CaseMessagesButton hasUnread={c.hasUnread} unreadCount={c.unreadMessages} onClick={() => setOpenCaseId(c.id)} />
              </div>
            </div>
          );
        })
      )}

      {openCaseId && cases.find((c) => c.id === openCaseId) && (
        <CaseMessagesModal
          apiBase="/admin"
          supportCase={cases.find((c) => c.id === openCaseId)}
          onClose={() => {
            setOpenCaseId(null);
            load();
          }}
        />
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

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_CASE_STATUS, CHAT_SESSION_STATUS, APPOINTMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatDateOnly, formatCdmxDateTime, appointmentUtcInstant } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { clientSubaccountLabel } from '../../utils/subaccountLabel';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';
import CaseMessagesModal, { CaseMessagesButton } from '../../components/CaseMessagesModal';
import ConfirmModal from '../../components/ConfirmModal';
import { ChatMessages, ChatFileButton, chatOpensAt, chatOpensLabel } from '../../components/ChatParts';

// CORRECCIÓN 16 (bloque de 20) — Soporte y Citas unificados: el cliente ya
// no navega entre dos módulos independientes. El flujo real es
// CASO → CITA (desde ese mismo caso) → CHAT, todo en una sola pantalla.

// Las citas están en UTC (igual que el backend, utils/appointmentSlots.js):
// así se calcula si la cita agendada ya llegó.
const appointmentInstant = appointmentUtcInstant;

function ChatPanel({ session, onClose }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [remaining, setRemaining] = useState(null);
  const [current, setCurrent] = useState(session);
  const [sendError, setSendError] = useState('');

  const refresh = () =>
    api.get(`/client/chat/${session.id}`).then(({ data }) => {
      setCurrent(data.session);
      setMessages(data.messages);
    });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);
  // usePolling en vez de un setInterval propio: gana el refetch al recuperar
  // foco/visibilidad (si el cliente cambia de pestaña y vuelve, no espera
  // hasta 4s para ver la respuesta del admin).
  usePolling(refresh, 4000);

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
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [current]);

  // El chat solo se puede iniciar a la hora de la cita (UTC); el servidor
  // también lo exige.
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
      await api.post(`/client/chat/${session.id}/start`);
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
      await api.post(`/client/chat/${session.id}/messages`, { content });
      setContent('');
      refresh();
    } catch (err) {
      setSendError(translateBackendMessage(err.message, language));
    }
  };

  const minutes = remaining !== null ? Math.floor(remaining / 60) : null;
  const seconds = remaining !== null ? remaining % 60 : null;

  return (
    <div className="qlc-modal-overlay">
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: 'min(520px, 82vh)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{t('clientSupport.chatTitle')}</h2>
          <button className="qlc-btn ghost" onClick={onClose}>
            {t('clientSupport.close')}
          </button>
        </div>

        {current?.status === 'SCHEDULED' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
              {t('clientSupport.appointmentAuthorized').replace('{minutes}', current.durationMinutes)}
            </p>
            {tooEarly && (
              <p style={{ fontSize: 13, color: 'var(--qlc-gold)' }}>
                {t('chatFiles.opensAt').replace('{time}', chatOpensLabel(current, t))}
              </p>
            )}
            <button className="qlc-btn primary" onClick={start} disabled={tooEarly}>
              {t('clientSupport.startChat')}
            </button>
            {sendError && <div className="qlc-field-error" style={{ marginTop: 8 }}>{sendError}</div>}
          </div>
        )}

        {current?.status === 'ACTIVE' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--qlc-gold)', margin: '10px 0' }}>
              {t('clientSupport.timeRemaining')}: {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--qlc-line)', borderRadius: 10, padding: 10 }}>
              <ChatMessages
                messages={messages}
                currentUserId={user.id}
                youLabel={t('clientSupport.you')}
                otherLabel="QLC"
                apiBase="/client"
                sessionId={session.id}
                emptyLabel={t('clientSupport.noMessages')}
              />
            </div>
            {sendError && <div className="qlc-field-error" style={{ marginTop: 8 }}>{sendError}</div>}
            <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <ChatFileButton apiBase="/client" sessionId={session.id} onSent={refresh} onError={setSendError} />
              <input
                className="qlc-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('clientSupport.messagePlaceholder')}
              />
              <button className="qlc-btn primary">{t('clientSupport.send')}</button>
            </form>
            <p className="qlc-chat-file-hint">{t('chatFiles.hint')}</p>
          </>
        )}

        {current?.status === 'CLOSED' && (
          <>
            <div className="qlc-empty" style={{ marginTop: 12 }}>
              {t('clientSupport.chatEnded')}
            </div>
            {messages.length > 0 && (
              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--qlc-line)', borderRadius: 10, padding: 10, marginTop: 10 }}>
                <ChatMessages
                  messages={messages}
                  currentUserId={user.id}
                  youLabel={t('clientSupport.you')}
                  otherLabel="QLC"
                  apiBase="/client"
                  sessionId={session.id}
                  emptyLabel=""
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SupportPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [subaccounts, setSubaccounts] = useState([]);
  const [caseForm, setCaseForm] = useState({ subject: '', message: '' });
  const [activeChat, setActiveChat] = useState(null);
  // Caso cuya mensajería interna está abierta en el modal.
  const [openCaseId, setOpenCaseId] = useState(null);
  const [openingChat, setOpeningChat] = useState(null);
  // Caso que el cliente quiere borrar de su vista (confirmación).
  const [deletingCase, setDeletingCase] = useState(null);

  // Formulario de cita — vinculado SIEMPRE a un caso del propio cliente
  // (CASO #XXXX → Solicitar cita). Se abre desde el caso (preseleccionado)
  // o desde "Solicitar cita" en Mis citas (el cliente elige entre sus casos
  // abiertos). El cliente nunca escribe un ID interno: solo ve "Caso #1042".
  const EMPTY_APPT = { caseNumber: '', apiSubaccountId: '', requestedDate: '', requestedTime: '', notes: '' };
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [apptForm, setApptForm] = useState(EMPTY_APPT);
  const apptFormRef = useRef(null);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [apptMessage, setApptMessage] = useState('');
  const [apptError, setApptError] = useState('');
  const [submittingAppt, setSubmittingAppt] = useState(false);

  const supportCaseStatusMap = SUPPORT_CASE_STATUS(t);
  const chatSessionStatusMap = CHAT_SESSION_STATUS(t);
  const appointmentStatusMap = APPOINTMENT_STATUS(t);

  const load = () => {
    api.get('/client/support-cases').then(({ data }) => setCases(data.cases));
    api.get('/client/chat-sessions').then(({ data }) => setSessions(data.sessions));
    api.get('/client/appointments').then(({ data }) => setAppointments(data.appointments));
    api.get('/client/api-subaccounts').then(({ data }) => setSubaccounts(data.subaccounts));
  };
  useEffect(load, []);
  // Actualización sin refresh manual: si el admin autoriza una cita o
  // responde un caso, se refleja solo (el chat abierto ya se refresca
  // aparte, cada 4s, en ChatPanel).
  usePolling(load, 8000);

  // CORREGIR(2).xlsx CLIENTE 28 — "Entrar al chat" desde una cita autorizada
  // llega aquí con ?chat=<sessionId>; abre ese chat automáticamente en
  // cuanto la sesión esté disponible, sin que el cliente tenga que buscarla.
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

  // Acceso directo desde una notificación (respuesta de QLC a tu caso):
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

  // Vuelve a cargar los horarios disponibles cada vez que cambia la fecha
  // elegida — el servidor es la única fuente real (anticipación mínima,
  // horarios ocupados, disponibilidad del admin).
  useEffect(() => {
    if (!apptForm.requestedDate) {
      setAvailableSlots(null);
      return;
    }
    api
      .get('/client/appointments/available-slots', { params: { date: apptForm.requestedDate } })
      .then(({ data }) => setAvailableSlots(data.slots));
  }, [apptForm.requestedDate]);

  const createCase = async (e) => {
    e.preventDefault();
    if (!caseForm.subject || !caseForm.message) return;
    await api.post('/client/support-cases', caseForm);
    setCaseForm({ subject: '', message: '' });
    load();
  };

  // Casos que admiten una cita (el backend rechaza igualmente los cerrados
  // y los que no pertenecen al cliente).
  const openCases = cases.filter((c) => c.status !== 'CLOSED');

  const openScheduling = (caseNumber = '') => {
    setSchedulingOpen(true);
    setApptForm({ ...EMPTY_APPT, caseNumber: caseNumber === '' ? '' : String(caseNumber) });
    setAvailableSlots(null);
    setApptError('');
    setOpenCaseId(null);
    requestAnimationFrame(() => apptFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    setApptError('');
    setSubmittingAppt(true);
    try {
      await api.post('/client/appointments', { ...apptForm, caseNumber: Number(apptForm.caseNumber) });
      setApptMessage(t('clientAppointments.requestSent'));
      setTimeout(() => setApptMessage(''), 3000);
      setSchedulingOpen(false);
      load();
    } catch (err) {
      setApptError(translateBackendMessage(err.message, language));
    } finally {
      setSubmittingAppt(false);
    }
  };

  // CORREGIR(2).xlsx CLIENTE 28 — botón "Entrar al chat" para una cita ya
  // autorizada: resuelve la sesión asociada y la abre directamente aquí.
  const enterChat = async (appointmentId) => {
    setOpeningChat(appointmentId);
    setApptError('');
    try {
      const { data } = await api.get(`/client/appointments/${appointmentId}/chat-session`);
      setActiveChat(data.session);
    } catch (err) {
      setApptError(translateBackendMessage(err.message, language));
    } finally {
      setOpeningChat(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="qlc-kicker">{t('clientSupport.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientSupport.title')}</h1>
      <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', maxWidth: 640 }}>{t('cdmxNotice')}</p>

      {sessions.filter((s) => s.status !== 'CLOSED').length > 0 && (
        <div className="qlc-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>{t('clientSupport.availableChat')}</h3>
          {sessions
            .filter((s) => s.status !== 'CLOSED')
            .map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span>
                  {t('clientSupport.sessionOf').replace('{minutes}', s.durationMinutes)} —{' '}
                  <span className={`qlc-badge ${statusOf(chatSessionStatusMap, s.status).className}`}>
                    {statusOf(chatSessionStatusMap, s.status).text}
                  </span>
                </span>
                <button className="qlc-btn primary" onClick={() => setActiveChat(s)}>
                  {t('clientSupport.openChat')}
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('clientSupport.myCases')} ({cases.length})
          </h3>
          {cases.length === 0 ? (
            <div className="qlc-empty">{t('clientSupport.noCases')}</div>
          ) : (
            <ul className="qlc-plain-list">
              {cases.map((c) => (
                <li key={c.id} style={{ paddingBottom: 10 }}>
                  <span style={{ color: 'var(--qlc-muted2)', fontSize: 12 }}>
                    {t('clientSupport.caseNumber')}#{c.caseNumber}
                  </span>{' '}
                  <strong>{c.subject}</strong> —{' '}
                  <span className={`qlc-badge ${statusOf(supportCaseStatusMap, c.status).className}`}>
                    {statusOf(supportCaseStatusMap, c.status).text}
                  </span>
                  <div style={{ color: 'var(--qlc-muted2)', fontSize: 12, marginBottom: 6 }}>{c.message}</div>
                  <div className="qlc-case-actions">
                    {c.status !== 'CLOSED' && (
                      <button type="button" className="qlc-btn ghost" onClick={() => openScheduling(c.caseNumber)}>
                        {t('clientAppointments.requestFromCase')}
                      </button>
                    )}
                    <CaseMessagesButton hasUnread={c.hasUnread} unreadCount={c.unreadMessages} onClick={() => setOpenCaseId(c.id)} />
                    <button
                      type="button"
                      className="qlc-btn ghost qlc-case-delete"
                      onClick={() => setDeletingCase(c)}
                      title={t('clientSupport.deleteCase')}
                      aria-label={`${t('clientSupport.deleteCase')} #${c.caseNumber}`}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
                      </svg>
                      {t('clientSupport.deleteCase')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {schedulingOpen ? (
          <form className="qlc-card" onSubmit={submitAppointment} ref={apptFormRef}>
            <h3 style={{ marginTop: 0 }}>
              {t('clientAppointments.requestTitle')}
              {apptForm.caseNumber && ` — ${t('clientSupport.caseNumber')}#${apptForm.caseNumber}`}
            </h3>
            <label className="qlc-label">{t('clientAppointments.relatedCase')}</label>
            {openCases.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('clientAppointments.noOpenCases')}</p>
            ) : (
              <select
                className="qlc-select"
                value={apptForm.caseNumber}
                onChange={(e) => setApptForm((f) => ({ ...f, caseNumber: e.target.value }))}
                required
              >
                <option value="">{t('clientAppointments.selectCase')}</option>
                {openCases.map((c) => (
                  <option key={c.id} value={String(c.caseNumber)}>
                    {t('clientSupport.caseNumber')}#{c.caseNumber} — {c.subject}
                  </option>
                ))}
              </select>
            )}
            <label className="qlc-label">{t('clientAppointments.account')}</label>
            {subaccounts.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('clientAppointments.noAccountsYet')}</p>
            ) : (
              <select
                className="qlc-select"
                value={apptForm.apiSubaccountId}
                onChange={(e) => setApptForm((f) => ({ ...f, apiSubaccountId: e.target.value }))}
                required
              >
                <option value="">{t('clientAppointments.selectAccount')}</option>
                {subaccounts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {clientSubaccountLabel(s, t)}
                  </option>
                ))}
              </select>
            )}
            <label className="qlc-label">{t('clientAppointments.date')}</label>
            <input
              type="date"
              className="qlc-input"
              min={today}
              value={apptForm.requestedDate}
              onChange={(e) => setApptForm((f) => ({ ...f, requestedDate: e.target.value, requestedTime: '' }))}
              required
            />
            <label className="qlc-label">{t('clientAppointments.time')} (UTC)</label>
            {!apptForm.requestedDate ? (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('clientAppointments.selectDateFirst')}</p>
            ) : availableSlots === null ? (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('common.loading')}</p>
            ) : availableSlots.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('clientAppointments.noSlotsForDate')}</p>
            ) : (
              <select
                className="qlc-select"
                value={apptForm.requestedTime}
                onChange={(e) => setApptForm((f) => ({ ...f, requestedTime: e.target.value }))}
                required
              >
                <option value="">{t('clientAppointments.selectTime')}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} UTC
                  </option>
                ))}
              </select>
            )}
            <label className="qlc-label">{t('clientAppointments.notes')}</label>
            <textarea className="qlc-textarea" rows={2} value={apptForm.notes} onChange={(e) => setApptForm((f) => ({ ...f, notes: e.target.value }))} />
            {apptError && <div className="qlc-field-error">{apptError}</div>}
            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={() => setSchedulingOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="qlc-btn primary" disabled={submittingAppt || !apptForm.caseNumber || !apptForm.requestedTime || subaccounts.length === 0}>
                {submittingAppt ? t('common.sending') : t('clientAppointments.request')}
              </button>
            </div>
          </form>
        ) : (
          <form className="qlc-card" onSubmit={createCase}>
            <h3 style={{ marginTop: 0 }}>{t('clientSupport.newCase')}</h3>
            <label className="qlc-label">{t('clientSupport.subject')}</label>
            <input className="qlc-input" value={caseForm.subject} onChange={(e) => setCaseForm((f) => ({ ...f, subject: e.target.value }))} required />
            <label className="qlc-label">{t('clientSupport.message')}</label>
            <textarea className="qlc-textarea" rows={4} value={caseForm.message} onChange={(e) => setCaseForm((f) => ({ ...f, message: e.target.value }))} required />
            <div className="qlc-form-actions">
              <button className="qlc-btn primary">{t('clientSupport.createCase')}</button>
            </div>
          </form>
        )}
      </div>

      <div className="qlc-card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{t('clientAppointments.myAppointments')}</h3>
          <button type="button" className="qlc-btn ghost" onClick={() => openScheduling()} disabled={openCases.length === 0} title={openCases.length === 0 ? t('clientAppointments.noOpenCases') : ''}>
            {t('clientAppointments.newAppointment')}
          </button>
        </div>
        {apptMessage && <div style={{ color: 'var(--qlc-ok)', fontSize: 12, marginBottom: 10 }}>{apptMessage}</div>}
        {appointments.length === 0 ? (
          <div className="qlc-empty">{t('clientAppointments.noAppointments')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {appointments.map((a) => {
              const instant = appointmentInstant(a.requestedDate, a.requestedTime);
              const chatWindowOpen = a.status === 'AUTORIZADA' && Date.now() >= instant.getTime();
              return (
                <li key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span>
                      {formatDateOnly(a.requestedDate)} · {a.requestedTime} UTC
                      {a.supportCase && (
                        <span style={{ color: 'var(--qlc-muted2)' }}>
                          {' '}· {t('clientAppointments.relatedCase')}:{' '}
                          <button type="button" className="qlc-link-btn" onClick={() => setOpenCaseId(a.supportCase.id)}>
                            {t('clientSupport.caseNumber')}#{a.supportCase.caseNumber}
                          </button>
                        </span>
                      )}
                      {a.apiSubaccount && (
                        <span style={{ color: 'var(--qlc-muted2)' }}>
                          {' '}· {clientSubaccountLabel(a.apiSubaccount, t)}
                        </span>
                      )}
                    </span>
                    <span className={`qlc-badge ${statusOf(appointmentStatusMap, a.status).className}`}>
                      {statusOf(appointmentStatusMap, a.status).text}
                    </span>
                  </div>
                  {a.status === 'AUTORIZADA' && (
                    <button
                      className={`qlc-btn ${chatWindowOpen ? 'primary' : 'danger'}`}
                      style={{ width: 'fit-content' }}
                      disabled={openingChat === a.id || !chatWindowOpen}
                      onClick={() => enterChat(a.id)}
                      title={chatWindowOpen ? '' : t('clientAppointments.chatNotYetAvailable')}
                    >
                      {openingChat === a.id ? t('common.loading') : chatWindowOpen ? t('clientAppointments.enterChat') : t('clientAppointments.chatScheduledFor').replace('{time}', `${a.requestedTime} UTC`)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {deletingCase && (
        <ConfirmModal
          title={t('clientSupport.deleteCaseTitle')}
          message={t('clientSupport.deleteCaseMessage').replace('{number}', deletingCase.caseNumber)}
          confirmLabel={t('clientSupport.deleteCase')}
          onClose={() => setDeletingCase(null)}
          onConfirm={async () => {
            await api.delete(`/client/support-cases/${deletingCase.id}`);
            load();
          }}
        />
      )}

      {openCaseId && cases.find((c) => c.id === openCaseId) && (
        <CaseMessagesModal
          apiBase="/client"
          supportCase={cases.find((c) => c.id === openCaseId)}
          onRequestAppointment={
            cases.find((c) => c.id === openCaseId).status !== 'CLOSED'
              ? () => openScheduling(cases.find((c) => c.id === openCaseId).caseNumber)
              : undefined
          }
          onClose={() => {
            setOpenCaseId(null);
            load();
          }}
        />
      )}
      {activeChat && <ChatPanel session={activeChat} onClose={() => { setActiveChat(null); load(); }} />}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_CASE_STATUS, CHAT_SESSION_STATUS, APPOINTMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatDateOnly, formatCdmxDateTime } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';
import CaseMessagesModal, { CaseMessagesButton } from '../../components/CaseMessagesModal';

// CORRECCIÓN 16 (bloque de 20) — Soporte y Citas unificados: el cliente ya
// no navega entre dos módulos independientes. El flujo real es
// CASO → CITA (desde ese mismo caso) → CHAT, todo en una sola pantalla.

// Misma zona horaria/offset fijo que usa el backend (utils/appointmentSlots.js)
// para calcular si la cita agendada ya llegó — CDMX no observa horario de
// verano desde 2022, por eso el offset fijo "-06:00" es seguro aquí.
function appointmentInstant(requestedDate, requestedTime) {
  const dateOnly = String(requestedDate).slice(0, 10);
  return new Date(`${dateOnly}T${requestedTime}:00-06:00`);
}

function ChatPanel({ session, onClose }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [remaining, setRemaining] = useState(null);
  const [current, setCurrent] = useState(session);
  const [sendError, setSendError] = useState('');
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
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [current]);

  const start = async () => {
    await api.post(`/client/chat/${session.id}/start`);
    refresh();
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
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
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
            <button className="qlc-btn primary" onClick={start}>
              {t('clientSupport.startChat')}
            </button>
          </div>
        )}

        {current?.status === 'ACTIVE' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--qlc-gold)', margin: '10px 0' }}>
              {t('clientSupport.timeRemaining')}: {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--qlc-line)', borderRadius: 10, padding: 10 }}>
              {messages.length === 0 ? (
                <div className="qlc-empty">{t('clientSupport.noMessages')}</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ marginBottom: 8, fontSize: 13 }}>
                    <strong>{m.senderUserId === user.id ? t('clientSupport.you') : 'QLC'}:</strong> {m.content}
                  </div>
                ))
              )}
            </div>
            {sendError && <div className="qlc-field-error" style={{ marginTop: 8 }}>{sendError}</div>}
            <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="qlc-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('clientSupport.messagePlaceholder')}
              />
              <button className="qlc-btn primary">{t('clientSupport.send')}</button>
            </form>
          </>
        )}

        {current?.status === 'CLOSED' && (
          <div className="qlc-empty" style={{ marginTop: 20 }}>
            {t('clientSupport.chatEnded')}
          </div>
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

  // Formulario de cita — se abre desde un caso específico.
  const [schedulingCaseNumber, setSchedulingCaseNumber] = useState(null);
  const [apptForm, setApptForm] = useState({ apiSubaccountId: '', requestedDate: '', requestedTime: '', notes: '' });
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

  const openScheduling = (caseNumber) => {
    setSchedulingCaseNumber(caseNumber);
    setApptForm({ apiSubaccountId: '', requestedDate: '', requestedTime: '', notes: '' });
    setAvailableSlots(null);
    setApptError('');
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    setApptError('');
    setSubmittingAppt(true);
    try {
      await api.post('/client/appointments', { ...apptForm, caseNumber: schedulingCaseNumber });
      setApptMessage(t('clientAppointments.requestSent'));
      setTimeout(() => setApptMessage(''), 3000);
      setSchedulingCaseNumber(null);
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
                    <button type="button" className="qlc-btn ghost" onClick={() => openScheduling(c.caseNumber)}>
                      {t('clientAppointments.requestFromCase')}
                    </button>
                    <CaseMessagesButton hasUnread={c.hasUnread} unreadCount={c.unreadMessages} onClick={() => setOpenCaseId(c.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {schedulingCaseNumber != null ? (
          <form className="qlc-card" onSubmit={submitAppointment}>
            <h3 style={{ marginTop: 0 }}>
              {t('clientAppointments.requestTitle')} — #{schedulingCaseNumber}
            </h3>
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
                    {s.isPrincipal ? t('clientSubaccounts.principalLabel') : s.identifier || t('clientSubaccounts.unassignedIdentifier')}
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
            <label className="qlc-label">{t('clientAppointments.time')}</label>
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
                    {slot}
                  </option>
                ))}
              </select>
            )}
            <label className="qlc-label">{t('clientAppointments.notes')}</label>
            <textarea className="qlc-textarea" rows={2} value={apptForm.notes} onChange={(e) => setApptForm((f) => ({ ...f, notes: e.target.value }))} />
            {apptError && <div className="qlc-field-error">{apptError}</div>}
            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={() => setSchedulingCaseNumber(null)}>
                {t('common.cancel')}
              </button>
              <button className="qlc-btn primary" disabled={submittingAppt || !apptForm.requestedTime || subaccounts.length === 0}>
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
        <h3 style={{ marginTop: 0 }}>{t('clientAppointments.myAppointments')}</h3>
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
                      {formatDateOnly(a.requestedDate)} · {a.requestedTime}
                      {a.supportCase && <span style={{ color: 'var(--qlc-muted2)' }}> · #{a.supportCase.caseNumber}</span>}
                      {a.apiSubaccount && (
                        <span style={{ color: 'var(--qlc-muted2)' }}>
                          {' '}· {a.apiSubaccount.isPrincipal ? t('clientSubaccounts.principalLabel') : a.apiSubaccount.identifier}
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
                      {openingChat === a.id ? t('common.loading') : chatWindowOpen ? t('clientAppointments.enterChat') : t('clientAppointments.chatScheduledFor').replace('{time}', a.requestedTime)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {openCaseId && cases.find((c) => c.id === openCaseId) && (
        <CaseMessagesModal
          apiBase="/client"
          supportCase={cases.find((c) => c.id === openCaseId)}
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

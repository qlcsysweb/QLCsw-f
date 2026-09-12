import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { APPOINTMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function AppointmentsPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [availability, setAvailability] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [cases, setCases] = useState([]);
  const [subaccounts, setSubaccounts] = useState([]);
  const [form, setForm] = useState({ caseNumber: '', apiSubaccountId: '', requestedDate: '', requestedTime: '', notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openingChat, setOpeningChat] = useState(null);

  const DAY_LABELS = [
    t('days.sunday'),
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
  ];
  const appointmentStatusMap = APPOINTMENT_STATUS(t);

  const load = () => {
    api.get('/client/availability').then(({ data }) => setAvailability(data.slots));
    api.get('/client/appointments').then(({ data }) => setAppointments(data.appointments));
    // CORREGIR(2).xlsx CLIENTE 25/26 — la cita exige un número de caso ya
    // generado previamente (ver Soporte → Nuevo caso) Y la cuenta/subcuenta
    // que se va a revisar.
    api.get('/client/support-cases').then(({ data }) => setCases(data.cases));
    api.get('/client/api-subaccounts').then(({ data }) => setSubaccounts(data.subaccounts));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/client/appointments', form);
      setMessage(t('clientAppointments.requestSent'));
      setTimeout(() => setMessage(''), 3000);
      setForm({ caseNumber: '', apiSubaccountId: '', requestedDate: '', requestedTime: '', notes: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  // CORREGIR(2).xlsx CLIENTE 28 — botón "Entrar al chat" para una cita ya
  // autorizada: resuelve la sesión asociada y abre el chat en Soporte.
  const enterChat = async (appointmentId) => {
    setOpeningChat(appointmentId);
    setError('');
    try {
      const { data } = await api.get(`/client/appointments/${appointmentId}/chat-session`);
      navigate(`/client/support?chat=${data.session.id}`);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setOpeningChat(null);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientAppointments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientAppointments.title')}</h1>

      <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', maxWidth: 640 }}>{t('cdmxNotice')}</p>

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientAppointments.availability')}</h3>
          {availability.length === 0 ? (
            <div className="qlc-empty">{t('clientAppointments.noSlots')}</div>
          ) : (
            <ul className="qlc-plain-list">
              {availability.map((s) => (
                <li key={s.id}>
                  {DAY_LABELS[s.dayOfWeek]}: {s.startTime} - {s.endTime}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="qlc-card" onSubmit={submit}>
          <h3 style={{ marginTop: 0 }}>{t('clientAppointments.requestTitle')}</h3>
          <label className="qlc-label">{t('clientAppointments.caseNumber')}</label>
          {cases.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('clientAppointments.noCasesYet')}</p>
          ) : (
            <select
              className="qlc-select"
              value={form.caseNumber}
              onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
              required
            >
              <option value="">{t('clientAppointments.selectCase')}</option>
              {cases.map((c) => (
                <option key={c.id} value={c.caseNumber}>
                  #{c.caseNumber} — {c.subject}
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
              value={form.apiSubaccountId}
              onChange={(e) => setForm((f) => ({ ...f, apiSubaccountId: e.target.value }))}
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
            value={form.requestedDate}
            onChange={(e) => setForm((f) => ({ ...f, requestedDate: e.target.value }))}
            required
          />
          <label className="qlc-label">{t('clientAppointments.time')}</label>
          <input
            type="time"
            className="qlc-input"
            value={form.requestedTime}
            onChange={(e) => setForm((f) => ({ ...f, requestedTime: e.target.value }))}
            required
          />
          <label className="qlc-label">{t('clientAppointments.notes')}</label>
          <textarea className="qlc-textarea" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <div className="qlc-field-error">{error}</div>}
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary" disabled={cases.length === 0 || subaccounts.length === 0}>
              {t('clientAppointments.request')}
            </button>
          </div>
        </form>
      </div>

      <div className="qlc-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>{t('clientAppointments.myAppointments')}</h3>
        {appointments.length === 0 ? (
          <div className="qlc-empty">{t('clientAppointments.noAppointments')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {appointments.map((a) => (
              <li key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span>
                    {formatCdmxDate(a.requestedDate)} · {a.requestedTime}
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
                  <button className="qlc-btn primary" style={{ width: 'fit-content' }} disabled={openingChat === a.id} onClick={() => enterChat(a.id)}>
                    {openingChat === a.id ? t('common.loading') : t('clientAppointments.enterChat')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

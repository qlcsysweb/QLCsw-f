import { useEffect, useState } from 'react';
import api from '../../services/api';
import { APPOINTMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function AppointmentsPage() {
  const { t, language } = useLanguage();
  const [availability, setAvailability] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ requestedDate: '', requestedTime: '', notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/client/appointments', form);
      setMessage(t('clientAppointments.requestSent'));
      setTimeout(() => setMessage(''), 3000);
      setForm({ requestedDate: '', requestedTime: '', notes: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientAppointments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientAppointments.title')}</h1>

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
            <button className="qlc-btn primary">{t('clientAppointments.request')}</button>
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
              <li key={a.id}>
                {new Date(a.requestedDate).toLocaleDateString()} · {a.requestedTime} —{' '}
                <span className={`qlc-badge ${statusOf(appointmentStatusMap, a.status).className}`}>
                  {statusOf(appointmentStatusMap, a.status).text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

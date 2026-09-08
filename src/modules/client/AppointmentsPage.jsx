import { useEffect, useState } from 'react';
import api from '../../services/api';
import { APPOINTMENT_STATUS, statusOf } from '../../utils/statusLabels';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AppointmentsPage() {
  const [availability, setAvailability] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ requestedDate: '', requestedTime: '', notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      setMessage('Solicitud de cita enviada.');
      setTimeout(() => setMessage(''), 3000);
      setForm({ requestedDate: '', requestedTime: '', notes: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">CITAS</div>
      <h1 style={{ marginTop: 0 }}>Citas</h1>

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Disponibilidad</h3>
          {availability.length === 0 ? (
            <div className="qlc-empty">Sin horarios configurados.</div>
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
          <h3 style={{ marginTop: 0 }}>Solicitar cita</h3>
          <label className="qlc-label">Fecha</label>
          <input
            type="date"
            className="qlc-input"
            value={form.requestedDate}
            onChange={(e) => setForm((f) => ({ ...f, requestedDate: e.target.value }))}
            required
          />
          <label className="qlc-label">Hora</label>
          <input
            type="time"
            className="qlc-input"
            value={form.requestedTime}
            onChange={(e) => setForm((f) => ({ ...f, requestedTime: e.target.value }))}
            required
          />
          <label className="qlc-label">Notas (opcional)</label>
          <textarea className="qlc-textarea" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <div className="qlc-field-error">{error}</div>}
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary">Solicitar</button>
          </div>
        </form>
      </div>

      <div className="qlc-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Mis citas</h3>
        {appointments.length === 0 ? (
          <div className="qlc-empty">Sin citas solicitadas.</div>
        ) : (
          <ul className="qlc-plain-list">
            {appointments.map((a) => (
              <li key={a.id}>
                {new Date(a.requestedDate).toLocaleDateString()} · {a.requestedTime} —{' '}
                <span className={`qlc-badge ${statusOf(APPOINTMENT_STATUS, a.status).className}`}>
                  {statusOf(APPOINTMENT_STATUS, a.status).text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function AvailabilityEditor() {
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/availability').then(({ data }) => setSlots(data.slots));
  useEffect(() => {
    load();
  }, []);

  const toggleDay = (dayOfWeek) => {
    setSlots((prev) => {
      const exists = prev.find((s) => s.dayOfWeek === dayOfWeek);
      if (exists) return prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      return [...prev, { dayOfWeek, startTime: '09:00', endTime: '17:00', isActive: true }];
    });
  };

  const updateTime = (dayOfWeek, field, value) => {
    setSlots((prev) => prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/availability', { slots });
      setMessage('Disponibilidad actualizada.');
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Disponibilidad semanal</h3>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>
        Define los días y horarios en los que los clientes y prospectos pueden solicitar citas.
      </p>
      {DAY_LABELS.map((label, dayOfWeek) => {
        const slot = slots.find((s) => s.dayOfWeek === dayOfWeek);
        return (
          <div
            key={dayOfWeek}
            style={{ display: 'grid', gridTemplateColumns: '140px auto 1fr 1fr', gap: 10, alignItems: 'center', padding: '8px 0' }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={Boolean(slot)} onChange={() => toggleDay(dayOfWeek)} />
              {label}
            </label>
            {slot ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>de</span>
                <input
                  className="qlc-input"
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateTime(dayOfWeek, 'startTime', e.target.value)}
                />
                <input
                  className="qlc-input"
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateTime(dayOfWeek, 'endTime', e.target.value)}
                />
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--qlc-muted2)', gridColumn: 'span 3' }}>No disponible</span>
            )}
          </div>
        );
      })}
      <div className="qlc-form-actions">
        {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
        <button className="qlc-btn primary" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar disponibilidad'}
        </button>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [confirmReject, setConfirmReject] = useState(null);

  const load = () => api.get('/admin/appointments').then(({ data }) => setAppointments(data.appointments));
  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/appointments/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">CITAS</div>
      <h1 style={{ marginTop: 0 }}>Citas y disponibilidad</h1>

      <AvailabilityEditor />

      <h3>Solicitudes de cita</h3>
      {appointments.length === 0 ? (
        <div className="qlc-empty">No hay citas registradas.</div>
      ) : (
        <div className="qlc-table-wrap">
          <table className="qlc-table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.client
                      ? `${a.client.firstName} ${a.client.lastName}`
                      : `${a.prospect?.firstName || ''} ${a.prospect?.lastName || ''} (prospecto)`}
                  </td>
                  <td>{new Date(a.requestedDate).toLocaleDateString()}</td>
                  <td>{a.requestedTime}</td>
                  <td>
                    <span className="qlc-badge warn">{a.status}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {a.status === 'PENDING' && (
                      <>
                        <button className="qlc-btn ghost" onClick={() => updateStatus(a.id, 'AUTORIZADA')}>
                          Autorizar
                        </button>
                        <button className="qlc-btn ghost" onClick={() => setConfirmReject(a)}>
                          Rechazar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmReject && (
        <ConfirmModal
          title="¿Rechazar esta cita?"
          message="El solicitante verá su cita marcada como rechazada."
          confirmLabel="Rechazar"
          onClose={() => setConfirmReject(null)}
          onConfirm={() => updateStatus(confirmReject.id, 'RECHAZADA')}
        />
      )}
    </div>
  );
}

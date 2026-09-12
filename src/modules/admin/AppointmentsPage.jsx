import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { APPOINTMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';

function AvailabilityEditor() {
  const { t } = useLanguage();
  const DAY_LABELS = [
    t('days.sunday'),
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
  ];
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
      setMessage(t('adminAppointments.availabilityUpdated'));
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>{t('adminAppointments.weeklyAvailability')}</h3>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{t('adminAppointments.availabilityIntro')}</p>
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
                <span style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminAppointments.from')}</span>
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
              <span style={{ fontSize: 12, color: 'var(--qlc-muted2)', gridColumn: 'span 3' }}>
                {t('adminAppointments.notAvailable')}
              </span>
            )}
          </div>
        );
      })}
      <div className="qlc-form-actions">
        {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
        <button className="qlc-btn primary" onClick={save} disabled={saving}>
          {saving ? t('common.saving') : t('adminAppointments.saveAvailability')}
        </button>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [confirmReject, setConfirmReject] = useState(null);
  const [openingChat, setOpeningChat] = useState(null);

  const appointmentStatusMap = APPOINTMENT_STATUS(t);

  const load = () => api.get('/admin/appointments').then(({ data }) => setAppointments(data.appointments));
  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/appointments/${id}/status`, { status });
    load();
  };

  // CORREGIR(2).xlsx ADMIN 28 — desde una cita ya autorizada, entrar
  // directamente al chat correspondiente sin buscarlo manualmente en Soporte.
  const enterChat = async (id) => {
    setOpeningChat(id);
    try {
      const { data } = await api.get(`/admin/appointments/${id}/chat-session`);
      navigate(`/admin/support?chat=${data.session.id}`);
    } finally {
      setOpeningChat(null);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminAppointments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminAppointments.title')}</h1>

      <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', maxWidth: 640 }}>{t('cdmxNotice')}</p>

      <AvailabilityEditor />

      <h3>{t('adminAppointments.requestsTitle')}</h3>
      {appointments.length === 0 ? (
        <div className="qlc-empty">{t('adminAppointments.none')}</div>
      ) : (
        <div className="qlc-table-wrap">
          <table className="qlc-table">
            <thead>
              <tr>
                <th>{t('adminAppointments.requester')}</th>
                <th>{t('clientAppointments.caseNumber')}</th>
                <th>{t('clientAppointments.account')}</th>
                <th>{t('adminAppointments.date')}</th>
                <th>{t('adminAppointments.time')}</th>
                <th>{t('adminAppointments.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const s = statusOf(appointmentStatusMap, a.status);
                return (
                  <tr key={a.id}>
                    <td>
                      {a.client
                        ? `${a.client.firstName} ${a.client.lastName}`
                        : `${a.prospect?.firstName || ''} ${a.prospect?.lastName || ''} ${t('adminAppointments.prospectTag')}`}
                    </td>
                    <td>{a.supportCase ? `#${a.supportCase.caseNumber}` : '—'}</td>
                    <td>
                      {a.apiSubaccount
                        ? a.apiSubaccount.isPrincipal
                          ? t('clientSubaccounts.principalLabel')
                          : a.apiSubaccount.identifier
                        : '—'}
                    </td>
                    <td>{formatCdmxDate(a.requestedDate)}</td>
                    <td>{a.requestedTime}</td>
                    <td>
                      <span className={`qlc-badge ${s.className}`}>{s.text}</span>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {a.status === 'PENDING' && (
                        <>
                          <button className="qlc-btn ghost" onClick={() => updateStatus(a.id, 'AUTORIZADA')}>
                            {t('adminAppointments.authorize')}
                          </button>
                          <button className="qlc-btn ghost" onClick={() => setConfirmReject(a)}>
                            {t('adminAppointments.reject')}
                          </button>
                        </>
                      )}
                      {a.status === 'AUTORIZADA' && (
                        <button className="qlc-btn ghost" disabled={openingChat === a.id} onClick={() => enterChat(a.id)}>
                          {openingChat === a.id ? t('common.loading') : t('clientAppointments.enterChat')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmReject && (
        <ConfirmModal
          title={t('adminAppointments.rejectTitle')}
          message={t('adminAppointments.rejectMessage')}
          confirmLabel={t('adminAppointments.reject')}
          onClose={() => setConfirmReject(null)}
          onConfirm={() => updateStatus(confirmReject.id, 'RECHAZADA')}
        />
      )}
    </div>
  );
}

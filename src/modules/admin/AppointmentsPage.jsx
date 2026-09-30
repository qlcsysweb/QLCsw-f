import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import CollapsibleSection from '../../components/CollapsibleSection';
import { APPOINTMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatDateOnly, appointmentMexicoTime, utcTimeToMexico } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import usePolling from '../../hooks/usePolling';

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
      return [...prev, { dayOfWeek, startTime: '16:00', endTime: '23:00', isActive: true }];
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

  const activeDaysSummary = DAY_LABELS.filter((_, dayOfWeek) => slots.some((s) => s.dayOfWeek === dayOfWeek)).join(', ');

  return (
    <CollapsibleSection
      title={t('adminAppointments.weeklyAvailability')}
      summary={activeDaysSummary || t('adminAppointments.notAvailable')}
      defaultOpen={false}
      className="qlc-collapsible-mb"
    >
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 0 }}>{t('adminAppointments.availabilityIntro')}</p>
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
                {/* Horas en UTC; debajo, su equivalente en hora de México. */}
                <div>
                  <input
                    className="qlc-input"
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTime(dayOfWeek, 'startTime', e.target.value)}
                    aria-label={`${label} — ${t('adminAppointments.from')} (UTC)`}
                  />
                  <span className="qlc-time-mx">UTC · {utcTimeToMexico(slot.startTime)} {t('adminAppointments.mexicoTime')}</span>
                </div>
                <div>
                  <input
                    className="qlc-input"
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTime(dayOfWeek, 'endTime', e.target.value)}
                    aria-label={`${label} — ${t('adminAppointments.to')} (UTC)`}
                  />
                  <span className="qlc-time-mx">UTC · {utcTimeToMexico(slot.endTime)} {t('adminAppointments.mexicoTime')}</span>
                </div>
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
    </CollapsibleSection>
  );
}

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [confirmReject, setConfirmReject] = useState(null);
  // Cita que el admin quiere borrar de su lista (se conserva archivada).
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [openingChat, setOpeningChat] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

  const appointmentStatusMap = APPOINTMENT_STATUS(t);

  const load = () => api.get('/admin/appointments').then(({ data }) => setAppointments(data.appointments));
  useEffect(() => {
    load();
  }, []);
  // Actualización sin refresh manual: nuevas solicitudes de cita del
  // cliente aparecen solas.
  usePolling(load, 8000);

  // Acceso directo desde una notificación: llega con ?appointmentId=<id>,
  // resalta esa fila y limpia el marcador tras unos segundos.
  useEffect(() => {
    const id = searchParams.get('appointmentId');
    if (!id || appointments.length === 0) return;
    if (appointments.some((a) => a.id === id)) {
      setHighlightId(id);
      searchParams.delete('appointmentId');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

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

      <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', maxWidth: 640 }}>{t('adminUtcNotice')}</p>

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
                <th>{t('adminAppointments.relatedCase')}</th>
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
                  <tr key={a.id} style={highlightId === a.id ? { background: 'rgba(0, 168, 255, 0.12)' } : undefined}>
                    <td>
                      {a.client
                        ? `${a.client.firstName} ${a.client.lastName}`
                        : `${a.prospect?.firstName || ''} ${a.prospect?.lastName || ''} ${t('adminAppointments.prospectTag')}`}
                    </td>
                    <td>
                      {/* Caso que originó la cita: se abre directamente en Soporte
                          (mensajería del caso) para consultarlo. */}
                      {a.supportCase ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            type="button"
                            className="qlc-link-btn"
                            style={{ textAlign: 'left' }}
                            onClick={() => navigate(`/admin/support?case=${a.supportCase.id}`)}
                            title={t('adminAppointments.openCase')}
                          >
                            {t('adminSupport.caseNumber')}#{a.supportCase.caseNumber}
                          </button>
                          {a.supportCase.subject && (
                            <span style={{ fontSize: 11, color: 'var(--qlc-muted2)', maxWidth: 220, overflowWrap: 'anywhere' }}>
                              {a.supportCase.subject}
                            </span>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {a.apiSubaccount
                        ? a.apiSubaccount.isPrincipal
                          ? t('clientSubaccounts.principalLabel')
                          : a.apiSubaccount.identifier
                        : '—'}
                    </td>
                    <td>{formatDateOnly(a.requestedDate)}</td>
                    <td>
                      {/* Hora de México (la del equipo) + la hora UTC agendada. */}
                      {(() => {
                        const mx = appointmentMexicoTime(a.requestedDate, a.requestedTime);
                        return (
                          <>
                            <strong>{mx.time}</strong> {t('adminAppointments.mexicoTime')}
                            {mx.date !== formatDateOnly(a.requestedDate) && <span className="qlc-time-mx"> ({mx.date})</span>}
                            <div className="qlc-time-mx">{a.requestedTime} UTC</div>
                          </>
                        );
                      })()}
                    </td>
                    <td>
                      <span className={`qlc-badge ${s.className}`}>{s.text}</span>
                    </td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                      {/* Borrar: solo si ya se respondió (una PENDIENTE se autoriza o rechaza primero). */}
                      {a.status !== 'PENDING' && (
                        <button
                          type="button"
                          className="qlc-btn ghost qlc-case-delete"
                          onClick={() => setConfirmDelete(a)}
                          title={t('adminAppointments.deleteAppointment')}
                          aria-label={t('adminAppointments.deleteAppointment')}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
                          </svg>
                          {t('adminAppointments.deleteAppointment')}
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

      {confirmDelete && (
        <ConfirmModal
          title={t('adminAppointments.deleteTitle')}
          message={t('adminAppointments.deleteMessage')}
          confirmLabel={t('adminAppointments.deleteAppointment')}
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await api.delete(`/admin/appointments/${confirmDelete.id}`);
            load();
          }}
        />
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

import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatDateOnly, appointmentMexicoTime, utcTimeToMexico } from '../../utils/cdmxTime';

/*
 * PROPONER OTRO HORARIO — el admin no puede atender el horario que pidió el
 * cliente: elige una fecha y uno de los horarios libres (UTC; se muestra su
 * equivalente en hora de México). La cita queda RECHAZADA con la propuesta y
 * el cliente la acepta o no desde Soporte.
 */
export default function ProposeTimeModal({ appointment, onClose, onDone }) {
  const { t, language } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSlots(null);
    setTime('');
    if (!date) return;
    let cancelled = false;
    api
      .get('/admin/appointments/available-slots', { params: { date, excludeId: appointment.id } })
      // Nunca se ofrece el mismo horario que se está rechazando.
      .then(({ data }) => {
        if (cancelled) return;
        const sameDay = String(appointment.requestedDate).slice(0, 10) === date;
        setSlots(data.slots.filter((s) => !(sameDay && s === appointment.requestedTime)));
      })
      .catch((err) => !cancelled && setError(translateBackendMessage(err.message, language)));
    return () => {
      cancelled = true;
    };
  }, [date, appointment.id, appointment.requestedDate, appointment.requestedTime, language]);

  const submit = async (e) => {
    e.preventDefault();
    if (!time) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/admin/appointments/${appointment.id}/propose`, { date, time });
      onDone();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSending(false);
    }
  };

  const requestedMx = appointmentMexicoTime(appointment.requestedDate, appointment.requestedTime);

  return (
    <Modal title={t('adminAppointments.proposeTitle')} onClose={onClose} width={480}>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 0 }}>
        {t('adminAppointments.proposeIntro')
          .replace('{date}', formatDateOnly(appointment.requestedDate))
          .replace('{time}', `${requestedMx.time} ${t('adminAppointments.mexicoTime')} (${appointment.requestedTime} UTC)`)}
      </p>
      <form onSubmit={submit}>
        <label className="qlc-label" htmlFor="propose-date">
          {t('adminAppointments.date')} (UTC)
        </label>
        <input id="propose-date" type="date" className="qlc-input" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
        <label className="qlc-label" htmlFor="propose-time">
          {t('adminAppointments.time')}
        </label>
        {slots === null ? (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('common.loading')}</p>
        ) : slots.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('clientAppointments.noSlotsForDate')}</p>
        ) : (
          <select id="propose-time" className="qlc-select" value={time} onChange={(e) => setTime(e.target.value)} required>
            <option value="">{t('clientAppointments.selectTime')}</option>
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot} UTC · {utcTimeToMexico(slot)} {t('adminAppointments.mexicoTime')}
              </option>
            ))}
          </select>
        )}
        {error && <p className="qlc-field-error">{error}</p>}
        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={onClose} disabled={sending}>
            {t('common.cancel')}
          </button>
          <button className="qlc-btn primary" disabled={!time || sending}>
            {sending ? t('common.sending') : t('adminAppointments.proposeSend')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

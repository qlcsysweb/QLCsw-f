// CORRECCIÓN 15/21 — todos los horarios del sistema se muestran en
// America/Mexico_City (CDMX), nunca en la zona horaria del navegador del
// visitante. Los valores se siguen guardando en UTC/ISO en NeonDB; esta
// utilidad solo controla cómo se FORMATEAN para mostrarse.
const TIME_ZONE = 'America/Mexico_City';

export function formatCdmxDate(date) {
  return new Intl.DateTimeFormat('es-MX', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date instanceof Date ? date : new Date(date)
  );
}

// CORRECCIÓN 16 (bloque de 20) — para fechas-calendario PURAS (sin hora
// real asociada, ej. Appointment.requestedDate, guardadas como medianoche
// UTC de ese día): formatCdmxDate() las convertiría a CDMX y las movería un
// día hacia atrás (medianoche UTC = 18:00 CDMX del día anterior). Esta
// función formatea directo desde el string de fecha, sin pasar por
// Date/zona horaria — úsala quando el valor es "un día", no "un instante".
export function formatDateOnly(date) {
  const iso = date instanceof Date ? date.toISOString() : String(date);
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

// Formato visible: "DD/MM/YYYY, HH:mm" (sin sufijo de zona horaria, a
// pedido de QLC). La hora sigue calculándose en America/Mexico_City.
export function formatCdmxDateTime(date) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date instanceof Date ? date : new Date(date));
}

// CITAS EN UTC — las citas se guardan y se muestran al cliente en UTC. Al
// ADMIN se le muestra además la hora de México (UTC-6 fijo: México no usa
// horario de verano desde 2022). `date` es la fecha-calendario de la cita
// (medianoche UTC) y `time` la hora "HH:MM" en UTC.
export function appointmentUtcInstant(date, time) {
  const dateOnly = (date instanceof Date ? date.toISOString() : String(date)).slice(0, 10);
  return new Date(`${dateOnly}T${time}:00Z`);
}

export function appointmentMexicoTime(date, time) {
  const iso = new Date(appointmentUtcInstant(date, time).getTime() - 6 * 60 * 60 * 1000).toISOString();
  return { date: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`, time: iso.slice(11, 16) };
}

// "HH:MM" UTC de disponibilidad → "HH:MM" en México (solo la hora).
export function utcTimeToMexico(time) {
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const mins = (((h * 60 + (m || 0) - 360) % 1440) + 1440) % 1440;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

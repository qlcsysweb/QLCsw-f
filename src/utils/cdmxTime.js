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

export function formatCdmxDateTime(date) {
  return (
    new Intl.DateTimeFormat('es-MX', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date instanceof Date ? date : new Date(date)) + ' CDMX'
  );
}

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

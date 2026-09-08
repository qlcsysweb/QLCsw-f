// Traducciones de estados internos a lenguaje humano — nunca mostrar
// enums técnicos (PENDING, RECHAZADO, RECEIVED_SIGNED, etc.) directamente
// en la interfaz del cliente.

export const ACCOUNT_STATUS = {
  ACTIVE: { text: '● Activa', className: 'ok' },
  PENDING: { text: '◌ Pendiente', className: 'warn' },
  REVIEW: { text: '! En revisión', className: 'warn' },
  INACTIVE: { text: '× Inactiva', className: 'danger' },
};

export const APPOINTMENT_STATUS = {
  PENDING: { text: '◌ Pendiente de respuesta', className: 'warn' },
  AUTORIZADA: { text: '✓ Autorizada', className: 'ok' },
  RECHAZADA: { text: '× Rechazada', className: 'danger' },
  COMPLETADA: { text: '✓ Completada', className: 'ok' },
  CANCELADA: { text: '× Cancelada', className: 'danger' },
};

export const PAYMENT_REPORT_STATUS = {
  PENDING: { text: '◌ En espera de revisión', className: 'warn' },
  EN_REVISION: { text: '! En revisión', className: 'warn' },
  APROBADO: { text: '✓ Aprobado', className: 'ok' },
  RECHAZADO: { text: '× Rechazado', className: 'danger' },
};

export const SUPPORT_CASE_STATUS = {
  OPEN: { text: '◌ Abierto', className: 'warn' },
  IN_PROGRESS: { text: '! En progreso', className: 'warn' },
  CLOSED: { text: '✓ Cerrado', className: 'ok' },
};

export const CHAT_SESSION_STATUS = {
  SCHEDULED: { text: '◌ Disponible para iniciar', className: 'warn' },
  ACTIVE: { text: '● En curso', className: 'ok' },
  CLOSED: { text: '✓ Finalizado', className: 'muted' },
};

export const PROSPECT_STATUS = {
  NUEVO: { text: '◌ Nuevo', className: 'warn' },
  CONTACTADO: { text: '! Contactado', className: 'warn' },
  CONVERTIDO: { text: '✓ Convertido', className: 'ok' },
  DESCARTADO: { text: '× Descartado', className: 'danger' },
};

export function statusOf(map, key, fallback = 'PENDING') {
  return map[key] || map[fallback];
}

// Traducciones de estados internos a lenguaje humano — nunca mostrar
// enums técnicos (PENDING, RECHAZADO, RECEIVED_SIGNED, etc.) directamente
// en la interfaz del cliente. Cada mapa es una función que recibe `t`
// (de useLanguage()) para que el texto siga el idioma personal de quien
// esté viendo la pantalla en ese momento.

export const ACCOUNT_STATUS = (t) => ({
  ACTIVE: { text: `● ${t('status.account.active')}`, className: 'ok' },
  PENDING: { text: `◌ ${t('status.account.pending')}`, className: 'warn' },
  REVIEW: { text: `! ${t('status.account.review')}`, className: 'warn' },
  INACTIVE: { text: `× ${t('status.account.inactive')}`, className: 'danger' },
});

export const APPOINTMENT_STATUS = (t) => ({
  PENDING: { text: `◌ ${t('status.appointment.pending')}`, className: 'warn' },
  AUTORIZADA: { text: `✓ ${t('status.appointment.authorized')}`, className: 'ok' },
  RECHAZADA: { text: `× ${t('status.appointment.rejected')}`, className: 'danger' },
  COMPLETADA: { text: `✓ ${t('status.appointment.completed')}`, className: 'ok' },
  CANCELADA: { text: `× ${t('status.appointment.cancelled')}`, className: 'danger' },
});

export const PAYMENT_REPORT_STATUS = (t) => ({
  PENDING: { text: `◌ ${t('status.paymentReport.pending')}`, className: 'warn' },
  EN_REVISION: { text: `! ${t('status.paymentReport.inReview')}`, className: 'warn' },
  APROBADO: { text: `✓ ${t('status.paymentReport.approved')}`, className: 'ok' },
  RECHAZADO: { text: `× ${t('status.paymentReport.rejected')}`, className: 'danger' },
});

export const SUPPORT_CASE_STATUS = (t) => ({
  OPEN: { text: `◌ ${t('status.supportCase.open')}`, className: 'warn' },
  IN_PROGRESS: { text: `! ${t('status.supportCase.inProgress')}`, className: 'warn' },
  CLOSED: { text: `✓ ${t('status.supportCase.closed')}`, className: 'ok' },
});

export const CHAT_SESSION_STATUS = (t) => ({
  SCHEDULED: { text: `◌ ${t('status.chatSession.scheduled')}`, className: 'warn' },
  ACTIVE: { text: `● ${t('status.chatSession.active')}`, className: 'ok' },
  CLOSED: { text: `✓ ${t('status.chatSession.closed')}`, className: 'muted' },
});

export const API_CONNECTION_STATUS = (t) => ({
  CONECTADA: { text: `● ${t('status.apiConnection.connected')}`, className: 'ok' },
  DESCONECTADA: { text: `× ${t('status.apiConnection.disconnected')}`, className: 'muted' },
  PENDIENTE: { text: `◌ ${t('status.apiConnection.pending')}`, className: 'warn' },
});

export const PROSPECT_STATUS = (t) => ({
  NUEVO: { text: `◌ ${t('status.prospect.new')}`, className: 'warn' },
  CONTACTADO: { text: `! ${t('status.prospect.contacted')}`, className: 'warn' },
  CONVERTIDO: { text: `✓ ${t('status.prospect.converted')}`, className: 'ok' },
  DESCARTADO: { text: `× ${t('status.prospect.discarded')}`, className: 'danger' },
});

export function statusOf(map, key, fallback = 'PENDING') {
  return map[key] || map[fallback];
}

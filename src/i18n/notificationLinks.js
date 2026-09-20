import { API_BASE_URL } from '../services/api';

/*
 * Resuelve a dónde debe llevar un clic sobre una notificación — el "acceso
 * directo a lo que se hizo la acción". Se basa en templateParams (ver
 * backend/src/utils/notify.js): cada notificación nueva ya viaja con los
 * IDs reales de lo que la originó (apiSubaccountId, clientId, caseId,
 * appointmentId, chatSessionId), nunca solo texto para mostrar. Nunca
 * inventa una ruta que no exista — si no hay suficiente información, no
 * hay enlace (el clic solo marca como leída).
 *
 * Devuelve { path } para una ruta interna (navigate), { external: true,
 * url } para un archivo servido directo por el backend (ej. el PDF de un
 * chat), o null si no aplica.
 */

// Notificaciones sin un id específico de por medio — van siempre a la
// misma sección general, donde el admin/cliente ya puede ver y actuar.
const ADMIN_GENERAL_PATHS = {
  new_admin_registered_admin: '/admin/admins',
  new_prospect_admin: '/admin/prospects',
};

// Esta SÍ trae apiSubaccountId en templateParams, pero ese destino ya no es
// accesible para el cliente (la subcuenta quedó INACTIVA) — se revisa ANTES
// del atajo genérico "si trae apiSubaccountId, ir a su detalle" de abajo.
const CLIENT_TEMPLATE_OVERRIDE_PATHS = {
  subaccount_deactivated: '/client/api-subaccounts',
};

const CLIENT_GENERAL_PATHS = {
  document_resubmit: '/client/documents',
  document_submitted: '/client/documents',
  document_unlocked: '/client/documents',
  capital_invitation_created: '/client/capital-increase',
  capital_distribution_started: '/client/capital-increase',
  capital_distribution_published: '/client/capital-increase',
  capital_request_submitted: '/client/capital-increase',
  capital_invitation_rejected: '/client/capital-increase',
  capital_instructions_read: '/client/capital-increase',
  capital_distribution_confirmed: '/client/capital-increase',
  capital_request_authorized: '/client/capital-increase',
  rescue_invitation_created: '/client/capital-rescue',
  rescue_invitation_rejected: '/client/capital-rescue',
  rescue_participation_confirmed: '/client/capital-rescue',
  rescue_deposit_instructions: '/client/capital-rescue',
  rescue_deposit_confirmed: '/client/capital-rescue',
  rescue_available_for_return: '/client/capital-rescue',
  rescue_finalized: '/client/capital-rescue',
  wallet_saved: '/client/wallet',
  subaccount_request_rejected: '/client/api-subaccounts',
  appointment_status_updated: '/client/support',
  appointment_confirmed: '/client/support',
  appointment_rejected: '/client/support',
  appointment_requested_self: '/client/support',
  case_created_self: '/client/support',
  welcome: '/client',
};

export function resolveNotificationLink(notification, role) {
  const templateKey = notification?.templateKey;
  const p = notification?.templateParams || {};
  if (!templateKey) return null;

  if (role === 'ADMIN') {
    if (templateKey === 'chat_session_ended' && p.chatSessionId) {
      return { external: true, url: `${API_BASE_URL}/admin/chat/${p.chatSessionId}/pdf` };
    }
    if (p.apiSubaccountId && p.clientId) {
      return { path: `/admin/clients/${p.clientId}/api-subaccounts/${p.apiSubaccountId}` };
    }
    if (p.caseId) return { path: `/admin/support?case=${p.caseId}` };
    if (p.appointmentId) return { path: `/admin/appointments?appointmentId=${p.appointmentId}` };
    if (p.clientId) return { path: `/admin/clients/${p.clientId}` };
    if (ADMIN_GENERAL_PATHS[templateKey]) return { path: ADMIN_GENERAL_PATHS[templateKey] };
    return null;
  }

  // CLIENT — siempre sobre sus propios recursos, nunca necesita un clientId.
  if (CLIENT_TEMPLATE_OVERRIDE_PATHS[templateKey]) return { path: CLIENT_TEMPLATE_OVERRIDE_PATHS[templateKey] };
  if (p.apiSubaccountId) return { path: `/client/api-subaccounts/${p.apiSubaccountId}` };
  if (p.caseId) return { path: `/client/support?case=${p.caseId}` };
  if (CLIENT_GENERAL_PATHS[templateKey]) return { path: CLIENT_GENERAL_PATHS[templateKey] };
  return null;
}

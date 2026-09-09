/*
 * El backend responde siempre con mensajes humanos en español (no con
 * códigos de error) — ver backend/src/middleware/errorHandler.js y
 * backend/src/utils/ApiError.js. Cambiar eso para agregar códigos es un
 * cambio de arquitectura de API que está fuera de este alcance (no se
 * modifica la regla de negocio ni el backend).
 *
 * Como solución de frontend: mantenemos aquí el conjunto de mensajes de
 * backend conocidos/frecuentes y su traducción exacta al inglés. Es un
 * mapa de texto exacto (no una traducción palabra por palabra), así que
 * un mensaje nuevo o no catalogado simplemente se muestra tal cual llega
 * del backend en vez de romper o mostrarse en un idioma mezclado.
 */
const KNOWN_MESSAGES = {
  'Usuario o contraseña incorrectos': 'Incorrect username or password',
  'Demasiados intentos de inicio de sesión. Intenta más tarde.': 'Too many login attempts. Please try again later.',
  'Sesión no encontrada': 'Session not found',
  'Sesión inválida': 'Invalid session',
  'Sesión inválida o expirada': 'Invalid or expired session',
  'No tienes permisos para esta acción': "You don't have permission for this action",
  'Acceso denegado': 'Access denied',
  'Recurso no encontrado': 'Resource not found',
  'Ocurrió un problema inesperado. Intenta nuevamente en unos segundos.':
    'An unexpected problem occurred. Please try again in a few seconds.',
  'Ocurrió un problema. Intenta nuevamente.': 'Something went wrong. Please try again.',
  'Contraseña actual incorrecta': 'Current password is incorrect',
  'La nueva contraseña debe tener al menos 8 caracteres': 'The new password must be at least 8 characters long',
  'No se puede activar: existen condiciones del proceso sin confirmar.':
    'Cannot activate: some process conditions have not been confirmed.',
  'Ya enviaste tu contrato firmado. Si necesitas reemplazarlo, contacta con QLC.':
    "You've already submitted your signed contract. Contact QLC if you need to replace it.",
  'Ya enviaste un documento en esta categoría. Si necesitas reemplazarlo, contacta con QLC.':
    "You've already submitted a document in this category. Contact QLC if you need to replace it.",
  'No pudimos conectar con Google Drive. Ve a Configuración → Google Drive en el panel administrativo.':
    'We could not connect to Google Drive. Go to Settings → Google Drive in the admin panel.',
};

// Se completa según se detecten mensajes nuevos frecuentes — nunca rompe si
// el mensaje no está catalogado, simplemente devuelve el original.
export function translateBackendMessage(message, language) {
  if (!message || language !== 'en') return message;
  return KNOWN_MESSAGES[message] || message;
}

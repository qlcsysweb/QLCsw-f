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
  'Debes aceptar el Aviso de Privacidad para continuar.': 'You must accept the Privacy Notice to continue.',
  'Debes aceptar los Términos y Condiciones para continuar.': 'You must accept the Terms and Conditions to continue.',
  'Debes autorizar la conexión API para continuar.': 'You must authorize the API connection to continue.',
  'Ya enviaste un documento en esta categoría. Si necesitas reemplazarlo, contacta con QLC.':
    "You've already submitted a document in this category. Contact QLC if you need to replace it.",
  'No pudimos conectar con Google Drive. Ve a Configuración → Google Drive en el panel administrativo.':
    'We could not connect to Google Drive. Go to Settings → Google Drive in the admin panel.',
  'No pudimos conectar con el almacenamiento de documentos. Contacta al equipo de QLC.':
    'We could not connect to document storage. Contact the QLC team.',

  // --- Recursos no encontrados (404) ---
  'Cita no encontrada': 'Appointment not found',
  'Cliente no encontrado': 'Client not found',
  'Perfil de cliente no encontrado': 'Client profile not found',
  'Conexión API no encontrada': 'API connection not found',
  'Usuario no encontrado': 'User not found',
  'FAQ no encontrada': 'FAQ not found',
  'Sesión de chat no encontrada': 'Chat session not found',
  'Administrador no encontrado': 'Administrator not found',
  'Track Record no encontrado': 'Track Record not found',
  'Reporte de pago no encontrado': 'Payment report not found',
  'Este recurso multimedia ya no existe': 'This media resource no longer exists',
  'Proceso no encontrado': 'Process not found',
  'Documento no encontrado': 'Document not found',
  'Prospecto no encontrado': 'Prospect not found',
  'Caso no encontrado': 'Case not found',
  'Modelo no encontrado': 'Model not found',
  'El archivo solicitado no existe todavía': 'The requested file does not exist yet',
  'Este reporte no tiene comprobante adjunto': 'This report has no proof attached',

  // --- Validación (400) ---
  'Debes adjuntar un archivo': 'You must attach a file',
  'Debes adjuntar una imagen': 'You must attach an image',
  'Debes adjuntar una imagen o un video': 'You must attach an image or a video',
  'Debes adjuntar el nuevo archivo': 'You must attach the new file',
  'Estado no válido': 'Invalid status',
  'Variante no válida': 'Invalid variant',
  'La categoría es obligatoria': 'Category is required',
  'Modelo seleccionado no válido': 'Selected model is not valid',
  'Modelo no válido': 'Invalid model',
  'No puedes desactivar tu propia cuenta.': 'You cannot deactivate your own account.',

  // --- Conflictos (409) ---
  'Ya existe un usuario con ese email': 'A user with that email already exists',
  'Ya existe un usuario con ese nombre de usuario': 'A user with that username already exists',

  // --- Chat en vivo ---
  'La sesión ya fue iniciada o cerrada': 'The session has already started or ended',
  'El chat no está activo': 'The chat is not active',
  'El tiempo de la sesión de chat ha finalizado': 'The chat session time has ended',

  // --- Límites del plan ---
  'El plan contempla un máximo de 3 administradores.': 'The plan allows a maximum of 3 administrators.',
};

// Mensajes con una parte técnica variable (ruta, id, etc.) que no se puede
// catalogar como texto exacto — se traduce solo el prefijo humano y se deja
// intacta la parte técnica (nunca se inventa una traducción del resto).
const PREFIX_MESSAGES = [
  { prefix: 'Ruta no encontrada: ', translated: 'Route not found: ' },
];

// Se completa según se detecten mensajes nuevos frecuentes — nunca rompe si
// el mensaje no está catalogado, simplemente devuelve el original.
export function translateBackendMessage(message, language) {
  if (!message || language !== 'en') return message;
  if (KNOWN_MESSAGES[message]) return KNOWN_MESSAGES[message];
  const prefixMatch = PREFIX_MESSAGES.find((p) => message.startsWith(p.prefix));
  if (prefixMatch) return prefixMatch.translated + message.slice(prefixMatch.prefix.length);
  return message;
}

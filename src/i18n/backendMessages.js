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
  // Estado de cuenta / Transferencia interna Bitget
  'El número de orden es obligatorio': 'The order number is required',
  'El número de orden no puede superar 64 caracteres': 'The order number cannot exceed 64 characters',
  'El número de orden solo puede contener letras, números y guiones': 'The order number may only contain letters, numbers and hyphens',
  'La fecha y hora de la transacción no es válida': 'The transaction date and time is not valid',
  'La fecha y hora de la transacción no puede estar en el futuro.': 'The transaction date and time cannot be in the future.',
  'Ese número de orden ya fue reportado.': 'That order number has already been reported.',
  'Este código ya tiene referidos: no se puede regenerar sin romper la atribución histórica.': 'This code already has referrals: it cannot be regenerated without breaking the historical attribution.',
  'Solo el administrador general puede modificar los porcentajes del QLC Affiliate Program.': 'Only the general administrator can change the QLC Affiliate Program percentages.',
  'La fecha de vigencia no puede ser anterior a hoy (no se aplican cambios retroactivos).': 'The effective date cannot be earlier than today (no retroactive changes).',
  'Adjunta al menos un archivo.': 'Attach at least one file.',
  'El código de verificación venció o no existe. Solicita un código nuevo.': 'The verification code expired or does not exist. Request a new code.',
  'Demasiados intentos con este código. Solicita un código nuevo.': 'Too many attempts with this code. Request a new code.',
  'El código de verificación es incorrecto.': 'The verification code is incorrect.',
  'El código de verificación ya fue utilizado. Solicita un código nuevo.': 'The verification code was already used. Request a new code.',
  'Escribe el código de verificación que enviamos a tu correo.': 'Enter the verification code we sent to your email.',
  'El código de verificación debe tener 6 dígitos.': 'The verification code must have 6 digits.',
  'No pudimos enviar el código a ese correo. Revisa que esté bien escrito e intenta de nuevo.': 'We could not send the code to that email. Check it is spelled correctly and try again.',
  'No pudimos enviar el código de verificación en este momento. Intenta más tarde o contacta a soporte@qlctrade.net.': 'We could not send the verification code right now. Try later or contact soporte@qlctrade.net.',
  'Demasiadas solicitudes de código. Intenta más tarde.': 'Too many code requests. Try again later.',
  'Esa nomenclatura ya está en uso por otro cliente.': 'That nomenclature is already used by another client.',
  'La comisión del afiliador no puede superar la parte disponible de la rentabilidad (rentabilidad − resultado del cliente).': 'The affiliate commission cannot exceed the available part of the profit (profit − client result).',
  'La comisión del afiliador no puede ser negativa.': 'The affiliate commission cannot be negative.',
  'Primero paga la comisión al promotor afiliador (a su UID de Bitget) y carga el comprobante; después podrás generar el estado de cuenta.': 'First pay the commission to the affiliate promoter (to their Bitget UID) and upload the proof; then you can generate the statement.',
  'Carga el comprobante del pago (captura o PDF) para continuar.': 'Upload the payment proof (screenshot or PDF) to continue.',
  'El promotor afiliador todavía no registró su UID de Bitget: no hay a dónde pagarle su comisión.': 'The affiliate promoter has not registered their Bitget UID yet: there is nowhere to pay their commission.',
  'Ya hay un pago registrado pendiente de usarse en el estado de cuenta. Anúlalo si fue un error.': 'There is already a registered payment pending use in the statement. Void it if it was a mistake.',
  'Este pago ya se usó en un estado de cuenta o ya fue anulado.': 'This payment was already used in a statement or was already voided.',
  'Los días del ROI deben ser entre 1 y 365.': 'ROI days must be between 1 and 365.',
  'Los días del ROI deben ser un número entero.': 'ROI days must be a whole number.',
  'Indica la fecha y hora del depósito.': 'Enter the deposit date and time.',
  'La fecha y hora del depósito no es válida.': 'The deposit date and time is not valid.',
  'La fecha y hora del depósito no puede estar en el futuro.': 'The deposit date and time cannot be in the future.',
  'Indica tu UID de Bitget.': 'Enter your Bitget UID.',
  'El UID de Bitget debe contener solo números (5 a 20 dígitos).': 'The Bitget UID must contain only numbers (5 to 20 digits).',
  'Registra tu UID de Bitget antes de crear tu liga de afiliación.': 'Register your Bitget UID before creating your affiliate link.',
  'La distribución debe sumar 100%.': 'The distribution must add up to 100%.',
  'Selecciona al menos una comisión aprobada.': 'Select at least one approved commission.',
  'Solo se pueden pagar comisiones APROBADAS de este afiliador que no estén en otro pago.': 'Only APPROVED commissions of this affiliate that are not in another payment can be paid.',
  'El afiliador todavía no registró su UID de Bitget de recepción.': 'The affiliate has not registered their receiving Bitget UID yet.',
  'Este pago no puede pasar a ese estado desde su estado actual.': 'This payment cannot move to that status from its current status.',
  'Indica el motivo de la corrección (mínimo 10 caracteres).': 'Enter the reason for the correction (at least 10 characters).',
  'Esa corrección crearía una relación circular entre afiliadores.': 'That correction would create a circular relationship between affiliates.',
  'El cliente ya tiene asignado ese afiliador.': 'The client already has that affiliate assigned.',
  'Justifica el ajuste (mínimo 10 caracteres).': 'Justify the adjustment (at least 10 characters).',
  'El código de afiliado no existe, está desactivado o ya no puede utilizarse.': 'The affiliate code does not exist, is deactivated or can no longer be used.',
  'Para registrarte en QLC necesitas un código o enlace de afiliación válido.': 'To register in QLC you need a valid affiliate code or link.',
  'Indica y valida el código de afiliado, o elige "Sin afiliado".': 'Enter and validate the affiliate code, or choose "No affiliate".',
  'El programa de afiliados no está activo en este momento.': 'The affiliate program is not active right now.',
  'Tu afiliación fue desactivada por QLC. Contacta al equipo de QLC para reactivarla.': 'Your affiliation was deactivated by QLC. Contact the QLC team to reactivate it.',
  'Tu enlace de afiliación no está activo.': 'Your affiliate link is not active.',
  'Este cliente no tiene un afiliador directo: no puede generar comisión de afiliado.': 'This client has no direct affiliate: it cannot generate an affiliate commission.',
  'Indica el monto base sobre el que se calcula el porcentaje.': 'Enter the base amount the percentage is calculated on.',
  'QLC todavía no definió la comisión del programa: indica el monto de esta comisión.': 'QLC has not defined the program commission yet: enter the amount of this commission.',
  'Esta comisión no puede pasar a ese estado desde su estado actual.': 'This commission cannot move to that status from its current status.',
  'Ya existe una cuenta con este correo.': 'An account with this email already exists.',
  'Este reporte ya fue finalizado; no se puede modificar su borrador.': 'This report has already been finalized; its draft can no longer be changed.',
  'Este reporte ya fue finalizado.': 'This report has already been finalized.',
  'Solo se puede eliminar un borrador de estado de cuenta.': 'Only a statement draft can be deleted.',
  'Un borrador de estado de cuenta no se puede marcar como pagado.': 'A statement draft cannot be marked as paid.',
  'Ya existe un estado de cuenta para esta subcuenta/API en ese mismo periodo.': 'A statement already exists for this subaccount/API for that same period.',
  'Indica la fecha "hasta" del periodo.': 'Enter the period "to" date.',
  'Esta subcuenta fue desactivada.': 'This subaccount was deactivated.',
  'El UID de Bitget solo puede contener números': 'The Bitget UID may only contain numbers',
  'Esta subcuenta/API ya tiene un estado de cuenta sin pagar. Confirma su pago antes de generar uno nuevo.':
    'This subaccount/API already has an unpaid statement. Confirm its payment before generating a new one.',
  'Correo o código de Google Authenticator incorrectos.': 'Incorrect email or Google Authenticator code.',
  'El código debe tener 6 dígitos.': 'The code must have 6 digits.',
  'La verificación para restablecer la contraseña expiró. Vuelve a empezar.': 'The password reset verification expired. Please start again.',
  'Demasiados intentos de restablecimiento. Intenta más tarde.': 'Too many reset attempts. Please try again later.',
  'Debes activar la verificación en dos pasos (Google Authenticator) para continuar.': 'You must enable two-step verification (Google Authenticator) to continue.',
  'La verificación en dos pasos ya está activa.': 'Two-step verification is already enabled.',
  'La verificación en dos pasos es obligatoria y no se puede desactivar.': 'Two-step verification is mandatory and cannot be disabled.',
  'La verificación en dos pasos todavía no está disponible.': 'Two-step verification is not available yet.',
  'No hay una configuración de 2FA pendiente. Inicia el proceso de nuevo.': 'There is no pending 2FA setup. Start the process again.',
  'Código incorrecto': 'Incorrect code',
  'Verificación expirada, inicia sesión de nuevo': 'Verification expired, please sign in again',
  'Correo o contraseña incorrectos': 'Incorrect email or password',
  'Contraseña actualizada correctamente.': 'Password updated successfully.',
  'Un pago de estado de cuenta ya confirmado no se puede eliminar.': 'A statement payment that is already confirmed cannot be deleted.',
  '2FA no está disponible': '2FA is not available',
  'Adjunta un archivo.': 'Attach a file.',
  'Adjunta un solo archivo por mensaje.': 'Attach a single file per message.',
  'Este caso tiene una cita pendiente o por atender. Podrás borrarlo cuando la cita termine.': 'This case has a pending or upcoming appointment. You can delete it once the appointment is over.',
  'Primero autoriza o rechaza la solicitud de cita antes de borrarla.': 'First authorize or reject the appointment request before deleting it.',
  'El identificador interno de la subcuenta (ej. PCB-1-A-1) es obligatorio.': 'The subaccount internal identifier (e.g. PCB-1-A-1) is required.',
  'El identificador interno es obligatorio.': 'The internal identifier is required.',
  'Ese identificador ya está en uso por otra subcuenta.': 'That identifier is already used by another subaccount.',
  'Esta cita está pendiente o por atender. Podrás borrarla cuando termine o sea rechazada.': 'This appointment is pending or upcoming. You can delete it once it is over or rejected.',
  'Indica el número de caso.': 'Enter the case number.',
  'Solo se puede proponer otro horario para una solicitud pendiente o rechazada.': 'Another time can only be proposed for a pending or rejected request.',
  'Ese horario ya no está disponible. Elige otro.': 'That time is no longer available. Choose another one.',
  'No hay una propuesta de horario pendiente para esta cita.': 'There is no pending time proposal for this appointment.',
  'El horario propuesto ya pasó. Solicita una nueva cita.': 'The proposed time has already passed. Request a new appointment.',
  'Ese horario ya no está disponible. Solicita una nueva cita.': 'That time is no longer available. Request a new appointment.',
  'QLC te propuso otro horario para esta cita. Acéptalo o recházalo antes de borrarla.': 'QLC proposed another time for this appointment. Accept or decline it before deleting it.',
  'Propón un horario distinto al que pidió el cliente.': 'Propose a time different from the one the client requested.',
  'Formato no permitido. Puedes enviar fotos (JPG, PNG, WEBP) o documentos (PDF, Word, Excel, PowerPoint, TXT o CSV).': 'Format not allowed. You can send photos (JPG, PNG, WEBP) or documents (PDF, Word, Excel, PowerPoint, TXT or CSV).',
  'El archivo no corresponde a su formato o está dañado.': 'The file does not match its format or is damaged.',
  'Evento no encontrado': 'Event not found',
  'Reporte no encontrado': 'Report not found',
  'Este reporte sigue en revisión; podrás borrarlo cuando lo confirmes o rechaces.': 'This report is still under review; you can delete it once you confirm or reject it.',
  'Solo se pueden borrar estados de cuenta ya pagados.': 'Only statements that are already paid can be deleted.',
  'El estado de cuenta actual no se puede borrar.': 'The current statement cannot be deleted.',
  'Solo puedes borrar estados de cuenta ya pagados.': 'You can only delete statements that are already paid.',
  'Este reporte sigue en revisión; podrás borrarlo cuando QLC lo revise.': 'This report is still under review; you can delete it once QLC reviews it.',
  'Usuario o contraseña incorrectos': 'Incorrect username or password',
  'Demasiados intentos de inicio de sesión. Intenta más tarde.': 'Too many login attempts. Please try again later.',
  'Sesión no encontrada': 'Session not found',
  'El archivo supera el límite permitido de 5 MB.': 'The file exceeds the allowed limit of 5 MB.',
  'El archivo está vacío.': 'The file is empty.',
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
  'El estado de cuenta debe ser un archivo PDF.': 'The statement must be a PDF file.',
  'Formato de evidencia no permitido. Solo JPG, PNG, WEBP o PDF.': 'Evidence format not allowed. Only JPG, PNG, WEBP or PDF.',
  'Cada archivo de evidencia puede pesar como máximo 5 MB.': 'Each evidence file can be at most 5 MB.',
  'Puedes adjuntar como máximo 5 archivos de evidencia.': 'You can attach up to 5 evidence files.',
  'No se pudo procesar la evidencia adjunta.': 'The attached evidence could not be processed.',
  'Adjunta al menos un archivo de evidencia de la transferencia.': 'Attach at least one evidence file of the transfer.',
  'Uno de los archivos de evidencia está vacío.': 'One of the evidence files is empty.',
  'Uno de los archivos no es una imagen o PDF válido.': 'One of the files is not a valid image or PDF.',
  'No se pudo guardar la evidencia en el almacenamiento de documentos. Intenta nuevamente.': 'The evidence could not be saved to document storage. Please try again.',
  'Archivo de evidencia no encontrado': 'Evidence file not found',
  'La frase de confirmación no coincide con ninguna de las declaraciones indicadas.': 'The confirmation phrase does not match either of the authorized declarations.',
  'Ya confirmaste tu capital operativo para esta subcuenta.': 'You already confirmed your operating capital for this subaccount.',
  'Selecciona al menos una notificación.': 'Select at least one notification.',
  'Escribe la frase de confirmación.': 'Type the confirmation phrase.',
  'Solo se puede corregir un reporte rechazado.': 'Only a rejected report can be corrected.',
  'Formato de archivo no permitido. Solo JPG, PNG, WEBP o PDF.': 'File format not allowed. Only JPG, PNG, WEBP or PDF.',
  'Cada archivo puede pesar como máximo 10 MB.': 'Each file can be at most 10 MB.',
  'Puedes adjuntar como máximo 5 archivos.': 'You can attach up to 5 files.',
  'Uno de los archivos está vacío.': 'One of the files is empty.',
  'No se pudieron guardar los archivos adjuntos. Intenta nuevamente.': 'The attachments could not be saved. Please try again.',
  'Archivo adjunto no encontrado': 'Attachment not found',
  'Ese número es el UID de recepción de QLC, no el N.º de orden. Ingresa el número de orden que te dio Bitget.':
    "That number is QLC's receiving UID, not the order No. Enter the order number Bitget gave you.",
  'El PDF del estado de cuenta supera el límite de 15 MB.': 'The statement PDF exceeds the 15 MB limit.',
  'No se pudo procesar el PDF adjunto.': 'The attached PDF could not be processed.',
  'No se pudo guardar el PDF del estado de cuenta en Google Drive. Intenta nuevamente.': 'The statement PDF could not be saved to Google Drive. Please try again.',
  'No pudimos conectar con Google Drive para guardar el PDF. Ve a Configuración → Google Drive en el panel administrativo.': 'We could not connect to Google Drive to save the PDF. Go to Settings → Google Drive in the admin panel.',
  'El número de caso indicado no existe o no pertenece a tu cuenta.': 'The selected case number does not exist or does not belong to your account.',
  'El caso indicado está cerrado y ya no admite nuevas citas.': 'The selected case is closed and no longer accepts new appointments.',
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

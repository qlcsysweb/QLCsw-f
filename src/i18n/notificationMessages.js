/*
 * Resuelve el título/mensaje de una notificación generada por el sistema
 * (ver backend/src/utils/notify.js). Cada notificación NUEVA trae
 * templateKey + templateParams (códigos/valores, nunca texto ya
 * traducido); aquí se arma la frase final en el idioma activo usando las
 * plantillas de translations.js → notificationTemplates y los mismos
 * mapas de estado ya usados en el resto de la interfaz (utils/statusLabels.js).
 *
 * Si la notificación no tiene templateKey (histórica, previa a este
 * cambio, o de un tipo no catalogado), se muestra tal cual el texto
 * literal que ya tenía guardado — nunca se pierde ni se mezcla idioma.
 */

const STATUS_LABEL_KEYS = {
  payment_status_updated: {
    status: {
      PENDING: 'status.paymentReport.pending',
      EN_REVISION: 'status.paymentReport.inReview',
      APROBADO: 'status.paymentReport.approved',
      RECHAZADO: 'status.paymentReport.rejected',
    },
  },
  appointment_status_updated: {
    status: {
      PENDING: 'status.appointment.pending',
      AUTORIZADA: 'status.appointment.authorized',
      RECHAZADA: 'status.appointment.rejected',
      COMPLETADA: 'status.appointment.completed',
      CANCELADA: 'status.appointment.cancelled',
    },
  },
  api_connection_status_updated: {
    status: {
      CONECTADA: 'status.apiConnection.connected',
      DESCONECTADA: 'status.apiConnection.disconnected',
      PENDIENTE: 'status.apiConnection.pending',
    },
  },
  contract_status_updated: {
    status: {
      PENDING: 'status.contract.pending',
      UPLOADED: 'status.contract.uploaded',
      RECEIVED_SIGNED: 'status.contract.receivedSigned',
      REJECTED: 'status.contract.rejected',
    },
  },
  process_condition_updated: {
    status: {
      PENDING: 'status.condition.pending',
      CONFIRMED: 'status.condition.completed',
      REJECTED: 'status.condition.rejected',
    },
    conditionType: {
      WALLET: 'status.conditionType.WALLET',
      CONTRACT: 'status.conditionType.CONTRACT',
      FUNDS: 'status.conditionType.FUNDS',
      PAYMENT: 'status.conditionType.PAYMENT',
      API: 'status.conditionType.API',
      ACTIVATION: 'status.conditionType.ACTIVATION',
    },
  },
  document_resubmit: {
    category: {
      identificacion: 'clientDocuments.categoryId',
      otro: 'clientDocuments.categoryOther',
    },
  },
};

function interpolate(template, templateKey, params, t) {
  const labelKeys = STATUS_LABEL_KEYS[templateKey] || {};
  return template.replace(/\{(\w+)\}/g, (_, paramName) => {
    const raw = params?.[paramName];
    if (raw === undefined || raw === null) return '';
    const labelKeyMap = labelKeys[paramName];
    if (labelKeyMap && labelKeyMap[raw]) return t(labelKeyMap[raw]);
    // Valor libre (monto, moneda) o código no catalogado — se muestra tal
    // cual, nunca se inventa una traducción.
    return String(raw);
  });
}

export function resolveNotification(notification, t) {
  const { templateKey, templateParams, title, message } = notification;
  if (!templateKey) return { title, message };

  const titleTemplate = t(`notificationTemplates.${templateKey}.title`, null);
  const messageTemplate = t(`notificationTemplates.${templateKey}.message`, null);
  if (!titleTemplate || !messageTemplate) return { title, message };

  return {
    title: interpolate(titleTemplate, templateKey, templateParams, t),
    message: interpolate(messageTemplate, templateKey, templateParams, t),
  };
}

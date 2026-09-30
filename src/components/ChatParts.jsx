import { useRef, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import MessageAttachments from './MessageAttachments';
import { appointmentUtcInstant, appointmentMexicoTime } from '../utils/cdmxTime';

/*
 * Piezas compartidas del chat de citas (cliente y admin): lista de mensajes
 * con archivos adjuntos y botón para enviar un archivo (imagen o PDF, 10 MB).
 * Los archivos se sirven por la API autenticada (`${apiBase}/chat/:id/files/
 * :messageId`), nunca por un enlace directo de Drive.
 */
const CHAT_FILE_TYPES = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_CHAT_FILE_BYTES = 10 * 1024 * 1024;

export function ChatMessages({ messages, currentUserId, youLabel, otherLabel, apiBase, sessionId, emptyLabel }) {
  if (!messages.length) return <div className="qlc-empty">{emptyLabel}</div>;
  return messages.map((m) => (
    <div key={m.id} className="qlc-chat-msg">
      <strong>{m.senderUserId === currentUserId ? youLabel : otherLabel}:</strong>
      {m.content ? ` ${m.content}` : ''}
      {m.fileName && (
        <MessageAttachments
          attachments={[{ id: m.id, fileName: m.fileName, mimeType: m.mimeType }]}
          baseUrl={`${apiBase}/chat/${sessionId}`}
        />
      )}
    </div>
  ));
}

export function ChatFileButton({ apiBase, sessionId, onSent, onError }) {
  const { t, language } = useLanguage();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_CHAT_FILE_BYTES) {
      onError?.(t('chatFiles.tooBig'));
      return;
    }
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    onError?.('');
    try {
      await api.post(`${apiBase}/chat/${sessionId}/files`, form);
      onSent?.();
    } catch (err) {
      onError?.(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={CHAT_FILE_TYPES} onChange={pick} hidden />
      <button
        type="button"
        className="qlc-btn ghost qlc-chat-file-btn"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title={t('chatFiles.hint')}
        aria-label={t('chatFiles.attach')}
      >
        {uploading ? (
          t('chatFiles.uploading')
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16.5 6.5v10.25a4.5 4.5 0 0 1-9 0V5.75a3 3 0 0 1 6 0v10a1.5 1.5 0 0 1-3 0V6.5H9v9.25a3 3 0 0 0 6 0v-10a4.5 4.5 0 0 0-9 0v11a6 6 0 0 0 12 0V6.5h-1.5Z"
            />
          </svg>
        )}
      </button>
    </>
  );
}

// Hora a partir de la cual se puede iniciar el chat (la de la cita, UTC).
// null si la sesión no está ligada a una cita con hora.
export function chatOpensAt(session) {
  const a = session?.appointment;
  if (!a?.requestedDate || !a?.requestedTime) return null;
  return appointmentUtcInstant(a.requestedDate, a.requestedTime);
}

// "19:30 UTC" (cliente) o "13:30 hora de México (19:30 UTC)" (admin).
export function chatOpensLabel(session, t, { mexico = false } = {}) {
  const a = session?.appointment;
  if (!a?.requestedTime) return '';
  if (!mexico) return `${a.requestedTime} UTC`;
  const mx = appointmentMexicoTime(a.requestedDate, a.requestedTime);
  return `${mx.time} ${t('adminAppointments.mexicoTime')} (${a.requestedTime} UTC)`;
}

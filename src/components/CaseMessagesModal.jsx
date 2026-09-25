import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { translateBackendMessage } from '../i18n/backendMessages';
import { formatCdmxDateTime } from '../utils/cdmxTime';
import './CaseMessagesModal.css';

export const MAX_CASE_FILE_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * Botón "Mensajes" de un caso: apagado sin mensajes nuevos; encendido con
 * el indicador "TIENES UN NUEVO MENSAJE" cuando la contraparte escribió y
 * todavía no se abrió la conversación (estado real del backend, no local).
 */
export function CaseMessagesButton({ hasUnread, unreadCount = 0, onClick }) {
  const { t } = useLanguage();
  return (
    <span className="qlc-case-msg-wrap">
      <button
        type="button"
        className={`qlc-btn qlc-case-msg-btn${hasUnread ? ' on' : ' off'}`}
        onClick={onClick}
        aria-label={hasUnread ? t('caseMessaging.newMessage') : t('caseMessaging.button')}
      >
        ✉ {t('caseMessaging.button')}
        {hasUnread && unreadCount > 0 && <span className="qlc-case-msg-count">{unreadCount}</span>}
      </button>
      {hasUnread && (
        <span className="qlc-case-msg-flag">
          <span className="qlc-case-msg-dot" aria-hidden="true" /> {t('caseMessaging.newMessage')}
        </span>
      )}
    </span>
  );
}

/*
 * MENSAJERÍA INTERNA DEL CASO — conversación permanente asociada al caso
 * (no es el chat de citas ni el chat temporal de soporte). Se abre como
 * modal y SOLO se cierra con la X: no hay cierre por clic en el fondo ni
 * con Escape. Abrirlo marca como leídos los mensajes de la contraparte
 * (lo hace el backend al listar los mensajes) y conserva el historial.
 *
 * apiBase: '/client' o '/admin' — mismas rutas, permisos distintos en backend.
 */
export default function CaseMessagesModal({ apiBase, supportCase, onClose }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState(null);
  const [files, setFiles] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const scrollRef = useRef(null);
  const lastCount = useRef(0);
  const base = `${apiBase}/support-cases/${supportCase.id}`;

  const refresh = () => {
    api
      .get(`${base}/messages`)
      .then(({ data }) => setMessages(data.messages))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
    api
      .get(`${base}/files`)
      .then(({ data }) => setFiles(data.files))
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportCase.id]);

  // Baja al último mensaje solo cuando llega uno nuevo.
  useEffect(() => {
    if (messages && messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.post(`${base}/messages`, { content: content.trim() });
      setContent('');
      refresh();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSending(false);
    }
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileError('');
    // Validación de comodidad en el navegador; el límite real (5 MB) se
    // vuelve a validar y hace cumplir en el servidor.
    if (file.size > MAX_CASE_FILE_BYTES) {
      setFileError(t('caseMessaging.fileTooBig'));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`${base}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      refresh();
    } catch (err) {
      setFileError(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
    }
  };

  // La descarga exige sesión: se pide con el token y se guarda como blob.
  const downloadFile = (f) => {
    api
      .get(`${base}/files/${f.id}/download`, { responseType: 'blob' })
      .then(({ data }) => {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      })
      .catch((err) => setFileError(translateBackendMessage(err.message, language)));
  };

  const senderLabel = (m) => {
    if (m.senderUserId === user.id) return t('caseMessaging.you');
    if (m.sender?.role === 'ADMIN') {
      const name = [m.sender.adminProfile?.firstName, m.sender.adminProfile?.lastName].filter(Boolean).join(' ');
      return name ? `QLC · ${name}` : 'QLC';
    }
    return t('caseMessaging.client');
  };

  return (
    <Modal
      title={`${t('caseMessaging.caseTitle')} #${supportCase.caseNumber}`}
      subtitle={supportCase.subject}
      onClose={onClose}
      width={680}
    >
      <div className="qlc-case-modal">
        <section className="qlc-case-files">
          <div className="qlc-case-files-head">
            <strong>{t('caseMessaging.files')}</strong>
            <label className={`qlc-btn ghost qlc-case-attach${uploading ? ' disabled' : ''}`}>
              {uploading ? t('common.sending') : `📎 ${t('caseMessaging.attach')}`}
              <input type="file" onChange={onPickFile} disabled={uploading} hidden />
            </label>
          </div>
          <p className="qlc-case-hint">{t('caseMessaging.fileHint')}</p>
          {fileError && <div className="qlc-field-error">{fileError}</div>}
          {files.length > 0 && (
            <ul className="qlc-case-file-list">
              {files.map((f) => (
                <li key={f.id}>
                  <button type="button" className="qlc-case-file-link" onClick={() => downloadFile(f)}>
                    {f.fileName}
                  </button>
                  <span className="qlc-case-file-meta">
                    {formatBytes(f.sizeBytes)} · {formatCdmxDateTime(f.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="qlc-case-thread" ref={scrollRef} aria-live="polite">
          {messages === null ? (
            <p className="qlc-case-empty">{t('common.loading')}</p>
          ) : messages.length === 0 ? (
            <p className="qlc-case-empty">{t('caseMessaging.noMessages')}</p>
          ) : (
            messages.map((m) => {
              const mine = m.senderUserId === user.id;
              return (
                <div key={m.id} className={`qlc-case-bubble ${mine ? 'mine' : 'theirs'}`}>
                  <div className="qlc-case-bubble-head">
                    <strong>{senderLabel(m)}</strong>
                    <span>{formatCdmxDateTime(m.createdAt)}</span>
                  </div>
                  <div className="qlc-case-bubble-body">{m.content}</div>
                </div>
              );
            })
          )}
        </section>

        {error && <div className="qlc-field-error">{error}</div>}
        <form className="qlc-case-compose" onSubmit={send}>
          <textarea
            className="qlc-textarea"
            rows={2}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('caseMessaging.placeholder')}
          />
          <button className="qlc-btn primary" disabled={sending || !content.trim()}>
            {sending ? t('common.sending') : t('caseMessaging.send')}
          </button>
        </form>
      </div>
    </Modal>
  );
}

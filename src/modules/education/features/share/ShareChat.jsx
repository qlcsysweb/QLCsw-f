import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client.js';
import { dateTime } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

export function ShareChat({ clientId = null }) {
  const base = clientId ? `/admin/clients/${clientId}/data-share/messages` : '/auth/data-share/messages';
  const mine = clientId ? 'ADMIN' : 'CLIENT';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [closed, setClosed] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await api.get(base);
        if (!alive) return;
        setMessages(data.messages);
        setClosed(false);
      } catch {
        if (alive) setClosed(true);
      }
    };
    load();
    const timer = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [base]);

  useEffect(() => {
    if (open) setSeen(messages.length);
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const message = await api.post(base, { body: text });
      setMessages((m) => [...m, message]);
      setText('');
    } catch {
      setClosed(true);
    } finally {
      setBusy(false);
    }
  };

  const unread = messages.slice(seen).filter((m) => m.senderRole !== mine).length;

  if (!open) {
    return (
      <button type="button" className="share-chat-toggle" onClick={() => setOpen(true)}>
        💬 {tr('Chat con {who}', { who: clientId ? tr('el cliente') : tr('tu asesor') })}
        {unread > 0 && <span className="share-chat-badge">{unread}</span>}
      </button>
    );
  }

  return (
    <div className="share-chat" role="dialog" aria-label={tr('Chat temporal')}>
      <div className="share-chat-head">
        <b>{tr('Chat temporal')}</b>
        <button type="button" className="btn-link" onClick={() => setOpen(false)}>{tr('Minimizar')}</button>
      </div>
      <p className="share-chat-note">{tr('Este chat solo existe mientras se comparten los datos. Al terminar el acceso se cierra y los mensajes se borran.')}</p>
      <div className="share-chat-list" ref={listRef}>
        {messages.length === 0 && <p className="small muted">{tr('Aún no hay mensajes.')}</p>}
        {messages.map((m) => (
          <div key={m.id} className={`share-chat-msg ${m.senderRole === mine ? 'mine' : ''}`}>
            <span className="share-chat-meta">{m.senderRole === mine ? tr('Tú') : tr(m.senderName || 'Cliente')} · {dateTime(m.createdAt)}</span>
            <span>{m.body}</span>
          </div>
        ))}
      </div>
      {closed ? (
        <p className="small muted share-chat-closed">{tr('El chat se cerró porque ya no se están compartiendo los datos.')}</p>
      ) : (
        <form className="share-chat-form" onSubmit={send}>
          <input className="input" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder={tr('Escribe un mensaje…')} />
          <button type="submit" className="btn-primary" disabled={busy || !text.trim()}>{tr('Enviar')}</button>
        </form>
      )}
    </div>
  );
}

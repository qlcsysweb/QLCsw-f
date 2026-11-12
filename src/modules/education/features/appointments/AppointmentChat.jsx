import { useEffect, useRef, useState } from 'react';
import { dateTime, utcDateTime } from '../../utils/format.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FormError } from '../../components/ui/Form.jsx';
import { tr } from '../../i18n/tr.js';

const POLL_MS = 4000;
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

const two = (n) => String(n).padStart(2, '0');
function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

// Contador con la hora del servidor: cuánto falta para la cita o cuánto queda de los minutos de la sesión.
function Countdown({ chat, offset }) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  const start = new Date(chat.startsAt).getTime();
  const end = new Date(chat.endsAt).getTime();
  if (chat.phase === 'NOT_CONFIRMED') return <p className="appt-chat-timer is-wait">{tr('El chat se abre cuando la cita esté confirmada.')}</p>;
  if (now < start) return <p className="appt-chat-timer is-wait">{tr('La sesión empieza en')} <b>{clock(start - now)}</b> · {tr('{n} minutos de sesión', { n: chat.minutes })}</p>;
  if (now <= end && chat.phase !== 'ENDED') return <p className="appt-chat-timer is-live">{tr('Sesión en curso · tiempo restante')} <b>{clock(end - now)}</b></p>;
  return <p className="appt-chat-timer is-ended">{tr('La sesión terminó. El chat queda solo para consulta.')}</p>;
}

// Chat interno de una cita confirmada. `base`: ruta de la API (cliente o administrador);
// `filePath(id)`: ruta para abrir un archivo; `mine`: 'CLIENT' o 'ADMIN'.
export function AppointmentChat({ api, base, filePath, mine, onClose }) {
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [state, setState] = useState({ busy: false, error: null });
  const listRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = () => api.get(base).then((res) => {
      if (!alive) return;
      setData(res);
      setState((st) => (st.error && !st.busy ? { ...st, error: null } : st));
      if (res.chat?.serverTime) setOffset(new Date(res.chat.serverTime).getTime() - Date.now());
    }).catch((error) => alive && setState((s) => ({ ...s, error })));
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [api, base]);

  const count = data?.messages?.length || 0;
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [count]);

  const pick = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    const big = picked.find((f) => f.size > MAX_BYTES);
    if (big) return setState({ busy: false, error: new Error(tr('El archivo «{name}» pesa más de 5 MB.', { name: big.name })) });
    if (files.length + picked.length > MAX_FILES) return setState({ busy: false, error: new Error(tr('Puedes adjuntar como máximo 5 archivos.')) });
    setState({ busy: false, error: null });
    return setFiles([...files, ...picked]);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() && !files.length) return;
    setState({ busy: true, error: null });
    try {
      const form = new FormData();
      form.append('body', text.trim());
      files.forEach((f) => form.append('files', f));
      const created = await api.upload(base, form);
      setData((d) => ({ ...d, messages: [...(d?.messages || []), ...created] }));
      setText('');
      setFiles([]);
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  const openFile = (id) => {
    const win = window.open('', '_blank');
    api.blobUrl(filePath(id)).then((url) => {
      if (win) win.location.href = url;
      else window.location.href = url;
    }).catch((err) => {
      if (win) win.close();
      setState({ busy: false, error: err });
    });
  };

  const appt = data?.appointment;
  const canSend = data?.chat?.canSend;
  return (
    <Modal open wide title={appt ? tr('Chat de la cita · {date}', { date: utcDateTime(appt.scheduledAt) }) : tr('Chat de la cita')} onClose={onClose}>
      {!data && state.error ? <FormError error={state.error} /> : !data ? <p className="muted">{tr('Cargando…')}</p> : (
        <div className="appt-chat">
          <Countdown chat={data.chat} offset={offset} />
          {mine === 'ADMIN' && appt?.user && <p className="small muted">{tr('Cliente')}: <b>{appt.user.name}</b> · {appt.user.email}</p>}
          <div className="appt-chat-list" ref={listRef}>
            {data.messages.length === 0 && <p className="small muted">{tr('Aún no hay mensajes.')}</p>}
            {data.messages.map((m) => (
              <div key={m.id} className={`share-chat-msg ${m.senderRole === mine ? 'mine' : ''}`}>
                <span className="share-chat-meta">{m.senderRole === mine ? tr('Tú') : m.senderRole === 'ADMIN' ? tr('Asesor QLC') : m.senderName} · {dateTime(m.createdAt)}</span>
                {m.body && <span>{m.body}</span>}
                {m.file && <button type="button" className="btn-link appt-chat-file" onClick={() => openFile(m.file.id)}>📎 {m.file.name}</button>}
              </div>
            ))}
          </div>
          {canSend ? (
            <form className="appt-chat-form" onSubmit={send}>
              <textarea className="input" rows={2} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder={tr('Escribe un mensaje…')} />
              {files.length > 0 && (
                <ul className="small appt-chat-pending">
                  {files.map((f, i) => <li key={`${f.name}-${i}`}>📎 {f.name} <button type="button" className="btn-link" onClick={() => setFiles(files.filter((_, n) => n !== i))}>{tr('Quitar')}</button></li>)}
                </ul>
              )}
              <div className="form-actions">
                <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={pick} />
                <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>{tr('Adjuntar archivo')}</Button>
                <Button type="submit" loading={state.busy} disabled={!text.trim() && !files.length}>{tr('Enviar')}</Button>
              </div>
              <p className="small muted">{tr('Imágenes JPG, PNG, WEBP o PDF, de máximo 5 MB cada uno.')}</p>
            </form>
          ) : null}
          <FormError error={state.error} />
        </div>
      )}
    </Modal>
  );
}

// Abre el chat indicado en la dirección (?chat=ID), p. ej. al entrar desde una notificación.
export function chatFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('chat');
  } catch {
    return null;
  }
}

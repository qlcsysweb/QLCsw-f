import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { dateTime } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

const POLL_MS = 60000;

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
    </svg>
  );
}

// Campana del encabezado con la bandeja de notificaciones en un panel a la derecha.
export function NotificationsBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const [selected, setSelected] = useState(() => new Set());
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/notifications').then((res) => {
    setData(res);
    setSelected((prev) => new Set([...prev].filter((id) => res.notifications.some((n) => n.id === id))));
  }).catch(() => null), []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = (ids) => run(async () => {
    await api.post('/notifications/delete', { ids });
    setSelected((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
  });
  const removeAll = () => run(async () => {
    await api.post('/notifications/delete-all', {});
    setSelected(new Set());
    setConfirmAll(false);
  });
  const readAll = () => run(() => api.post('/notifications/read-all', {}));

  const openItem = async (n) => {
    if (!n.isRead) await api.post('/notifications/read', { ids: [n.id] }).catch(() => null);
    if (n.link) {
      setOpen(false);
      const [path, hash] = n.link.split('#');
      navigate(hash ? `${path}#${hash}` : path);
    } else {
      load();
    }
  };

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const list = data.notifications;
  const allSelected = list.length > 0 && list.every((n) => selected.has(n.id));

  return (
    <>
      <button type="button" className="notif-bell" onClick={() => setOpen(true)} aria-label={tr('Notificaciones')} aria-haspopup="dialog">
        <BellIcon />
        {data.unread > 0 && <span className="notif-bell-count">{data.unread > 99 ? '99+' : data.unread}</span>}
      </button>
      {open && createPortal(
        <div className="notif-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <aside className="notif-panel" role="dialog" aria-modal="true" aria-label={tr('Notificaciones')}>
            <header className="notif-head">
              <div>
                <span className="section-kicker">{tr('Bandeja')}</span>
                <h3>{tr('Notificaciones')}</h3>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={tr('Cerrar')}>×</button>
            </header>

            {list.length > 0 && (
              <div className="notif-toolbar">
                <label className="notif-check">
                  <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(list.map((n) => n.id)))} />
                  <span>{allSelected ? tr('Quitar selección') : tr('Seleccionar todo')}</span>
                </label>
                <div className="notif-toolbar-actions">
                  {data.unread > 0 && <button type="button" className="btn-link" disabled={busy} onClick={readAll}>{tr('Marcar todo como leído')}</button>}
                  {selected.size > 0 && (
                    <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => remove([...selected])}>
                      <TrashIcon /> {tr('Eliminar ({n})', { n: selected.size })}
                    </button>
                  )}
                  <button type="button" className="btn-danger btn-sm" disabled={busy} onClick={() => setConfirmAll(true)}><TrashIcon /> {tr('Eliminar todas')}</button>
                </div>
              </div>
            )}

            {confirmAll && (
              <div className="notif-confirm" role="alert">
                <p>{tr('¿Eliminar todas tus notificaciones? No se pueden recuperar.')}</p>
                <div className="row-actions">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmAll(false)}>{tr('Cancelar')}</button>
                  <button type="button" className="btn-danger btn-sm" disabled={busy} onClick={removeAll}>{tr('Eliminar todas')}</button>
                </div>
              </div>
            )}

            <div className="notif-list">
              {list.length === 0 && <p className="notif-empty">{tr('No tienes notificaciones.')}</p>}
              {list.map((n) => (
                <article key={n.id} className={`notif-item ${n.isRead ? 'is-read' : ''} ${selected.has(n.id) ? 'is-selected' : ''}`}>
                  <input type="checkbox" checked={selected.has(n.id)} onChange={() => toggle(n.id)} aria-label={tr('Seleccionar')} />
                  <button type="button" className="notif-body" onClick={() => openItem(n)}>
                    <span className="notif-title">{!n.isRead && <i className="notif-dot" aria-hidden="true" />}{n.title}</span>
                    {n.message && <span className="notif-message">{n.message}</span>}
                    <span className="notif-date">{dateTime(n.createdAt)}</span>
                  </button>
                  <button type="button" className="notif-delete" disabled={busy} onClick={() => remove([n.id])} aria-label={tr('Eliminar notificación')}><TrashIcon /></button>
                </article>
              ))}
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}

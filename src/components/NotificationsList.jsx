import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveNotification } from '../i18n/notificationMessages';
import { resolveNotificationLink } from '../i18n/notificationLinks';
import usePolling from '../hooks/usePolling';
import ConfirmModal from './ConfirmModal';

/*
 * Bandeja de notificaciones compartida por cliente y admin (antes eran dos
 * copias idénticas). `scope` = 'client' | 'admin' → /{scope}/notifications.
 * Permite eliminar una, varias (casillas) o todas ("Seleccionar todo"); el
 * backend solo borra notificaciones del usuario autenticado.
 */
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
    </svg>
  );
}

export default function NotificationsList({ scope }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const role = scope === 'admin' ? 'ADMIN' : 'CLIENT';
  const base = `/${scope}/notifications`;
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  // ids a eliminar pendientes de confirmación (null = sin modal).
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = () =>
    api.get(base).then(({ data }) => {
      setNotifications(data.notifications);
      // Descarta de la selección las que ya no existen (ej. borradas por la
      // limpieza automática de 34 días entre un sondeo y otro).
      setSelected((prev) => {
        const alive = new Set(data.notifications.map((n) => n.id));
        const next = new Set([...prev].filter((id) => alive.has(id)));
        return next.size === prev.size ? prev : next;
      });
    });
  useEffect(() => {
    load();
  }, []);
  // Actualización sin refresh manual: nuevas notificaciones aparecen solas.
  usePolling(load, 8000);

  const markRead = async (id) => {
    await api.patch(`${base}/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post(`${base}/read-all`);
    load();
  };

  const deleteIds = async (ids) => {
    await api.post(`${base}/delete`, { ids });
    setSelected((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
    await load();
  };

  // Clic en una notificación = acceso directo a lo que la originó (ver
  // notificationLinks.js). Siempre marca como leída primero.
  const openNotification = async (n) => {
    if (!n.isRead) await markRead(n.id);
    const link = resolveNotificationLink(n, role);
    if (!link) return;
    if (link.external) {
      window.open(link.url, '_blank');
    } else {
      navigate(link.path);
    }
  };

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = notifications.length > 0 && notifications.every((n) => selected.has(n.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(notifications.map((n) => n.id)));

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">{t('clientNotifications.kicker')}</div>
          <h1 style={{ margin: 0 }}>{t('clientNotifications.title')}</h1>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button className="qlc-btn ghost" onClick={markAllRead}>
            {t('clientNotifications.markAllRead')}
          </button>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="qlc-notif-toolbar">
          <label className="qlc-notif-check">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>{allSelected ? t('clientNotifications.deselectAll') : t('clientNotifications.selectAll')}</span>
          </label>
          {selected.size > 0 && (
            <span className="qlc-notif-count">{t('clientNotifications.selectedCount').replace('{count}', selected.size)}</span>
          )}
          <div className="qlc-notif-toolbar-actions">
            <button
              type="button"
              className="qlc-btn ghost qlc-btn-icon"
              disabled={selected.size === 0}
              onClick={() => setPendingDelete([...selected])}
            >
              <TrashIcon />
              {t('clientNotifications.deleteSelected')}
              {selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
            <button
              type="button"
              className="qlc-btn danger qlc-btn-icon"
              onClick={() => setPendingDelete(notifications.map((n) => n.id))}
            >
              <TrashIcon />
              {t('clientNotifications.deleteAll')}
            </button>
          </div>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="qlc-empty">{t('clientNotifications.none')}</div>
      ) : (
        notifications.map((n) => {
          const { title, message } = resolveNotification(n, t);
          const hasLink = Boolean(resolveNotificationLink(n, role));
          const isSelected = selected.has(n.id);
          return (
            <div
              key={n.id}
              className={`qlc-card qlc-notif-item${isSelected ? ' is-selected' : ''}`}
              style={{
                opacity: n.isRead && !isSelected ? 0.6 : 1,
                cursor: hasLink || !n.isRead ? 'pointer' : 'default',
              }}
              onClick={() => openNotification(n)}
            >
              {/* Casilla y papelera no deben abrir la notificación. */}
              <label className="qlc-notif-check" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(n.id)}
                  aria-label={t('clientNotifications.selectOne').replace('{title}', title)}
                />
              </label>
              <div className="qlc-notif-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{title}</strong>
                  {!n.isRead && <span className="qlc-badge ok">{t('clientNotifications.newBadge')}</span>}
                </div>
                <p style={{ color: 'var(--qlc-muted)', fontSize: 13, margin: '6px 0 0', whiteSpace: 'pre-line' }}>{message}</p>
                <div style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                className="qlc-notif-delete"
                title={t('clientNotifications.deleteOne')}
                aria-label={t('clientNotifications.deleteOne')}
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete([n.id]);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          );
        })
      )}

      {pendingDelete && (
        <ConfirmModal
          title={t('clientNotifications.deleteTitle')}
          message={
            pendingDelete.length === 1
              ? t('clientNotifications.deleteConfirmOne')
              : pendingDelete.length === notifications.length
                ? t('clientNotifications.deleteConfirmAll').replace('{count}', pendingDelete.length)
                : t('clientNotifications.deleteConfirmMany').replace('{count}', pendingDelete.length)
          }
          confirmLabel={t('clientNotifications.deleteConfirmBtn')}
          onConfirm={() => deleteIds(pendingDelete)}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

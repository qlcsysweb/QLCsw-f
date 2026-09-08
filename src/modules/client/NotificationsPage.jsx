import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  const load = () => api.get('/client/notifications').then(({ data }) => setNotifications(data.notifications));
  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.patch(`/client/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post('/client/notifications/read-all');
    load();
  };

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">NOTIFICACIONES</div>
          <h1 style={{ margin: 0 }}>Notificaciones</h1>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button className="qlc-btn ghost" onClick={markAllRead}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="qlc-empty">Sin notificaciones.</div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className="qlc-card"
            style={{ marginBottom: 10, opacity: n.isRead ? 0.6 : 1, cursor: n.isRead ? 'default' : 'pointer' }}
            onClick={() => !n.isRead && markRead(n.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{n.title}</strong>
              {!n.isRead && <span className="qlc-badge ok">Nuevo</span>}
            </div>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13, margin: '6px 0 0' }}>{n.message}</p>
            <div style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>
              {new Date(n.createdAt).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

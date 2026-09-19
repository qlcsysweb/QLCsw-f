import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { resolveNotification } from '../../i18n/notificationMessages';
import { resolveNotificationLink } from '../../i18n/notificationLinks';
import usePolling from '../../hooks/usePolling';

/*
 * AUDITORÍA FINAL — Pendiente #1: el panel admin no tenía ninguna vista de
 * notificaciones, por lo que la alerta de vencimiento de contrato (ADMIN 13)
 * se generaba en BD pero nunca era visible. Reutiliza exactamente el mismo
 * patrón que client/NotificationsPage.jsx contra /admin/notifications.
 */
export default function NotificationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  const load = () => api.get('/admin/notifications').then(({ data }) => setNotifications(data.notifications));
  useEffect(() => {
    load();
  }, []);
  // Actualización sin refresh manual: nuevas notificaciones aparecen solas.
  usePolling(load, 8000);

  const markRead = async (id) => {
    await api.patch(`/admin/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post('/admin/notifications/read-all');
    load();
  };

  // Clic en una notificación = acceso directo a lo que la originó (ver
  // notificationLinks.js). Siempre marca como leída primero; el enlace
  // externo (ej. PDF del chat) se abre en pestaña nueva, uno interno
  // navega dentro del panel.
  const openNotification = async (n) => {
    if (!n.isRead) await markRead(n.id);
    const link = resolveNotificationLink(n, 'ADMIN');
    if (!link) return;
    if (link.external) {
      window.open(link.url, '_blank');
    } else {
      navigate(link.path);
    }
  };

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

      {notifications.length === 0 ? (
        <div className="qlc-empty">{t('clientNotifications.none')}</div>
      ) : (
        notifications.map((n) => {
          const { title, message } = resolveNotification(n, t);
          const hasLink = Boolean(resolveNotificationLink(n, 'ADMIN'));
          return (
            <div
              key={n.id}
              className="qlc-card"
              style={{
                marginBottom: 10,
                opacity: n.isRead ? 0.6 : 1,
                cursor: hasLink || !n.isRead ? 'pointer' : 'default',
              }}
              onClick={() => openNotification(n)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{title}</strong>
                {!n.isRead && <span className="qlc-badge ok">{t('clientNotifications.newBadge')}</span>}
              </div>
              <p style={{ color: 'var(--qlc-muted)', fontSize: 13, margin: '6px 0 0' }}>{message}</p>
              <div style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: 6 }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

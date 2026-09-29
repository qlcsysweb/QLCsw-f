import NotificationsList from '../../components/NotificationsList';

/*
 * AUDITORÍA FINAL — Pendiente #1: el panel admin no tenía ninguna vista de
 * notificaciones, por lo que la alerta de vencimiento de contrato (ADMIN 13)
 * se generaba en BD pero nunca era visible. Mismo componente que el cliente
 * contra /admin/notifications.
 */
export default function NotificationsPage() {
  return <NotificationsList scope="admin" />;
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatCdmxDateTime } from '../../utils/cdmxTime';
import usePolling from '../../hooks/usePolling';

/*
 * BANDEJA DE ENTRADA — mensajería interna admin↔cliente. Deliberadamente
 * distinta del chat de citas y de los casos de soporte (ver adminMessageController.js).
 * Cada renglón es un cliente que le escribió a ESTE administrador; abrir un
 * renglón lleva a la ficha del cliente, donde ya existe la tarjeta completa
 * de mensajería (envío + historial) — no se duplica esa lógica aquí.
 */
export default function MessagesPage() {
  const { t } = useLanguage();
  const [inbox, setInbox] = useState([]);

  const load = () => api.get('/admin/messages').then(({ data }) => setInbox(data.inbox));
  useEffect(() => {
    load();
  }, []);
  usePolling(load, 8000);

  return (
    <div>
      <div className="qlc-kicker">{t('adminMessagesInbox.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminMessagesInbox.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('adminMessagesInbox.intro')}</p>

      <div className="qlc-card">
        <h3 style={{ marginTop: 0 }}>
          {t('adminMessagesInbox.inboxTitle')} ({inbox.length})
        </h3>
        {inbox.length === 0 ? (
          <div className="qlc-empty">{t('adminMessagesInbox.none')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {inbox.map((row) => (
              <li key={row.client.id} className="qlc-message-item">
                <Link to={`/admin/clients/${row.client.id}`} className="qlc-message-inbox-row">
                  <span className="qlc-message-inbox-client">
                    {row.unreadCount > 0 && <span aria-hidden="true">🔵</span>}
                    <strong>
                      {row.client.firstName} {row.client.lastName}
                    </strong>
                    {row.client.username && <span style={{ color: 'var(--qlc-muted2)' }}> · {row.client.username}</span>}
                  </span>
                  <span style={{ color: 'var(--qlc-muted)', fontSize: 12 }}>{row.lastTitle}</span>
                  <span style={{ color: 'var(--qlc-muted2)', fontSize: 12 }}>{formatCdmxDateTime(row.lastAt)}</span>
                  {row.unreadCount > 0 ? (
                    <span className="qlc-badge warn">{t('adminMessagesInbox.unread')}</span>
                  ) : (
                    <span className="qlc-badge muted">{t('adminMessagesInbox.read')}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

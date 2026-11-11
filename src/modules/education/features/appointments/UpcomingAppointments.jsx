import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { utcDateTime } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

const POLL_MS = 60000;

// Barra del administrador: próximas citas (pendientes o confirmadas). Una confirmada lleva directo a su chat.
export function UpcomingAppointments() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let alive = true;
    const load = () => api.get('/admin/appointments/upcoming').then((rows) => alive && setItems(rows)).catch(() => null);
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  if (!items.length) return null;
  return (
    <div className="nav-upcoming">
      <div className="nav-upcoming-title"><span>{tr('Próximas citas')}</span><Link to="/admin/citas" className="btn-link small">{tr('Ver todas')}</Link></div>
      {items.map((a) => (
        <Link key={a.id} to={a.status === 'CONFIRMED' ? `/admin/citas?chat=${a.id}` : '/admin/citas'} className={a.chat?.phase === 'LIVE' ? 'is-live' : ''}>
          <span>{a.user?.name}</span>
          <small>{utcDateTime(a.scheduledAt)} · {a.durationMin} min</small>
          <small>{a.status === 'CONFIRMED' ? (a.chat?.phase === 'LIVE' ? tr('En curso · entrar al chat') : tr('Confirmada · abrir chat')) : tr('Pendiente de confirmar')}</small>
        </Link>
      ))}
    </div>
  );
}

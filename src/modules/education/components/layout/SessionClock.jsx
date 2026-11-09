import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { tr } from '../../i18n/tr.js';

const ZONES = {
  CDMX: 'America/Mexico_City',
  UTC: 'UTC',
};
const RESYNC_MS = 10 * 60 * 1000;

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function partsIn(date, timeZone, locale) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { day: `${capitalize(parts.weekday.replace('.', ''))} ${parts.day}/${parts.month}/${parts.year}`, time: `${parts.hour}:${parts.minute}` };
}

async function measureOffset() {
  const sent = Date.now();
  const { time } = await api.get('/health');
  const received = Date.now();
  return new Date(time).getTime() + (received - sent) / 2 - received;
}

export function SessionClock({ zones = ['UTC'] }) {
  const { lang } = useI18n();
  const locale = lang === 'en' ? 'en-US' : 'es-MX';
  const [offset, setOffset] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const sync = () => measureOffset().then((o) => alive && setOffset(o)).catch(() => alive && setOffset((o) => o ?? 0));
    const onVisible = () => document.visibilityState === 'visible' && sync();
    sync();
    const resync = setInterval(sync, RESYNC_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearInterval(resync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const current = new Date(now + (offset ?? 0));
  return (
    <div className={`session-clock ${offset === null ? 'is-syncing' : ''}`} title={tr('Hora sincronizada con el servidor')} aria-live="off">
      {zones.map((label) => {
        const p = partsIn(current, ZONES[label], locale);
        return (
          <div key={label} className="session-clock-row">
            <b>{label}</b>
            <span>{p.day}</span>
            <strong>{p.time}</strong>
          </div>
        );
      })}
    </div>
  );
}

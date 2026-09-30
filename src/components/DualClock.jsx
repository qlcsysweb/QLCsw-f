import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/*
 * Fecha y hora actuales en Ciudad de México y en UTC (UTC = CDMX + 6 h, sin
 * horario de verano). Muestra el día de la semana de cada zona, porque a
 * partir de las 18:00 CDMX en UTC ya es el día siguiente. Se actualiza solo.
 */
function formatParts(date, timeZone, locale) {
  const weekday = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('es-MX', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('es-MX', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return { weekday: weekday.replace('.', ''), day, time };
}

export default function DualClock() {
  const { t, language } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Se alinea al cambio de minuto y luego avanza cada minuto.
    let interval;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60 * 1000);
    }, 60 * 1000 - (Date.now() % (60 * 1000)));
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const rows = [
    { label: 'CDMX', ...formatParts(now, 'America/Mexico_City', locale) },
    { label: 'UTC', ...formatParts(now, 'UTC', locale) },
  ];

  return (
    <div className="qlc-dual-clock" aria-label={t('clock.label')}>
      {rows.map((r) => (
        <div key={r.label} className="qlc-dual-clock-row">
          <span className="qlc-dual-clock-zone">{r.label}</span>
          <span className="qlc-dual-clock-date">
            {r.weekday} {r.day}
          </span>
          <strong className="qlc-dual-clock-time">{r.time}</strong>
        </div>
      ))}
    </div>
  );
}

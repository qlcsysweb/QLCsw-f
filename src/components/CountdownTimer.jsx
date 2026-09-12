import { useEffect, useState } from 'react';

// CORREGIR(2).xlsx CLIENTE 09 — contador real de tiempo restante para pagar
// una comisión. La ÚNICA fuente de verdad es `deadline` (un timestamp ISO
// que viene del backend, ej. Statement.commissionDueAt) — este componente
// solo calcula la diferencia contra la hora local en cada tick; nunca
// guarda ni lee nada de localStorage, así que sigue siendo correcto tras
// recargar, cerrar sesión, o entrar desde otro dispositivo.
export default function CountdownTimer({ deadline, expiredLabel }) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(deadline).getTime() - Date.now());

  useEffect(() => {
    const tick = () => setRemainingMs(new Date(deadline).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (remainingMs <= 0) {
    return <span className="qlc-badge danger">{expiredLabel}</span>;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const urgent = totalSeconds < 3600 * 6;

  return (
    <span className={`qlc-badge ${urgent ? 'warn' : 'ok'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {pad(hh)}:{pad(mm)}:{pad(ss)}
    </span>
  );
}

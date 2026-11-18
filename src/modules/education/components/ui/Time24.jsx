import { tr } from '../../i18n/tr.js';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// Hora en formato 24 h (00–23 : 00–55) sin depender del idioma del navegador, que puede mostrar a. m./p. m.
// `value` y `onChange` usan el texto "HH:MM".
export function Time24({ value, onChange, required = false, disabled = false }) {
  const [h = '', m = ''] = String(value || '').split(':');
  const minute = m && !MINUTES.includes(m) ? m : m;
  const emit = (hh, mm) => onChange(hh === '' ? '' : `${hh}:${mm || '00'}`);
  return (
    <span className="time24">
      <select className="input" aria-label={tr('Hora')} required={required} disabled={disabled} value={h} onChange={(e) => emit(e.target.value, minute)}>
        <option value="">--</option>
        {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <b>:</b>
      <select className="input" aria-label={tr('Minutos')} required={required} disabled={disabled || h === ''} value={minute || '00'} onChange={(e) => emit(h, e.target.value)}>
        {[...new Set([...MINUTES, ...(minute ? [minute] : [])])].sort().map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </span>
  );
}

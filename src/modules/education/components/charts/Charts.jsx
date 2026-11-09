import { useState } from 'react';
import { money, pct } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

export function BarChart({ data, height = 190, format = money, ariaLabel = 'Gráfica' }) {
  const [hover, setHover] = useState(null);
  if (!data.length) return <div className="chart-empty">{tr('Sin datos suficientes para graficar.')}</div>;
  const values = data.map((d) => Number(d.value) || 0);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const zero = (max / span) * 100;

  return (
    <figure className="chart" aria-label={ariaLabel}>
      <div className="bars" style={{ height }}>
        {min < 0 && <div className="bars-zero" style={{ top: `${zero}%` }} />}
        {data.map((d, i) => {
          const v = values[i];
          const h = (Math.abs(v) / span) * 100;
          const isLast = i === data.length - 1;
          return (
            <div
              key={d.label + i}
              className="bars-col"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${d.label}: ${format(v)}`}
            >
              <div
                className={`bars-bar ${isLast ? 'current' : ''} ${v < 0 ? 'neg' : ''}`}
                style={v >= 0 ? { height: `${h}%`, bottom: `${100 - zero}%` } : { height: `${h}%`, top: `${zero}%` }}
              />
              {hover === i && (
                <div className="tooltip" role="tooltip">
                  <b>{tr(d.label)}</b>
                  <span>{format(v)}</span>
                  {d.hint && <span className="small">{tr(d.hint)}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="bars-axis">
        {data.map((d, i) => <span key={d.label + i}>{tr(d.label)}</span>)}
      </div>
    </figure>
  );
}

export function DistributionBars({ items, emptyText = 'Sin datos para mostrar la distribución.' }) {
  if (!items.length) return <div className="chart-empty">{tr(emptyText)}</div>;
  return (
    <div className="dist">
      {items.map((it) => (
        <div className="dist-item" key={it.key} title={`${it.label}: ${money(it.value)} · ${pct(it.share)}`}>
          <div className="row">
            <span>{tr(it.label)}</span>
            <span className="dist-values">
              <span className="small">{money(it.value)}</span>
              <b>{pct(it.share)}</b>
            </span>
          </div>
          <div className="progress"><div className="bar" style={{ width: `${Math.max(0, Math.min(100, it.share))}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

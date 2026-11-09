import { tone } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

export function Card({ title, actions, children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h3 className="section-title">{tr(title)}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, delta, deltaTone, accent, valueTone }) {
  return (
    <div className={`card stat ${accent ? 'stat-accent' : ''} ${valueTone ? `stat-${valueTone}` : ''}`}>
      <div className="label">{tr(label)}</div>
      <div className="value" style={typeof value === 'string' || typeof value === 'number' ? { '--len': Math.max(String(value).length, 9) } : undefined}>{value}</div>
      {delta !== undefined && delta !== null && <div className={`delta ${deltaTone ?? ''}`}>{tr(delta)}</div>}
    </div>
  );
}

export const StatGrid = ({ children, cols = 4 }) => <div className={`grid grid-${cols}`}>{children}</div>;

export function PageHeader({ title, subtitle, kicker, actions }) {
  return (
    <div className="top">
      <div>
        {kicker && <div className="section-kicker">{tr(kicker)}</div>}
        <h1>{tr(title)}</h1>
        {subtitle && <div className="subtitle">{tr(subtitle)}</div>}
      </div>
      {actions && <div className="top-actions">{actions}</div>}
    </div>
  );
}

export const Notice = ({ children, variant = '' }) => <div className={`notice ${variant}`}>{tr(children)}</div>;

export function Pill({ children, variant = '' }) {
  return <span className={`pill ${variant}`}>{tr(children)}</span>;
}

export function ProgressBar({ value = 0, label }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={tr(label)}>
      <div className="bar" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Row({ label, value, valueTone, toneValue, sub }) {
  return (
    <div className="row">
      <span>
        {tr(label)}
        {sub && <span className="small block">{tr(sub)}</span>}
      </span>
      <b className={valueTone === 'auto' ? tone(toneValue ?? value) : valueTone || ''}>{value}</b>
    </div>
  );
}

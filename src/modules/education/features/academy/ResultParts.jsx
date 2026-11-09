import { tr } from '../../i18n/tr.js';






export function MetricCard({ label, value, hint, tone = '', explanation }) {
  return (
    <div className={`metric-card tone-${tone || 'none'}`}>
      <span className="metric-label">{tr(label)}</span>
      <strong className="metric-value">{value}</strong>
      {hint && <span className="metric-hint">{tr(hint)}</span>}
      {explanation && <p className="metric-explain">{tr(explanation)}</p>}
    </div>
  );
}

export const MetricGrid = ({ children, cols = 3 }) => <div className={`metric-grid cols-${cols}`}>{children}</div>;

export function ExplainRows({ title = '¿Qué está ocurriendo?', rows, final }) {
  return (
    <div className="explain">
      <div className="explain-title">{tr(title)}</div>
      {rows.map(([label, value, toneClass]) => (
        <div className="explain-row" key={label}>
          <span>{tr(label)}</span>
          <strong className={toneClass || ''}>{value}</strong>
        </div>
      ))}
      {final && <div className={`explain-final ${final.tone || ''}`}><span>{tr(final.label)}</span><strong>{tr(final.value)}</strong></div>}
    </div>
  );
}

export function RiskNote({ children, variant = 'gold' }) {
  return <div className={`risk-note ${variant}`}>{tr(children)}</div>;
}

export function ToolCard({ step, title, description, children, aside }) {
  return (
    <section className="tool-card">
      <header className="tool-card-head">
        {step && <span className="tool-step">{tr(step)}</span>}
        <div>
          <h3>{tr(title)}</h3>
          {description && <p>{tr(description)}</p>}
        </div>
        {tr(aside)}
      </header>
      {children}
    </section>
  );
}

export function SimBadge() {
  return <span className="sim-badge">{tr('Simulación educativa · No modifica tu patrimonio')}</span>;
}

export function RealBadge() {
  return <span className="real-badge">{tr('Información real · Alimenta tu plataforma')}</span>;
}

const KIND_BADGES = {
  REAL: ['real-badge', 'Dato real'],
  PLAN: ['plan-badge', 'Plan · no es un movimiento'],
  ESTIMATE: ['estimate-badge', 'Estimación · no modifica tu realidad'],
  SIMULATION: ['sim-badge', 'Simulación educativa · No modifica tu patrimonio'],
};

export function KindBadge({ kind }) {
  const [className, label] = KIND_BADGES[kind];
  return <span className={className}>{tr(label)}</span>;
}

export function SaveStatus({ action, savedText = 'Cambios guardados.' }) {
  if (action.busy) return <span className="save-status is-busy" role="status">{tr('Guardando…')}</span>;
  if (action.saved) return <span className="save-status is-saved" role="status">✓ {tr(savedText)}</span>;
  return null;
}

export function ToolSkeleton() {
  return (
    <div className="tool" aria-busy="true" aria-label={tr('Cargando herramienta')}>
      <div className="skeleton-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</div>
      <div className="skeleton block" />
    </div>
  );
}

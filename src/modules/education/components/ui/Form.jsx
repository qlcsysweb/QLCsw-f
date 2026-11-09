import { tr } from '../../i18n/tr.js';







export function Field({ label, error, hint, children, full }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{tr(label)}</span>
      {children}
      {hint && !error && <span className="field-hint">{tr(hint)}</span>}
      {error && <span className="field-error">{tr(error)}</span>}
    </label>
  );
}

export const Input = (props) => <input className="input" {...props} />;

export function CodeInput(props) {
  return (
    <input
      className="input code-input"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      placeholder="000000"
      required
      {...props}
      onChange={(e) => props.onChange({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
    />
  );
}

export const MoneyInput = (props) => <input className="input" type="number" inputMode="decimal" step="0.01" min="0" {...props} />;

export const Textarea = (props) => <textarea className="input" rows={4} {...props} />;

export function Select({ options = [], placeholder, ...rest }) {
  return (
    <select className="input" {...rest}>
      {placeholder && <option value="">{tr(placeholder)}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{tr(o.label)}</option>
      ))}
    </select>
  );
}

export const FormGrid = ({ children, cols = 2 }) => <div className={`form-grid cols-${cols}`}>{children}</div>;

export function FormError({ error }) {
  if (!error) return null;
  return (
    <div className="form-error" role="alert">
      {tr(error.message)}
      {error.details?.length > 0 && (
        <ul>{error.details.map((d, i) => <li key={i}>{d.field ? `${d.field}: ` : ''}{d.message}</li>)}</ul>
      )}
    </div>
  );
}

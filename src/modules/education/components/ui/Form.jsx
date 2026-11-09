import { useState } from 'react';
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

function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const label = tr(visible ? 'Ocultar' : 'Mostrar');
  return (
    <span className="password-field">
      <input className="input" {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
}

export const Input = (props) => (props.type === 'password' ? <PasswordInput {...props} /> : <input className="input" {...props} />);

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

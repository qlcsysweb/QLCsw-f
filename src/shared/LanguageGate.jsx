import './languageGate.css';

const OPTIONS = [
  { code: 'en', short: 'EN', label: 'English', action: 'Continue' },
  { code: 'es', short: 'ES', label: 'Español', action: 'Continuar' },
];

export default function LanguageGate({ logo, onSelect }) {
  return (
    <div className="lang-gate" role="dialog" aria-modal="true" aria-label="Select language / Seleccionar idioma">
      <div className="lang-gate-panel">
        {logo}
        <p className="lang-gate-brand">Quantum Liquidity Capital</p>
        <h1 className="lang-gate-title">
          Welcome <span>Bienvenido</span>
        </h1>
        <p className="lang-gate-sub">Choose your language · Elige tu idioma</p>

        <div className="lang-gate-options">
          {OPTIONS.map(({ code, short, label, action }) => (
            <button key={code} type="button" lang={code} className="lang-gate-option" onClick={() => onSelect(code)}>
              <span className="lang-gate-code" aria-hidden="true">{short}</span>
              <span className="lang-gate-label">{label}</span>
              <span className="lang-gate-action" aria-hidden="true">
                {action} <span className="lang-gate-arrow">→</span>
              </span>
            </button>
          ))}
        </div>

        <p className="lang-gate-note">You can change it anytime · Puedes cambiarlo cuando quieras</p>
      </div>
    </div>
  );
}

import QlcLogo from '../components/QlcLogo';
import { useLanguage } from './LanguageContext';
import './WelcomeLanguageGate.css';

// CORRECCIÓN 1 — reaparece una vez al día en la página pública (a
// diferencia de WelcomeLanguageGate, que solo aparece la primera vez que
// el navegador no tiene idioma elegido). Reutiliza el mismo idioma
// persistente (qlc_language, 365 días) — esto solo controla cuándo se
// vuelve a MOSTRAR el aviso, no resetea la preferencia guardada.
export default function DailyLanguagePrompt({ onDone }) {
  const { setLanguage } = useLanguage();

  const choose = (lang) => {
    setLanguage(lang);
    onDone();
  };

  return (
    <div className="qlc-welcome-screen" role="dialog" aria-modal="true" aria-label="Seleccionar idioma / Select language">
      <div className="qlc-welcome-panel">
        <div className="qlc-welcome-option">
          <div className="qlc-welcome-kicker">Bienvenido a</div>
          <QlcLogo className="qlc-welcome-logo" animated alt="Quantum Liquidity Capital" />
          <button type="button" className="qlc-btn primary qlc-welcome-btn" onClick={() => choose('es')}>
            Selecciona este idioma
          </button>
          <span className="qlc-welcome-tag">🇪🇸 Español</span>
        </div>

        <div className="qlc-welcome-divider" />

        <div className="qlc-welcome-option">
          <div className="qlc-welcome-kicker">Welcome to</div>
          <QlcLogo className="qlc-welcome-logo" animated alt="Quantum Liquidity Capital" />
          <button type="button" className="qlc-btn primary qlc-welcome-btn" onClick={() => choose('en')}>
            Select this language
          </button>
          <span className="qlc-welcome-tag">🇺🇸 English</span>
        </div>
      </div>
    </div>
  );
}

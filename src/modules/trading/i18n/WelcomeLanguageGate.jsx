import QlcLogo from '../components/QlcLogo';
import { useLanguage } from './LanguageContext';
import './WelcomeLanguageGate.css';

/*
 * Pantalla de bienvenida mostrada SOLO en la primera visita (mientras no
 * exista la cookie qlc_language). Una vez elegido el idioma, no vuelve a
 * aparecer salvo que la cookie se borre o expire (1 año).
 */
export default function WelcomeLanguageGate() {
  const { setLanguage } = useLanguage();

  return (
    <div className="qlc-welcome-screen" role="dialog" aria-modal="true" aria-label="Seleccionar idioma / Select language">
      <div className="qlc-welcome-panel">
        <div className="qlc-welcome-option">
          <div className="qlc-welcome-kicker">Bienvenido a</div>
          <QlcLogo className="qlc-welcome-logo" animated alt="Quantum Liquidity Capital" />
          <button type="button" className="qlc-btn primary qlc-welcome-btn" onClick={() => setLanguage('es')}>
            Selecciona este idioma
          </button>
          <span className="qlc-welcome-tag">🇪🇸 Español</span>
        </div>

        <div className="qlc-welcome-divider" />

        <div className="qlc-welcome-option">
          <div className="qlc-welcome-kicker">Welcome to</div>
          <QlcLogo className="qlc-welcome-logo" animated alt="Quantum Liquidity Capital" />
          <button type="button" className="qlc-btn primary qlc-welcome-btn" onClick={() => setLanguage('en')}>
            Select this language
          </button>
          <span className="qlc-welcome-tag">🇺🇸 English</span>
        </div>
      </div>
    </div>
  );
}

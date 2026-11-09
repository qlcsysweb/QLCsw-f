import LanguageGate from '../../../shared/LanguageGate.jsx';
import { rememberLanguageChoice } from '../../../shared/languageChoice.js';
import QlcLogo from '../components/QlcLogo';
import { useLanguage } from './LanguageContext';

export default function WelcomeLanguageGate({ onDone }) {
  const { setLanguage } = useLanguage();

  const choose = (code) => {
    rememberLanguageChoice(code);
    setLanguage(code);
    onDone?.();
  };

  return <LanguageGate logo={<QlcLogo className="lang-gate-logo" alt="Quantum Liquidity Capital" />} onSelect={choose} />;
}

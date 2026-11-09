import { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import { I18nProvider, useI18n } from './i18n/I18nContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { UpdatePrompt } from './features/updates/UpdatePrompt.jsx';
import { LanguageSync } from './i18n/LanguageSync.jsx';
import { applyDocumentHead } from '../../shared/documentHead.js';
import LanguageGate from '../../shared/LanguageGate.jsx';
import { languagePromptPending, rememberLanguageChoice } from '../../shared/languageChoice.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import './styles/public.css';
import './styles/academy.css';
import './styles/admin.css';
import './styles/update.css';
import './styles/trading.css';

applyDocumentHead({
  title: 'QLC · Institutional Investment Academy',
  icon: '/brand/qlc-logo.png',
  names: {
    'theme-color': '#05070a',
    description: 'QLC · Institutional Investment Academy: educación financiera y herramientas para organizar, medir y comprender tu patrimonio.',
  },
  links: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' },
  ],
});

function EducationRoutes() {
  const { chooseLang } = useI18n();
  const [promptPending, setPromptPending] = useState(languagePromptPending);

  if (promptPending) {
    const choose = (code) => {
      rememberLanguageChoice(code);
      chooseLang(code);
      setPromptPending(false);
    };
    return <LanguageGate logo={<img className="lang-gate-logo" src="/brand/qlc-logo.png" alt="Quantum Liquidity Capital" />} onSelect={choose} />;
  }

  return <AppRoutes />;
}

export default function EducationApp() {
  return (
    <I18nProvider>
      <CurrencyProvider>
        <AuthProvider>
          <LanguageSync />
          <EducationRoutes />
          <UpdatePrompt />
        </AuthProvider>
      </CurrencyProvider>
    </I18nProvider>
  );
}

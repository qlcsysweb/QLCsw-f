import { useState } from 'react';
import { useLanguage } from './LanguageContext';
import './LanguageSwitcherCompact.css';

/*
 * Selector de idioma compacto para los sidebars de Admin/Cliente — la
 * interfaz solo muestra el idioma actual; las dos opciones aparecen al
 * abrir, igual que el menú hamburguesa del sitio público.
 */
// El inglés siempre va primero.
const LABELS = { en: '🇺🇸 English', es: '🇪🇸 Español', pt: '🇧🇷 Português' };

export default function LanguageSwitcherCompact() {
  const { t, language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="qlc-lang-switch">
      <button type="button" className="qlc-btn ghost qlc-lang-switch-btn" onClick={() => setOpen((v) => !v)}>
        {LABELS[language] || LABELS.es}
      </button>
      {open && (
        <>
          <div className="qlc-lang-switch-backdrop" onClick={() => setOpen(false)} />
          <div className="qlc-lang-switch-panel">
            <div className="qlc-lang-switch-heading">{t('language.label')}</div>
            {Object.entries(LABELS).map(([code, label]) => (
              <button
                key={code}
                type="button"
                className={`qlc-lang-switch-option${language === code ? ' active' : ''}`}
                onClick={() => {
                  setLanguage(code);
                  setOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

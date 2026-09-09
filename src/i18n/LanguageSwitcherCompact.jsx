import { useState } from 'react';
import { useLanguage } from './LanguageContext';
import './LanguageSwitcherCompact.css';

/*
 * Selector de idioma compacto para los sidebars de Admin/Cliente — la
 * interfaz solo muestra el idioma actual; las dos opciones aparecen al
 * abrir, igual que el menú hamburguesa del sitio público.
 */
export default function LanguageSwitcherCompact() {
  const { t, language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="qlc-lang-switch">
      <button type="button" className="qlc-btn ghost qlc-lang-switch-btn" onClick={() => setOpen((v) => !v)}>
        {language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
      </button>
      {open && (
        <>
          <div className="qlc-lang-switch-backdrop" onClick={() => setOpen(false)} />
          <div className="qlc-lang-switch-panel">
            <div className="qlc-lang-switch-heading">{t('language.label')}</div>
            <button
              type="button"
              className={`qlc-lang-switch-option${language === 'es' ? ' active' : ''}`}
              onClick={() => {
                setLanguage('es');
                setOpen(false);
              }}
            >
              🇪🇸 Español
            </button>
            <button
              type="button"
              className={`qlc-lang-switch-option${language === 'en' ? ' active' : ''}`}
              onClick={() => {
                setLanguage('en');
                setOpen(false);
              }}
            >
              🇺🇸 English
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { useI18n } from '../../i18n/I18nContext.jsx';

export function LanguageSwitcher({ className = '' }) {
  const { lang, chooseLang, languages, t } = useI18n();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('common.language')}>
      <span className="lang-thumb" style={{ '--i': languages.findIndex((l) => l.code === lang) }} aria-hidden="true" />
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          title={l.label}
          aria-label={l.label}
          aria-pressed={lang === l.code}
          className={lang === l.code ? 'is-active' : ''}
          onClick={() => chooseLang(l.code)}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

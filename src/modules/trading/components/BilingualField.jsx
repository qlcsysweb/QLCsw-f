import { useLanguage } from '../i18n/LanguageContext';
import { isTranslationPending } from '../i18n/bilingualContent';

// Par de campos ES/EN para editar un texto bilingüe del CMS en el Admin.
// Muestra "Pendiente de traducción" cuando hay español pero falta el inglés.
export default function BilingualField({ label, esValue, enValue, onEsChange, onEnChange, textarea = false, rows = 3 }) {
  const { t } = useLanguage();
  const pending = isTranslationPending(esValue, enValue);
  const Field = textarea ? 'textarea' : 'input';
  const fieldProps = textarea ? { rows } : {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
      <div>
        <label className="qlc-label">{label} — Español</label>
        <Field className={textarea ? 'qlc-textarea' : 'qlc-input'} value={esValue || ''} onChange={onEsChange} {...fieldProps} />
      </div>
      <div>
        <label className="qlc-label">
          {label} — English
          {pending && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--qlc-warn, #b45309)',
                border: '1px solid var(--qlc-warn, #b45309)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              {t('adminSectionModal.pendingTranslation')}
            </span>
          )}
        </label>
        <Field className={textarea ? 'qlc-textarea' : 'qlc-input'} value={enValue || ''} onChange={onEnChange} {...fieldProps} />
      </div>
    </div>
  );
}

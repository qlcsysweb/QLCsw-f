import { useState } from 'react';
import Modal from '../../../components/Modal';
import ConfirmSaveModal from '../../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../../components/useUnsavedGuard';
import api from '../../../services/api';
import { useLanguage } from '../../../i18n/LanguageContext';
import { isTranslationPending } from '../../../i18n/bilingualContent';
import { translateBackendMessage } from '../../../i18n/backendMessages';
import '../../public/public.css';

/*
 * Editor genérico para una sección de contenido público basada en
 * PublicContent (texto bilingüe: es/en). Reutiliza el componente REAL de la
 * web pública para la vista previa — nunca duplica el diseño.
 */
export default function SectionContentModal({ title, section, fields, currentValues, PreviewComponent, previewProps = {}, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const initialValues = (() => {
    const initial = {};
    fields.forEach((f) => {
      const entry = currentValues?.[f.key];
      initial[f.key] = {
        es: entry?.value ?? f.fallback ?? '',
        en: entry?.valueEn ?? '',
      };
    });
    return initial;
  })();

  const [values, setValues] = useState(initialValues);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () => JSON.stringify(values) !== JSON.stringify(initialValues);
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const update = (key, lang) => (e) => setValues((v) => ({ ...v, [key]: { ...v[key], [lang]: e.target.value } }));

  const previewText = (sec, key, fallback) => {
    if (sec !== section) return fallback;
    const entry = values[key];
    if (!entry) return fallback;
    if (language === 'en' && entry.en) return entry.en;
    return entry.es || fallback;
  };

  const doSave = async () => {
    setError('');
    try {
      const items = fields.map((f) => ({
        section,
        key: f.key,
        value: values[f.key].es || '',
        valueEn: values[f.key].en?.trim() ? values[f.key].en : null,
      }));
      await api.put('/admin/content/bulk', { items });
      onSaved();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      throw err;
    }
  };

  return (
    <Modal title={title} subtitle={t('adminSectionModal.subtitle')} onClose={requestClose} width={780}>
      {!showPreview ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmingSave(true);
          }}
        >
          {fields.map((f) => {
            const pending = isTranslationPending(values[f.key].es, values[f.key].en);
            return (
              <div key={f.key} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--qlc-line)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="qlc-label">{f.label} — Español</label>
                    {f.type === 'textarea' ? (
                      <textarea className="qlc-textarea" rows={f.rows || 3} value={values[f.key].es} onChange={update(f.key, 'es')} />
                    ) : (
                      <input className="qlc-input" value={values[f.key].es} onChange={update(f.key, 'es')} />
                    )}
                  </div>
                  <div>
                    <label className="qlc-label">
                      {f.label} — English
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
                    {f.type === 'textarea' ? (
                      <textarea className="qlc-textarea" rows={f.rows || 3} value={values[f.key].en} onChange={update(f.key, 'en')} />
                    ) : (
                      <input className="qlc-input" value={values[f.key].en} onChange={update(f.key, 'en')} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={() => setShowPreview(true)}>
              {t('adminSectionModal.preview')}
            </button>
            <button type="button" className="qlc-btn ghost" onClick={requestClose}>
              {t('common.cancel')}
            </button>
            <button className="qlc-btn primary">{t('modals.saveChanges')}</button>
          </div>
        </form>
      ) : (
        <div>
          <div className="qlc-public" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--qlc-line)' }}>
            <PreviewComponent text={previewText} {...previewProps} />
          </div>
          <div className="qlc-form-actions">
            <button className="qlc-btn ghost" onClick={() => setShowPreview(false)}>
              {t('adminSectionModal.backToEdit')}
            </button>
          </div>
        </div>
      )}

      {confirmingSave && (
        <ConfirmSaveModal
          message={t('adminSectionModal.saveConfirmMessage')}
          onCancel={() => setConfirmingSave(false)}
          onConfirm={doSave}
        />
      )}

      {promptOpen && <UnsavedChangesModal onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />}
    </Modal>
  );
}

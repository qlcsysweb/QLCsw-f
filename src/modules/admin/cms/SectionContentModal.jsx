import { useState } from 'react';
import Modal from '../../../components/Modal';
import ConfirmSaveModal from '../../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../../components/useUnsavedGuard';
import api from '../../../services/api';
import { useLanguage } from '../../../i18n/LanguageContext';
import '../../public/public.css';

/*
 * Editor genérico para una sección de contenido público basada en
 * PublicContent (texto simple). Reutiliza el componente REAL de la web
 * pública para la vista previa — nunca duplica el diseño.
 */
export default function SectionContentModal({ title, section, fields, currentValues, PreviewComponent, previewProps = {}, onClose, onSaved }) {
  const { t } = useLanguage();
  const initialValues = (() => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.key] = currentValues?.[f.key] ?? f.fallback ?? '';
    });
    return initial;
  })();

  const [values, setValues] = useState(initialValues);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () => JSON.stringify(values) !== JSON.stringify(initialValues);
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const update = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const previewText = (sec, key, fallback) => (sec === section ? values[key] ?? fallback : fallback);

  const doSave = async () => {
    setError('');
    try {
      const items = fields.map((f) => ({ section, key: f.key, value: values[f.key] || '' }));
      await api.put('/admin/content/bulk', { items });
      onSaved();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <Modal title={title} subtitle={t('adminSectionModal.subtitle')} onClose={requestClose} width={720}>
      {!showPreview ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmingSave(true);
          }}
        >
          {fields.map((f) => (
            <div key={f.key} style={{ marginBottom: 4 }}>
              <label className="qlc-label">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea className="qlc-textarea" rows={f.rows || 3} value={values[f.key]} onChange={update(f.key)} />
              ) : (
                <input className="qlc-input" value={values[f.key]} onChange={update(f.key)} />
              )}
            </div>
          ))}

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

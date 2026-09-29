import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../components/useUnsavedGuard';
import BilingualField from '../../components/BilingualField';
import ParticipationModelSummary, { fillSplit } from '../../components/ParticipationModelSummary';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

function ModelEditModal({ model, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState(model);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () => JSON.stringify(form) !== JSON.stringify(model);
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // El reparto (QLC 50% / Cliente 50%) es fijo del modelo único: aquí solo
  // se editan sus textos.
  const doSave = async () => {
    setError('');
    try {
      await api.patch(`/admin/models/${model.id}`, {
        name: form.name,
        nameEn: form.nameEn || null,
        tagline: form.tagline,
        taglineEn: form.taglineEn || null,
        description: form.description,
        descriptionEn: form.descriptionEn || null,
      });
      onSaved();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      throw err;
    }
  };

  return (
    <Modal
      title={t('adminModels.editModalTitle')}
      subtitle={fillSplit(t('adminModels.editModalSubtitle'), model)}
      onClose={requestClose}
      width={760}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmingSave(true);
        }}
      >
        <BilingualField
          label={t('adminModels.name')}
          esValue={form.name}
          enValue={form.nameEn}
          onEsChange={update('name')}
          onEnChange={update('nameEn')}
        />
        <BilingualField
          label={t('adminModels.tagline')}
          esValue={form.tagline}
          enValue={form.taglineEn}
          onEsChange={update('tagline')}
          onEnChange={update('taglineEn')}
        />
        <BilingualField
          label={t('adminModels.description')}
          esValue={form.description}
          enValue={form.descriptionEn}
          onEsChange={update('description')}
          onEnChange={update('descriptionEn')}
          textarea
        />
        {/* "Cómo funciona / ejemplos / características / ¿para quién?" se
            construyen a partir del reparto real (Model.percentage). */}
        {error && <div className="qlc-field-error">{error}</div>}

        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={requestClose}>
            {t('common.cancel')}
          </button>
          <button className="qlc-btn primary">{t('modals.saveChanges')}</button>
        </div>
      </form>

      {confirmingSave && (
        <ConfirmSaveModal
          message={t('adminModels.saveConfirmMessage')}
          onCancel={() => setConfirmingSave(false)}
          onConfirm={doSave}
        />
      )}
      {promptOpen && <UnsavedChangesModal onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />}
    </Modal>
  );
}

// MODELO ÚNICO DE PARTICIPACIÓN (QLC 50% / Cliente 50%): no se pueden crear
// otros modelos; solo se editan los textos del único existente.
export default function ModelsPage() {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [note, setNote] = useState('');
  const [noteEn, setNoteEn] = useState('');
  const [editingModel, setEditingModel] = useState(null);
  const [message, setMessage] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = () => {
    api.get('/admin/models').then(({ data }) => setModels(data.models));
    api.get('/admin/content').then(({ data }) => {
      const row = data.content.find((r) => r.section === 'modelos' && r.key === 'note');
      setNote(row?.value || '');
      setNoteEn(row?.valueEn || '');
    });
  };
  useEffect(load, []);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveNote = async (e) => {
    e.preventDefault();
    setSavingNote(true);
    try {
      await api.put('/admin/content', { section: 'modelos', key: 'note', value: note, valueEn: noteEn?.trim() ? noteEn : null });
      flash(t('adminModels.noteSaved'));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">{t('adminModels.kicker')}</div>
          <h1 style={{ margin: 0 }}>{t('adminModels.title')}</h1>
        </div>
      </div>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{fillSplit(t('adminModels.intro'), models[0])}</p>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-detail-grid">
        {models.map((m) => (
          <div className="qlc-card" key={m.id}>
            <ParticipationModelSummary model={m} />
            {m.tagline && <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginBottom: 0 }}>{m.tagline}</p>}
            <button className="qlc-btn primary" style={{ width: '100%', marginTop: 14 }} onClick={() => setEditingModel(m)}>
              {t('adminModels.edit')}
            </button>
          </div>
        ))}
      </div>

      <form className="qlc-card" style={{ marginTop: 18, maxWidth: 880 }} onSubmit={saveNote}>
        <h3 style={{ marginTop: 0 }}>{t('adminModels.warningNoteTitle')}</h3>
        <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminModels.warningNoteHint')}</p>
        <BilingualField
          label={t('adminModels.warningNoteTitle')}
          esValue={note}
          enValue={noteEn}
          onEsChange={(e) => setNote(e.target.value)}
          onEnChange={(e) => setNoteEn(e.target.value)}
          textarea
          rows={2}
        />
        <div className="qlc-form-actions">
          <button className="qlc-btn primary" disabled={savingNote}>
            {savingNote ? t('common.saving') : t('adminModels.saveNote')}
          </button>
        </div>
      </form>

      {editingModel && (
        <ModelEditModal
          model={editingModel}
          onClose={() => setEditingModel(null)}
          onSaved={() => {
            setEditingModel(null);
            flash(t('adminModels.changesSaved'));
            load();
          }}
        />
      )}
    </div>
  );
}

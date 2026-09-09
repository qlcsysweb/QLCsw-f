import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../components/useUnsavedGuard';
import { useLanguage } from '../../i18n/LanguageContext';

function ModelEditModal({ model, onClose, onSaved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(model);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () => JSON.stringify(form) !== JSON.stringify(model);
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: field === 'isActive' ? e.target.checked : e.target.value }));

  const doSave = async () => {
    setError('');
    try {
      await api.patch(`/admin/models/${model.id}`, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        conditions: form.conditions,
        period: form.period,
        objective: form.objective,
        isActive: form.isActive,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <Modal
      title={`${t('adminModels.editModalTitle')} — ${model.key}`}
      subtitle={t('adminModels.editModalSubtitle')}
      onClose={requestClose}
      width={560}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmingSave(true);
        }}
      >
        <label className="qlc-label">{t('adminModels.name')}</label>
        <input className="qlc-input" value={form.name} onChange={update('name')} />
        <label className="qlc-label">{t('adminModels.tagline')}</label>
        <input className="qlc-input" value={form.tagline || ''} onChange={update('tagline')} />
        <label className="qlc-label">{t('adminModels.description')}</label>
        <textarea className="qlc-textarea" rows={3} value={form.description} onChange={update('description')} />
        <label className="qlc-label">{t('adminModels.conditions')}</label>
        <input className="qlc-input" value={form.conditions || ''} onChange={update('conditions')} />
        <label className="qlc-label">{t('adminModels.period')}</label>
        <input className="qlc-input" value={form.period || ''} onChange={update('period')} />
        <label className="qlc-label">{t('adminModels.objective')}</label>
        <input className="qlc-input" value={form.objective || ''} onChange={update('objective')} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13 }}>
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> {t('adminModels.visibleOnPublicSite')}
        </label>

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

export default function ModelsPage() {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [note, setNote] = useState('');
  const [editingModel, setEditingModel] = useState(null);
  const [message, setMessage] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = () => {
    api.get('/admin/models').then(({ data }) => setModels(data.models));
    api.get('/admin/content').then(({ data }) => {
      const row = data.content.find((r) => r.section === 'modelos' && r.key === 'note');
      setNote(row?.value || '');
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
      await api.put('/admin/content', { section: 'modelos', key: 'note', value: note });
      flash(t('adminModels.noteSaved'));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminModels.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminModels.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('adminModels.intro')}</p>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-detail-grid">
        {models.map((m) => (
          <div className="qlc-card" key={m.id}>
            <div className="qlc-kicker">{m.key}</div>
            <h3 style={{ margin: '6px 0' }}>{m.name}</h3>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{m.tagline}</p>
            <span className={`qlc-badge ${m.isActive ? 'ok' : 'muted'}`}>
              {m.isActive ? t('adminModels.visible') : t('adminModels.hidden')}
            </span>
            <button className="qlc-btn primary" style={{ width: '100%', marginTop: 14 }} onClick={() => setEditingModel(m)}>
              {t('adminModels.edit')}
            </button>
          </div>
        ))}
      </div>

      <form className="qlc-card" style={{ marginTop: 18, maxWidth: 640 }} onSubmit={saveNote}>
        <h3 style={{ marginTop: 0 }}>{t('adminModels.warningNoteTitle')}</h3>
        <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>{t('adminModels.warningNoteHint')}</p>
        <textarea className="qlc-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
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

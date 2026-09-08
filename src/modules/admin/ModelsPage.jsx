import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../components/useUnsavedGuard';

function ModelEditModal({ model, onClose, onSaved }) {
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
    <Modal title={`Editar modelo — ${model.key}`} subtitle="Estos datos se muestran tal cual en la página pública y en el portal del cliente." onClose={requestClose} width={560}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmingSave(true);
        }}
      >
        <label className="qlc-label">Nombre</label>
        <input className="qlc-input" value={form.name} onChange={update('name')} />
        <label className="qlc-label">Frase (tagline)</label>
        <input className="qlc-input" value={form.tagline || ''} onChange={update('tagline')} />
        <label className="qlc-label">Descripción</label>
        <textarea className="qlc-textarea" rows={3} value={form.description} onChange={update('description')} />
        <label className="qlc-label">Condiciones</label>
        <input className="qlc-input" value={form.conditions || ''} onChange={update('conditions')} />
        <label className="qlc-label">Período</label>
        <input className="qlc-input" value={form.period || ''} onChange={update('period')} />
        <label className="qlc-label">Objetivo</label>
        <input className="qlc-input" value={form.objective || ''} onChange={update('objective')} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13 }}>
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> Visible en la web pública
        </label>

        {error && <div className="qlc-field-error">{error}</div>}

        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={requestClose}>
            Cancelar
          </button>
          <button className="qlc-btn primary">✓ Guardar cambios</button>
        </div>
      </form>

      {confirmingSave && (
        <ConfirmSaveModal
          message="Se actualizará este modelo en la página pública y en el portal del cliente."
          onCancel={() => setConfirmingSave(false)}
          onConfirm={doSave}
        />
      )}
      {promptOpen && <UnsavedChangesModal onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />}
    </Modal>
  );
}

export default function ModelsPage() {
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
      flash('✓ Nota guardada.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">MODELOS DE PARTICIPACIÓN</div>
      <h1 style={{ marginTop: 0 }}>Modelos</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>
        Estos datos se editan aquí y se reflejan automáticamente en la página pública y en el
        portal del cliente — no requieren cambios de código.
      </p>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-detail-grid">
        {models.map((m) => (
          <div className="qlc-card" key={m.id}>
            <div className="qlc-kicker">{m.key}</div>
            <h3 style={{ margin: '6px 0' }}>{m.name}</h3>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{m.tagline}</p>
            <span className={`qlc-badge ${m.isActive ? 'ok' : 'muted'}`}>
              {m.isActive ? '● Visible' : '— Oculto'}
            </span>
            <button className="qlc-btn primary" style={{ width: '100%', marginTop: 14 }} onClick={() => setEditingModel(m)}>
              Editar
            </button>
          </div>
        ))}
      </div>

      <form className="qlc-card" style={{ marginTop: 18, maxWidth: 640 }} onSubmit={saveNote}>
        <h3 style={{ marginTop: 0 }}>Nota de advertencia</h3>
        <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>
          Se muestra debajo de los modelos en la página pública (aclaración de que no son garantía de resultados).
        </p>
        <textarea className="qlc-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="qlc-form-actions">
          <button className="qlc-btn primary" disabled={savingNote}>
            {savingNote ? 'Guardando…' : '✓ Guardar nota'}
          </button>
        </div>
      </form>

      {editingModel && (
        <ModelEditModal
          model={editingModel}
          onClose={() => setEditingModel(null)}
          onSaved={() => {
            setEditingModel(null);
            flash('✓ Cambios guardados correctamente.');
            load();
          }}
        />
      )}
    </div>
  );
}

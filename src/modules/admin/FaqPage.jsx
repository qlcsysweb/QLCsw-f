import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../components/useUnsavedGuard';

function FaqFormModal({ faq, onClose, onSaved }) {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () => question !== (faq?.question || '') || answer !== (faq?.answer || '');
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const doSave = async () => {
    setError('');
    try {
      if (faq) {
        await api.patch(`/admin/faq/${faq.id}`, { question, answer });
      } else {
        await api.post('/admin/faq', { question, answer });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <Modal title={faq ? 'Editar pregunta' : 'Nueva pregunta frecuente'} onClose={requestClose} width={520}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!question || !answer) return;
          setConfirmingSave(true);
        }}
      >
        <label className="qlc-label">Pregunta</label>
        <input className="qlc-input" value={question} onChange={(e) => setQuestion(e.target.value)} required />
        <label className="qlc-label">Respuesta</label>
        <textarea className="qlc-textarea" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} required />
        {error && <div className="qlc-field-error">{error}</div>}
        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={requestClose}>
            Cancelar
          </button>
          <button className="qlc-btn primary">✓ Guardar</button>
        </div>
      </form>

      {confirmingSave && (
        <ConfirmSaveModal
          message="Se actualizará la sección de preguntas frecuentes en la página pública."
          onCancel={() => setConfirmingSave(false)}
          onConfirm={doSave}
        />
      )}
      {promptOpen && <UnsavedChangesModal onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />}
    </Modal>
  );
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => api.get('/admin/faq').then(({ data }) => setFaqs(data.faqs));
  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (faq) => {
    await api.patch(`/admin/faq/${faq.id}`, { isActive: !faq.isActive });
    load();
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= faqs.length) return;
    const a = faqs[index];
    const b = faqs[target];
    await Promise.all([
      api.patch(`/admin/faq/${a.id}`, { displayOrder: b.displayOrder }),
      api.patch(`/admin/faq/${b.id}`, { displayOrder: a.displayOrder }),
    ]);
    load();
  };

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">PREGUNTAS FRECUENTES</div>
          <h1 style={{ margin: 0 }}>FAQ ({faqs.length})</h1>
        </div>
        <button className="qlc-btn primary" onClick={() => setCreating(true)}>
          + Nueva pregunta
        </button>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      {faqs.length === 0 ? (
        <div className="qlc-empty">Sin preguntas todavía.</div>
      ) : (
        faqs.map((faq, index) => (
          <div className="qlc-card" key={faq.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <strong>{faq.question}</strong>
              <span className={`qlc-badge ${faq.isActive ? 'ok' : 'muted'}`}>
                {faq.isActive ? '● Visible' : '— Oculta'}
              </span>
            </div>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{faq.answer}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="qlc-btn ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                ↑ Subir
              </button>
              <button className="qlc-btn ghost" onClick={() => move(index, 1)} disabled={index === faqs.length - 1}>
                ↓ Bajar
              </button>
              <button className="qlc-btn ghost" onClick={() => setEditingFaq(faq)}>
                Editar
              </button>
              <button className="qlc-btn ghost" onClick={() => toggleActive(faq)}>
                {faq.isActive ? 'Ocultar' : 'Mostrar'}
              </button>
              <button className="qlc-btn danger" onClick={() => setDeletingFaq(faq)}>
                Eliminar
              </button>
            </div>
          </div>
        ))
      )}

      {creating && (
        <FaqFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            flash('✓ Pregunta agregada.');
            load();
          }}
        />
      )}
      {editingFaq && (
        <FaqFormModal
          faq={editingFaq}
          onClose={() => setEditingFaq(null)}
          onSaved={() => {
            setEditingFaq(null);
            flash('✓ Cambios guardados.');
            load();
          }}
        />
      )}
      {deletingFaq && (
        <ConfirmModal
          title="¿Eliminar pregunta?"
          message={`Esta acción eliminará permanentemente "${deletingFaq.question}" de la página pública.`}
          confirmLabel="Eliminar"
          twoStep
          onClose={() => setDeletingFaq(null)}
          onConfirm={async () => {
            await api.delete(`/admin/faq/${deletingFaq.id}`);
            flash('✓ Pregunta eliminada.');
            load();
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../components/useUnsavedGuard';
import BilingualField from '../../components/BilingualField';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

function FaqFormModal({ faq, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const [question, setQuestion] = useState(faq?.question || '');
  const [questionEn, setQuestionEn] = useState(faq?.questionEn || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [answerEn, setAnswerEn] = useState(faq?.answerEn || '');
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () =>
    question !== (faq?.question || '') ||
    questionEn !== (faq?.questionEn || '') ||
    answer !== (faq?.answer || '') ||
    answerEn !== (faq?.answerEn || '');
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const doSave = async () => {
    setError('');
    try {
      const payload = {
        question,
        questionEn: questionEn?.trim() ? questionEn : null,
        answer,
        answerEn: answerEn?.trim() ? answerEn : null,
      };
      if (faq) {
        await api.patch(`/admin/faq/${faq.id}`, payload);
      } else {
        await api.post('/admin/faq', payload);
      }
      onSaved();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      throw err;
    }
  };

  return (
    <Modal title={faq ? t('adminFaq.editTitle') : t('adminFaq.newTitle')} onClose={requestClose} width={720}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!question || !answer) return;
          setConfirmingSave(true);
        }}
      >
        <BilingualField
          label={t('adminFaq.question')}
          esValue={question}
          enValue={questionEn}
          onEsChange={(e) => setQuestion(e.target.value)}
          onEnChange={(e) => setQuestionEn(e.target.value)}
        />
        <BilingualField
          label={t('adminFaq.answer')}
          esValue={answer}
          enValue={answerEn}
          onEsChange={(e) => setAnswer(e.target.value)}
          onEnChange={(e) => setAnswerEn(e.target.value)}
          textarea
        />
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
          message={t('adminFaq.saveConfirmMessage')}
          onCancel={() => setConfirmingSave(false)}
          onConfirm={doSave}
        />
      )}
      {promptOpen && <UnsavedChangesModal onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />}
    </Modal>
  );
}

export default function FaqPage() {
  const { t } = useLanguage();
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
          <div className="qlc-kicker">{t('adminFaq.kicker')}</div>
          <h1 style={{ margin: 0 }}>
            {t('adminFaq.title')} ({faqs.length})
          </h1>
        </div>
        <button className="qlc-btn primary" onClick={() => setCreating(true)}>
          {t('adminFaq.newQuestion')}
        </button>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      {faqs.length === 0 ? (
        <div className="qlc-empty">{t('adminFaq.none')}</div>
      ) : (
        faqs.map((faq, index) => (
          <div className="qlc-card" key={faq.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <strong>{faq.question}</strong>
              <span className={`qlc-badge ${faq.isActive ? 'ok' : 'muted'}`}>
                {faq.isActive ? t('adminFaq.visible') : t('adminFaq.hidden')}
              </span>
            </div>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{faq.answer}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="qlc-btn ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                {t('adminFaq.moveUp')}
              </button>
              <button className="qlc-btn ghost" onClick={() => move(index, 1)} disabled={index === faqs.length - 1}>
                {t('adminFaq.moveDown')}
              </button>
              <button className="qlc-btn ghost" onClick={() => setEditingFaq(faq)}>
                {t('adminFaq.edit')}
              </button>
              <button className="qlc-btn ghost" onClick={() => toggleActive(faq)}>
                {faq.isActive ? t('adminFaq.hide') : t('adminFaq.show')}
              </button>
              <button className="qlc-btn danger" onClick={() => setDeletingFaq(faq)}>
                {t('adminFaq.delete')}
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
            flash(t('adminFaq.added'));
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
            flash(t('adminFaq.changesSaved'));
            load();
          }}
        />
      )}
      {deletingFaq && (
        <ConfirmModal
          title={t('adminFaq.deleteTitle')}
          message={t('adminFaq.deleteMessage').replace('{question}', deletingFaq.question)}
          confirmLabel={t('adminFaq.delete')}
          twoStep
          onClose={() => setDeletingFaq(null)}
          onConfirm={async () => {
            await api.delete(`/admin/faq/${deletingFaq.id}`);
            flash(t('adminFaq.deleted'));
            load();
          }}
        />
      )}
    </div>
  );
}

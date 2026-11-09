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

const AUDIENCE_OPTIONS = ['CLIENT', 'ADMIN', 'BOTH'];

function GuideFormModal({ guide, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const [titleEs, setTitleEs] = useState(guide?.titleEs || '');
  const [titleEn, setTitleEn] = useState(guide?.titleEn || '');
  const [descriptionEs, setDescriptionEs] = useState(guide?.descriptionEs || '');
  const [descriptionEn, setDescriptionEn] = useState(guide?.descriptionEn || '');
  const [contentEs, setContentEs] = useState(guide?.contentEs || '');
  const [contentEn, setContentEn] = useState(guide?.contentEn || '');
  const [audience, setAudience] = useState(guide?.audience || 'CLIENT');
  const [displayOrder, setDisplayOrder] = useState(guide?.displayOrder ?? 0);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () =>
    titleEs !== (guide?.titleEs || '') ||
    titleEn !== (guide?.titleEn || '') ||
    contentEs !== (guide?.contentEs || '') ||
    contentEn !== (guide?.contentEn || '');
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const doSave = async () => {
    setError('');
    try {
      const payload = {
        titleEs,
        titleEn: titleEn?.trim() ? titleEn : null,
        descriptionEs: descriptionEs?.trim() ? descriptionEs : null,
        descriptionEn: descriptionEn?.trim() ? descriptionEn : null,
        contentEs,
        contentEn: contentEn?.trim() ? contentEn : null,
        audience,
        displayOrder: Number(displayOrder) || 0,
      };
      if (guide) {
        await api.patch(`/admin/guides/${guide.id}`, payload);
      } else {
        await api.post('/admin/guides', payload);
      }
      onSaved();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      throw err;
    }
  };

  return (
    <Modal title={guide ? t('adminGuides.editTitle') : t('adminGuides.newTitle')} onClose={requestClose} width={860}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!titleEs || !contentEs) return;
          setConfirmingSave(true);
        }}
      >
        <BilingualField
          label={t('adminGuides.guideTitle')}
          esValue={titleEs}
          enValue={titleEn}
          onEsChange={(e) => setTitleEs(e.target.value)}
          onEnChange={(e) => setTitleEn(e.target.value)}
        />
        <BilingualField
          label={t('adminGuides.description')}
          esValue={descriptionEs}
          enValue={descriptionEn}
          onEsChange={(e) => setDescriptionEs(e.target.value)}
          onEnChange={(e) => setDescriptionEn(e.target.value)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <div>
            <label className="qlc-label">{t('adminGuides.audience')}</label>
            <select className="qlc-select" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {t(`adminGuides.audience${a}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="qlc-label">{t('adminGuides.order')}</label>
            <input
              className="qlc-input"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
        </div>
        <BilingualField
          label={t('adminGuides.content')}
          esValue={contentEs}
          enValue={contentEn}
          onEsChange={(e) => setContentEs(e.target.value)}
          onEnChange={(e) => setContentEn(e.target.value)}
          textarea
          rows={14}
        />
        <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', marginTop: -4 }}>{t('adminGuides.htmlHint')}</p>
        <button type="button" className="qlc-btn ghost" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? t('adminGuides.hidePreview') : t('adminGuides.showPreview')}
        </button>
        {showPreview && (
          <div className="qlc-card" style={{ marginTop: 10 }}>
            <div className="qlc-guide-content" dangerouslySetInnerHTML={{ __html: contentEs }} />
          </div>
        )}

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
          message={t('adminGuides.saveConfirmMessage')}
          onCancel={() => setConfirmingSave(false)}
          onConfirm={doSave}
        />
      )}
      {promptOpen && <UnsavedChangesModal onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />}
    </Modal>
  );
}

export default function AdminGuidesPage() {
  const { t } = useLanguage();
  const [guides, setGuides] = useState([]);
  const [editingGuide, setEditingGuide] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingGuide, setDeletingGuide] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => api.get('/admin/guides').then(({ data }) => setGuides(data.guides));
  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (guide) => {
    await api.patch(`/admin/guides/${guide.id}`, { isActive: !guide.isActive });
    load();
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= guides.length) return;
    const a = guides[index];
    const b = guides[target];
    await Promise.all([
      api.patch(`/admin/guides/${a.id}`, { displayOrder: b.displayOrder }),
      api.patch(`/admin/guides/${b.id}`, { displayOrder: a.displayOrder }),
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
          <div className="qlc-kicker">{t('adminGuides.kicker')}</div>
          <h1 style={{ margin: 0 }}>
            {t('adminGuides.title')} ({guides.length})
          </h1>
        </div>
        <button className="qlc-btn primary" onClick={() => setCreating(true)}>
          {t('adminGuides.newGuide')}
        </button>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      {guides.length === 0 ? (
        <div className="qlc-empty">{t('adminGuides.none')}</div>
      ) : (
        guides.map((guide, index) => (
          <div className="qlc-card" key={guide.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <strong>{guide.titleEs}</strong>
              <span style={{ display: 'flex', gap: 6 }}>
                <span className="qlc-badge muted">{t(`adminGuides.audience${guide.audience}`)}</span>
                <span className={`qlc-badge ${guide.isActive ? 'ok' : 'muted'}`}>
                  {guide.isActive ? t('adminGuides.visible') : t('adminGuides.hidden')}
                </span>
              </span>
            </div>
            {guide.descriptionEs && <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{guide.descriptionEs}</p>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="qlc-btn ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                {t('adminGuides.moveUp')}
              </button>
              <button className="qlc-btn ghost" onClick={() => move(index, 1)} disabled={index === guides.length - 1}>
                {t('adminGuides.moveDown')}
              </button>
              <button className="qlc-btn ghost" onClick={() => setEditingGuide(guide)}>
                {t('adminGuides.edit')}
              </button>
              <button className="qlc-btn ghost" onClick={() => toggleActive(guide)}>
                {guide.isActive ? t('adminGuides.hide') : t('adminGuides.show')}
              </button>
              <button className="qlc-btn danger" onClick={() => setDeletingGuide(guide)}>
                {t('adminGuides.delete')}
              </button>
            </div>
          </div>
        ))
      )}

      {creating && (
        <GuideFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            flash(t('adminGuides.added'));
            load();
          }}
        />
      )}
      {editingGuide && (
        <GuideFormModal
          guide={editingGuide}
          onClose={() => setEditingGuide(null)}
          onSaved={() => {
            setEditingGuide(null);
            flash(t('adminGuides.changesSaved'));
            load();
          }}
        />
      )}
      {deletingGuide && (
        <ConfirmModal
          title={t('adminGuides.deleteTitle')}
          message={t('adminGuides.deleteMessage').replace('{title}', deletingGuide.titleEs)}
          confirmLabel={t('adminGuides.delete')}
          twoStep
          onClose={() => setDeletingGuide(null)}
          onConfirm={async () => {
            await api.delete(`/admin/guides/${deletingGuide.id}`);
            flash(t('adminGuides.deleted'));
            load();
          }}
        />
      )}
    </div>
  );
}

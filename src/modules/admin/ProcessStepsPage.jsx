import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

/*
 * CORREGIR.xlsx CLIENTE 07 — "Tu proceso paso a paso" administrable desde
 * el panel; el cliente solo consulta (ver client/DashboardPage.jsx).
 */
const emptyForm = { stepNumber: '', titleEs: '', titleEn: '', descriptionEs: '', descriptionEn: '', displayOrder: '' };

export default function ProcessStepsPage() {
  const { t, language } = useLanguage();
  const [steps, setSteps] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get('/admin/process-steps')
      .then(({ data }) => setSteps(data.steps))
      .catch((err) => setError(translateBackendMessage(err.message, language)));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (step) => {
    setEditingId(step.id);
    setForm({
      stepNumber: step.stepNumber,
      titleEs: step.titleEs,
      titleEn: step.titleEn || '',
      descriptionEs: step.descriptionEs || '',
      descriptionEn: step.descriptionEn || '',
      displayOrder: step.displayOrder,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        stepNumber: Number(form.stepNumber),
        titleEs: form.titleEs,
        titleEn: form.titleEn || undefined,
        descriptionEs: form.descriptionEs || undefined,
        descriptionEn: form.descriptionEn || undefined,
        displayOrder: form.displayOrder === '' ? undefined : Number(form.displayOrder),
      };
      if (editingId) {
        await api.patch(`/admin/process-steps/${editingId}`, payload);
      } else {
        await api.post('/admin/process-steps', payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (step) => {
    await api.patch(`/admin/process-steps/${step.id}`, { isActive: !step.isActive });
    load();
  };

  const remove = async (step) => {
    await api.delete(`/admin/process-steps/${step.id}`);
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminProcessSteps.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminProcessSteps.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('adminProcessSteps.intro')}</p>

      {error && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{editingId ? t('adminProcessSteps.editStep') : t('adminProcessSteps.newStep')}</h3>
          <form onSubmit={submit}>
            <label className="qlc-label">{t('adminProcessSteps.stepNumber')}</label>
            <input
              className="qlc-input"
              type="number"
              min={1}
              value={form.stepNumber}
              onChange={(e) => setForm((f) => ({ ...f, stepNumber: e.target.value }))}
              required
            />
            <label className="qlc-label">{t('adminProcessSteps.titleEs')}</label>
            <input className="qlc-input" value={form.titleEs} onChange={(e) => setForm((f) => ({ ...f, titleEs: e.target.value }))} required />
            <label className="qlc-label">{t('adminProcessSteps.titleEn')}</label>
            <input className="qlc-input" value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
            <label className="qlc-label">{t('adminProcessSteps.descriptionEs')}</label>
            <textarea
              className="qlc-input"
              rows={2}
              value={form.descriptionEs}
              onChange={(e) => setForm((f) => ({ ...f, descriptionEs: e.target.value }))}
            />
            <label className="qlc-label">{t('adminProcessSteps.descriptionEn')}</label>
            <textarea
              className="qlc-input"
              rows={2}
              value={form.descriptionEn}
              onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
            />
            <label className="qlc-label">{t('adminProcessSteps.displayOrder')}</label>
            <input
              className="qlc-input"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="qlc-btn primary" disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </button>
              {editingId && (
                <button type="button" className="qlc-btn ghost" onClick={cancelEdit}>
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('adminProcessSteps.currentSteps')}</h3>
          {!steps ? (
            <div className="qlc-empty">{t('common.loading')}</div>
          ) : (
            <ul className="qlc-plain-list">
              {steps.map((s) => (
                <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>
                      {s.stepNumber}. {s.titleEs}
                    </strong>{' '}
                    {!s.isActive && <span className="qlc-badge muted">{t('adminProcessSteps.inactive')}</span>}
                  </span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button className="qlc-btn ghost" onClick={() => startEdit(s)}>
                      {t('common.edit')}
                    </button>
                    <button className="qlc-btn ghost" onClick={() => toggleActive(s)}>
                      {s.isActive ? t('adminProcessSteps.deactivate') : t('adminProcessSteps.activate')}
                    </button>
                    <button className="qlc-btn ghost" onClick={() => remove(s)}>
                      {t('common.delete')}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

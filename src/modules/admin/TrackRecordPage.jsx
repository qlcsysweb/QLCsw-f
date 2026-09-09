import { useEffect, useState } from 'react';
import api from '../../services/api';
import BilingualField from '../../components/BilingualField';
import { useLanguage } from '../../i18n/LanguageContext';

export default function TrackRecordPage() {
  const { t } = useLanguage();
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get('/admin/track-record').then(({ data }) => {
      setRecord(data.trackRecord);
      setForm(data.trackRecord);
    });
  useEffect(() => {
    load();
  }, []);

  if (!form) return <div className="qlc-empty">{t('common.loading')}</div>;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/track-record/${record.id}`, {
        title: form.title,
        titleEn: form.titleEn || null,
        description: form.description,
        descriptionEn: form.descriptionEn || null,
        platformName: form.platformName,
        profileLink: form.profileLink || '',
        ranking: form.ranking,
      });
      setMessage(t('adminTrackRecord.updated'));
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminTrackRecord.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminTrackRecord.title')}</h1>
      <form className="qlc-card" style={{ maxWidth: 780 }} onSubmit={submit}>
        <BilingualField
          label={t('adminTrackRecord.fieldTitle')}
          esValue={form.title}
          enValue={form.titleEn}
          onEsChange={update('title')}
          onEnChange={update('titleEn')}
        />
        <BilingualField
          label={t('adminTrackRecord.description')}
          esValue={form.description}
          enValue={form.descriptionEn}
          onEsChange={update('description')}
          onEnChange={update('descriptionEn')}
          textarea
        />
        <label className="qlc-label">{t('adminTrackRecord.platform')}</label>
        <input className="qlc-input" value={form.platformName} onChange={update('platformName')} />
        <label className="qlc-label">{t('adminTrackRecord.profileLink')}</label>
        <input
          className="qlc-input"
          value={form.profileLink || ''}
          onChange={update('profileLink')}
          placeholder="https://www.bitget.com/copytrading/..."
        />
        <label className="qlc-label">{t('adminTrackRecord.currentRanking')}</label>
        <input className="qlc-input" value={form.ranking} onChange={update('ranking')} placeholder="#XXX" />

        <div className="qlc-form-actions">
          {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
          <button className="qlc-btn primary" disabled={saving}>
            {saving ? t('common.saving') : t('modals.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}

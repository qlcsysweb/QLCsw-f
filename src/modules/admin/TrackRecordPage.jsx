import { useEffect, useState } from 'react';
import api from '../../services/api';
import BilingualField from '../../components/BilingualField';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function TrackRecordPage() {
  const { t, language } = useLanguage();
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
    try {
      await api.patch(`/admin/track-record/${record.id}`, {
        title: form.title,
        titleEn: form.titleEn || null,
        description: form.description,
        descriptionEn: form.descriptionEn || null,
        platformName: form.platformName,
        profileLink: form.profileLink || '',
        roi30d: form.roi30d ?? '',
        winRate: form.winRate ?? '',
      });
      setMessage(t('adminTrackRecord.updated'));
      setTimeout(() => setMessage(''), 3000);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
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
        {/* Indicadores que el sitio público muestra en el hero y en
            Resultados (antes: "#XXX / Clasificación actual"). Vacío = "—". */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label className="qlc-label">{t('adminTrackRecord.roi30d')}</label>
            <input
              className="qlc-input"
              inputMode="decimal"
              value={form.roi30d ?? ''}
              onChange={update('roi30d')}
              placeholder="+12.34"
            />
          </div>
          <div>
            <label className="qlc-label">{t('adminTrackRecord.winRate')}</label>
            <input
              className="qlc-input"
              inputMode="decimal"
              value={form.winRate ?? ''}
              onChange={update('winRate')}
              placeholder="78.5"
            />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 4 }}>{t('adminTrackRecord.indicatorsHint')}</p>
        {error && <div className="qlc-field-error">{error}</div>}

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

import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ACCOUNT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get('/client/me').then(({ data }) => {
      setProfile(data.profile);
      setPhone(data.profile.phone || '');
    });
  useEffect(() => {
    load();
  }, []);

  if (!profile) return <div className="qlc-empty">{t('common.loading')}</div>;

  const accountStatusMap = ACCOUNT_STATUS(t);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/client/me', { phone });
      setMessage(t('clientProfile.updated'));
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientProfile.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>
        {profile.firstName} {profile.lastName}
      </h1>

      <div className="qlc-card" style={{ maxWidth: 480 }}>
        <label className="qlc-label">{t('clientProfile.email')}</label>
        <input className="qlc-input" value={profile.email} disabled />
        <label className="qlc-label">{t('clientProfile.username')}</label>
        <input className="qlc-input" value={profile.username} disabled />
        <label className="qlc-label">{t('clientProfile.accountStatus')}</label>
        <div style={{ marginBottom: 12 }}>
          <span className={`qlc-badge ${statusOf(accountStatusMap, profile.status).className}`}>
            {statusOf(accountStatusMap, profile.status).text}
          </span>
        </div>
        <label className="qlc-label">{t('clientProfile.clientSince')}</label>
        <input className="qlc-input" value={new Date(profile.memberSince).toLocaleDateString()} disabled />

        <form onSubmit={submit}>
          <label className="qlc-label">{t('clientProfile.phone')}</label>
          <input className="qlc-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary" disabled={saving}>
              {saving ? t('common.saving') : t('modals.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

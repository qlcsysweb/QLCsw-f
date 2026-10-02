import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ACCOUNT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import usePolling from '../../hooks/usePolling';
import LoadingScreen from '../../components/LoadingScreen';

// CORRECCIÓN 6/17/18: sin teléfono, sin username — solo nombre, apellidos,
// correo (identificador único) y estado de cuenta.
export default function ProfilePage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);

  const load = () => api.get('/client/me').then(({ data }) => setProfile(data.profile));
  useEffect(() => {
    load();
  }, []);
  // Página de solo lectura (ningún campo lo edita el cliente): si el admin
  // cambia el estado de cuenta o el nombre, se refleja sin F5.
  usePolling(load, 15000);

  if (!profile) return <LoadingScreen />;

  const accountStatusMap = ACCOUNT_STATUS(t);

  return (
    <div>
      <div className="qlc-kicker">{t('clientProfile.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>
        {profile.firstName} {profile.lastName}
      </h1>

      <div className="qlc-card" style={{ maxWidth: 480 }}>
        <label className="qlc-label">{t('clientProfile.email')}</label>
        <input className="qlc-input" value={profile.email} disabled />
        <label className="qlc-label">{t('clientProfile.accountStatus')}</label>
        <div style={{ marginBottom: 12 }}>
          <span className={`qlc-badge ${statusOf(accountStatusMap, profile.status).className}`}>
            {statusOf(accountStatusMap, profile.status).text}
          </span>
        </div>
        <label className="qlc-label">{t('clientProfile.clientSince')}</label>
        <input className="qlc-input" value={new Date(profile.memberSince).toLocaleDateString()} disabled />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ACCOUNT_STATUS, statusOf } from '../../utils/statusLabels';

export default function ProfilePage() {
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

  if (!profile) return <div className="qlc-empty">Cargando…</div>;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/client/me', { phone });
      setMessage('Perfil actualizado.');
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">MI PERFIL</div>
      <h1 style={{ marginTop: 0 }}>
        {profile.firstName} {profile.lastName}
      </h1>

      <div className="qlc-card" style={{ maxWidth: 480 }}>
        <label className="qlc-label">Email</label>
        <input className="qlc-input" value={profile.email} disabled />
        <label className="qlc-label">Usuario</label>
        <input className="qlc-input" value={profile.username} disabled />
        <label className="qlc-label">Estado de cuenta</label>
        <div style={{ marginBottom: 12 }}>
          <span className={`qlc-badge ${statusOf(ACCOUNT_STATUS, profile.status).className}`}>
            {statusOf(ACCOUNT_STATUS, profile.status).text}
          </span>
        </div>
        <label className="qlc-label">Cliente desde</label>
        <input className="qlc-input" value={new Date(profile.memberSince).toLocaleDateString()} disabled />

        <form onSubmit={submit}>
          <label className="qlc-label">Teléfono</label>
          <input className="qlc-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

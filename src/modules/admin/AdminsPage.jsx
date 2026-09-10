import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function AdminsPage() {
  const { t, language } = useLanguage();
  const [admins, setAdmins] = useState([]);
  const [limit, setLimit] = useState(3);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const load = () =>
    api.get('/admin/admins').then(({ data }) => {
      setAdmins(data.admins);
      setLimit(data.limit);
    });
  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/admins', form);
      setForm({ firstName: '', lastName: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  const toggleActive = async (id, isActive) => {
    await api.patch(`/admin/admins/${id}`, { isActive });
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminAdmins.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>
        {t('adminAdmins.title')} ({admins.length}/{limit})
      </h1>

      <div className="qlc-table-wrap" style={{ marginBottom: 20 }}>
        <table className="qlc-table">
          <thead>
            <tr>
              <th>{t('adminAdmins.name')}</th>
              <th>{t('adminAdmins.email')}</th>
              <th>{t('adminAdmins.lastLogin')}</th>
              <th>{t('adminAdmins.status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.profile?.firstName} {a.profile?.lastName}
                </td>
                <td>{a.email}</td>
                <td>{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : '—'}</td>
                <td>
                  <span className={`qlc-badge ${a.isActive ? 'ok' : 'danger'}`}>
                    {a.isActive ? t('adminAdmins.active') : t('adminAdmins.inactive')}
                  </span>
                </td>
                <td>
                  <button
                    className="qlc-btn ghost"
                    onClick={() => (a.isActive ? setConfirmDeactivate(a) : toggleActive(a.id, true))}
                  >
                    {a.isActive ? t('adminAdmins.deactivate') : t('adminAdmins.activate')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {admins.length < limit && (
        <form className="qlc-card" style={{ maxWidth: 480 }} onSubmit={create}>
          <h3 style={{ marginTop: 0 }}>{t('adminAdmins.newAdmin')}</h3>
          <label className="qlc-label">{t('adminAdmins.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
          <label className="qlc-label">{t('adminAdmins.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
          <label className="qlc-label">{t('adminAdmins.email')}</label>
          <input className="qlc-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <label className="qlc-label">{t('adminAdmins.password')}</label>
          <input className="qlc-input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
          {error && <div className="qlc-field-error">{error}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn primary">{t('adminAdmins.createAdmin')}</button>
          </div>
        </form>
      )}

      {confirmDeactivate && (
        <ConfirmModal
          title={t('adminAdmins.deactivateTitle')}
          message={t('adminAdmins.deactivateMessage').replace(
            '{name}',
            `${confirmDeactivate.profile?.firstName} ${confirmDeactivate.profile?.lastName}`
          )}
          confirmLabel={t('adminAdmins.deactivate')}
          onClose={() => setConfirmDeactivate(null)}
          onConfirm={() => toggleActive(confirmDeactivate.id, false)}
        />
      )}
    </div>
  );
}

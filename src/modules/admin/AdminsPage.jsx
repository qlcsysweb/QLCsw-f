import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// CORRECCIÓN 3 (bloque de 20) — un admin autorizado edita nombre/correo/
// contraseña de otro admin desde este modal. La contraseña nueva es
// opcional (se conserva la actual si se deja vacía), se pide dos veces
// (confirmación) y el cambio se confirma una segunda vez antes de guardar.
function EditAdminModal({ admin, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    firstName: admin.profile?.firstName || '',
    lastName: admin.profile?.lastName || '',
    email: admin.email || '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const requestSave = (e) => {
    e.preventDefault();
    setError('');
    if (form.password && form.password !== form.confirmPassword) {
      setError(t('adminAdmins.passwordMismatch'));
      return;
    }
    setConfirming(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/admins/${admin.id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
      });
      onSaved();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-modal-overlay">
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{t('adminAdmins.editAdmin')}</h2>
        {!confirming ? (
          <form onSubmit={requestSave}>
            <label className="qlc-label">{t('adminAdmins.firstName')}</label>
            <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
            <label className="qlc-label">{t('adminAdmins.lastName')}</label>
            <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
            <label className="qlc-label">{t('adminAdmins.email')}</label>
            <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
            <label className="qlc-label">{t('adminAdmins.newPasswordOptional')}</label>
            <input className="qlc-input" type="password" value={form.password} onChange={update('password')} minLength={8} placeholder={t('adminAdmins.leaveBlankPassword')} />
            {form.password && (
              <>
                <label className="qlc-label">{t('adminAdmins.confirmPassword')}</label>
                <input className="qlc-input" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} minLength={8} />
              </>
            )}
            {error && <div className="qlc-field-error">{error}</div>}
            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="qlc-btn primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{t('adminClientsList.confirmChangesIntro')}</p>
            <ul className="qlc-plain-list" style={{ fontSize: 13, marginBottom: 16 }}>
              <li>{t('adminAdmins.firstName')} / {t('adminAdmins.lastName')}: {form.firstName} {form.lastName}</li>
              <li>{t('adminAdmins.email')}: {form.email}</li>
              <li>{t('adminAdmins.newPasswordOptional')}: {form.password ? t('adminClientsList.willChange') : t('adminClientsList.willKeep')}</li>
            </ul>
            {error && <div className="qlc-field-error">{error}</div>}
            <div className="qlc-form-actions">
              <button type="button" className="qlc-btn ghost" onClick={() => setConfirming(false)} disabled={saving}>
                {t('common.back')}
              </button>
              <button type="button" className="qlc-btn primary" onClick={confirmSave} disabled={saving}>
                {saving ? t('common.saving') : t('adminClientsList.confirmAndSave')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminsPage() {
  const { t, language } = useLanguage();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const load = () =>
    api.get('/admin/admins').then(({ data }) => {
      setAdmins(data.admins);
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

  const toggleGeneral = async (id, isGeneralAdmin) => {
    setError('');
    try {
      await api.patch(`/admin/admins/${id}/general`, { isGeneralAdmin });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('adminAdmins.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>
        {t('adminAdmins.title')} ({admins.length})
      </h1>

      {error && <div className="qlc-field-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="qlc-table-wrap" style={{ marginBottom: 20 }}>
        <table className="qlc-table">
          <thead>
            <tr>
              <th>{t('adminAdmins.name')}</th>
              <th>{t('adminAdmins.email')}</th>
              <th>{t('adminAdmins.lastLogin')}</th>
              <th>{t('adminAdmins.status')}</th>
              <th>{t('adminAdmins.generalAdmin')}</th>
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
                  {a.profile?.isGeneralAdmin ? (
                    <span className="qlc-badge ok">{t('adminAdmins.generalAdminYes')}</span>
                  ) : (
                    <button className="qlc-btn ghost" onClick={() => toggleGeneral(a.id, true)}>
                      {t('adminAdmins.makeGeneralAdmin')}
                    </button>
                  )}
                  {a.profile?.isGeneralAdmin && (
                    <button className="qlc-btn ghost" style={{ marginLeft: 6 }} onClick={() => toggleGeneral(a.id, false)}>
                      {t('adminAdmins.removeGeneralAdmin')}
                    </button>
                  )}
                </td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" className="qlc-btn ghost" onClick={() => setEditingAdmin(a)}>
                    {t('common.edit')}
                  </button>
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

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={() => {
            setEditingAdmin(null);
            load();
          }}
        />
      )}
    </div>
  );
}

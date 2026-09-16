import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ACCOUNT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';

// CORRECCIÓN 2 (bloque de 20) — "usuario" es una nomenclatura libre que
// define QLC (ej. "QLC001"), independiente del correo (login real) y del
// nombre completo. Opcional: el admin puede dejarlo vacío.
function CreateClientModal({ onClose, onCreated }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', password: '', nationality: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admin/clients', { ...form, username: form.username || undefined });
      onCreated();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-modal-overlay">
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{t('adminClientsList.modalTitle')}</h2>
        <form onSubmit={submit}>
          <label className="qlc-label">{t('adminClientsList.username')}</label>
          <input className="qlc-input" value={form.username} onChange={update('username')} placeholder={t('adminClientsList.usernamePlaceholder')} />
          <label className="qlc-label">{t('adminClientsList.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('adminClientsList.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
          <label className="qlc-label">{t('adminClientsList.nationality')}</label>
          <input className="qlc-input" value={form.nationality} onChange={update('nationality')} />
          <label className="qlc-label">{t('adminClientsList.email')}</label>
          <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
          <label className="qlc-label">{t('adminClientsList.initialPassword')}</label>
          <input
            className="qlc-input"
            type="password"
            value={form.password}
            onChange={update('password')}
            required
            minLength={8}
          />

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="qlc-btn primary" disabled={saving}>
              {saving ? t('common.saving') : t('adminClientsList.createClient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// CORRECCIÓN 2 (bloque de 20) — modal de edición: usuario, nombre completo,
// correo y contraseña, todos independientes. La contraseña es opcional: si
// se deja vacía, se conserva la actual. Pide confirmación antes de guardar
// y valida correo/usuario duplicados (el backend es la fuente real de esa
// validación; aquí solo se muestra el error que devuelva).
function EditClientModal({ client, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    username: client.username || '',
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    email: client.user?.email || '',
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
      setError(t('adminClientsList.passwordMismatch'));
      return;
    }
    setConfirming(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        username: form.username || null,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
      };
      await api.patch(`/admin/clients/${client.id}`, payload);
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
        <h2>{t('adminClientsList.editClient')}</h2>
        {!confirming ? (
          <form onSubmit={requestSave}>
            <label className="qlc-label">{t('adminClientsList.username')}</label>
            <input className="qlc-input" value={form.username} onChange={update('username')} placeholder={t('adminClientsList.usernamePlaceholder')} />
            <label className="qlc-label">{t('adminClientsList.firstName')}</label>
            <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
            <label className="qlc-label">{t('adminClientsList.lastName')}</label>
            <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
            <label className="qlc-label">{t('adminClientsList.email')}</label>
            <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
            <label className="qlc-label">{t('adminClientsList.newPasswordOptional')}</label>
            <input className="qlc-input" type="password" value={form.password} onChange={update('password')} minLength={8} placeholder={t('adminClientsList.leaveBlankPassword')} />
            {form.password && (
              <>
                <label className="qlc-label">{t('adminClientsList.confirmPassword')}</label>
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
              <li>{t('adminClientsList.username')}: {form.username || '—'}</li>
              <li>{t('adminClientsList.firstName')} / {t('adminClientsList.lastName')}: {form.firstName} {form.lastName}</li>
              <li>{t('adminClientsList.email')}: {form.email}</li>
              <li>{t('adminClientsList.newPasswordOptional')}: {form.password ? t('adminClientsList.willChange') : t('adminClientsList.willKeep')}</li>
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

export default function ClientsListPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const accountStatusMap = ACCOUNT_STATUS(t);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/clients', { params: { search: search || undefined } })
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Actualización sin refresh manual: nuevos registros o cambios de estado
  // aparecen solos, sin el parpadeo de "Cargando..." que sí tiene la
  // búsqueda manual (esta variante nunca toca `loading`).
  usePolling(() => {
    api
      .get('/admin/clients', { params: { search: search || undefined } })
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
      });
  }, 8000);

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">{t('adminClientsList.kicker')}</div>
          <h1 style={{ margin: 0 }}>
            {t('adminClientsList.title')} ({total})
          </h1>
        </div>
        <button className="qlc-btn primary" onClick={() => setShowCreate(true)}>
          {t('adminClientsList.newClient')}
        </button>
      </div>

      <input
        className="qlc-input"
        style={{ maxWidth: 320, marginBottom: 18 }}
        placeholder={t('adminClientsList.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="qlc-empty">{t('adminClientsList.loading')}</div>
      ) : items.length === 0 ? (
        <div className="qlc-empty">{t('adminClientsList.none')}</div>
      ) : (
        <div className="qlc-table-wrap">
          <table className="qlc-table">
            <thead>
              <tr>
                <th>{t('adminClientsList.username')}</th>
                <th>{t('adminClientsList.client')}</th>
                <th>{t('adminClientsList.status')}</th>
                <th>{t('adminClientsList.subaccounts')}</th>
                <th>{t('adminClientsList.process')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const accStatus = statusOf(accountStatusMap, c.status);
                const summary = c.subaccountsSummary || { total: 0, activated: 0, readyToActivate: 0 };
                return (
                  <tr key={c.id}>
                    <td>{c.username || <span style={{ color: 'var(--qlc-muted2)' }}>—</span>}</td>
                    <td>
                      {c.firstName} {c.lastName}
                      <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{c.user?.email}</div>
                    </td>
                    <td>
                      <span className={`qlc-badge ${accStatus.className}`}>{accStatus.text}</span>
                    </td>
                    <td>
                      {summary.total} <span style={{ color: 'var(--qlc-muted2)' }}>({summary.activated} {t('adminClientsList.activatedShort')})</span>
                    </td>
                    <td>
                      {summary.readyToActivate > 0 ? (
                        <span className="qlc-badge ok" title={t('adminClientsList.readyToActivate')}>
                          ✓ {summary.readyToActivate} {t('adminClientsList.readyToActivate')}
                        </span>
                      ) : (
                        <span className="qlc-badge muted">—</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="qlc-btn ghost" onClick={() => setEditingClient(c)}>
                        {t('common.edit')}
                      </button>
                      <Link className="qlc-btn ghost" to={`/admin/clients/${c.id}`}>
                        {t('adminClientsList.view')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaved={() => {
            setEditingClient(null);
            load();
          }}
        />
      )}
    </div>
  );
}

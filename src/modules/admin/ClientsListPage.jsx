import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ACCOUNT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// CORRECCIÓN 5/6/17/18: el registro directo desde la web pública ya cubre
// el alta de clientes; este modal queda como una vía administrativa
// alterna (sin teléfono, sin username — solo nombre, apellidos, correo y
// contraseña inicial).
function CreateClientModal({ onClose, onCreated }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admin/clients', form);
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
          <label className="qlc-label">{t('adminClientsList.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('adminClientsList.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
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

export default function ClientsListPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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
                    <td>
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
    </div>
  );
}

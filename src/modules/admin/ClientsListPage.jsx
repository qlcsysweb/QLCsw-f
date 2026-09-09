import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ACCOUNT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { pickBilingual } from '../../i18n/bilingualContent';

function CreateClientModal({ onClose, onCreated }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    modelKey: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.modelKey) delete payload.modelKey;
      await api.post('/admin/clients', payload);
      onCreated();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-modal-overlay" onClick={onClose}>
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{t('adminClientsList.modalTitle')}</h2>
        <form onSubmit={submit}>
          <label className="qlc-label">{t('adminClientsList.firstName')}</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">{t('adminClientsList.lastName')}</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
          <label className="qlc-label">{t('adminClientsList.email')}</label>
          <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
          <label className="qlc-label">{t('adminClientsList.phone')}</label>
          <input className="qlc-input" value={form.phone} onChange={update('phone')} />
          <label className="qlc-label">{t('adminClientsList.username')}</label>
          <input className="qlc-input" value={form.username} onChange={update('username')} required />
          <label className="qlc-label">{t('adminClientsList.initialPassword')}</label>
          <input
            className="qlc-input"
            type="password"
            value={form.password}
            onChange={update('password')}
            required
            minLength={8}
          />
          <label className="qlc-label">{t('adminClientsList.modelOptional')}</label>
          <select className="qlc-select" value={form.modelKey} onChange={update('modelKey')}>
            <option value="">{t('adminClientsList.unassigned')}</option>
            <option value="FLEXIBLE">Flexible</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="COMPOUND">Compound</option>
          </select>

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
  const { t, language } = useLanguage();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const accountStatusMap = ACCOUNT_STATUS(t);
  const apiStatusMap = {
    CONECTADA: { text: t('status.apiConnection.connected'), className: 'ok' },
    DESCONECTADA: { text: t('status.apiConnection.disconnected'), className: 'muted' },
    PENDIENTE: { text: t('status.apiConnection.pending'), className: 'muted' },
  };

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
                <th>{t('adminClientsList.user')}</th>
                <th>{t('adminClientsList.status')}</th>
                <th>{t('adminClientsList.model')}</th>
                <th>{t('adminClientsList.api')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const accStatus = statusOf(accountStatusMap, c.status);
                const apiStatus = apiStatusMap[c.apiConnection?.status] || apiStatusMap.PENDIENTE;
                return (
                  <tr key={c.id}>
                    <td>
                      {c.firstName} {c.lastName}
                      <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{c.user?.email}</div>
                    </td>
                    <td>{c.user?.username}</td>
                    <td>
                      <span className={`qlc-badge ${accStatus.className}`}>{accStatus.text}</span>
                    </td>
                    <td>
                      {c.clientModel?.model
                        ? pickBilingual(c.clientModel.model.name, c.clientModel.model.nameEn, language)
                        : t('adminClientsList.unassigned')}
                    </td>
                    <td>
                      <span className={`qlc-badge ${apiStatus.className}`}>{apiStatus.text}</span>
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

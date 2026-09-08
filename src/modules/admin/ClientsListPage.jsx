import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STATUS_CLASS = {
  ACTIVE: 'ok',
  PENDING: 'warn',
  REVIEW: 'warn',
  INACTIVE: 'danger',
};

function CreateClientModal({ onClose, onCreated }) {
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
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-modal-overlay" onClick={onClose}>
      <div className="qlc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Registrar nuevo cliente</h2>
        <form onSubmit={submit}>
          <label className="qlc-label">Nombre</label>
          <input className="qlc-input" value={form.firstName} onChange={update('firstName')} required />
          <label className="qlc-label">Apellidos</label>
          <input className="qlc-input" value={form.lastName} onChange={update('lastName')} required />
          <label className="qlc-label">Email</label>
          <input className="qlc-input" type="email" value={form.email} onChange={update('email')} required />
          <label className="qlc-label">Teléfono</label>
          <input className="qlc-input" value={form.phone} onChange={update('phone')} />
          <label className="qlc-label">Usuario</label>
          <input className="qlc-input" value={form.username} onChange={update('username')} required />
          <label className="qlc-label">Contraseña inicial</label>
          <input
            className="qlc-input"
            type="password"
            value={form.password}
            onChange={update('password')}
            required
            minLength={8}
          />
          <label className="qlc-label">Modelo (opcional)</label>
          <select className="qlc-select" value={form.modelKey} onChange={update('modelKey')}>
            <option value="">Sin asignar</option>
            <option value="FLEXIBLE">Flexible</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="COMPOUND">Compound</option>
          </select>

          {error && <div className="qlc-field-error">{error}</div>}

          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="qlc-btn primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientsListPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">ADMINISTRACIÓN DE CLIENTES</div>
          <h1 style={{ margin: 0 }}>Clientes ({total})</h1>
        </div>
        <button className="qlc-btn primary" onClick={() => setShowCreate(true)}>
          + Nuevo cliente
        </button>
      </div>

      <input
        className="qlc-input"
        style={{ maxWidth: 320, marginBottom: 18 }}
        placeholder="Buscar por nombre, email o usuario…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="qlc-empty">Cargando clientes…</div>
      ) : items.length === 0 ? (
        <div className="qlc-empty">No hay clientes registrados todavía.</div>
      ) : (
        <div className="qlc-table-wrap">
          <table className="qlc-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Modelo</th>
                <th>API</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.firstName} {c.lastName}
                    <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{c.user?.email}</div>
                  </td>
                  <td>{c.user?.username}</td>
                  <td>
                    <span className={`qlc-badge ${STATUS_CLASS[c.status] || 'muted'}`}>{c.status}</span>
                  </td>
                  <td>{c.clientModel?.model?.name || '—'}</td>
                  <td>
                    <span className={`qlc-badge ${c.apiConnection?.status === 'CONECTADA' ? 'ok' : 'muted'}`}>
                      {c.apiConnection?.status || 'PENDIENTE'}
                    </span>
                  </td>
                  <td>
                    <Link className="qlc-btn ghost" to={`/admin/clients/${c.id}`}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
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

import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [limit, setLimit] = useState(3);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', username: '', password: '' });
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
      setForm({ firstName: '', lastName: '', email: '', username: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (id, isActive) => {
    await api.patch(`/admin/admins/${id}`, { isActive });
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">ADMINISTRADORES</div>
      <h1 style={{ marginTop: 0 }}>
        Administradores ({admins.length}/{limit})
      </h1>

      <div className="qlc-table-wrap" style={{ marginBottom: 20 }}>
        <table className="qlc-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Último acceso</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.profile?.firstName} {a.profile?.lastName}
                </td>
                <td>{a.username}</td>
                <td>{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : '—'}</td>
                <td>
                  <span className={`qlc-badge ${a.isActive ? 'ok' : 'danger'}`}>
                    {a.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td>
                  <button
                    className="qlc-btn ghost"
                    onClick={() => (a.isActive ? setConfirmDeactivate(a) : toggleActive(a.id, true))}
                  >
                    {a.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {admins.length < limit && (
        <form className="qlc-card" style={{ maxWidth: 480 }} onSubmit={create}>
          <h3 style={{ marginTop: 0 }}>Nuevo administrador</h3>
          <label className="qlc-label">Nombre</label>
          <input className="qlc-input" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
          <label className="qlc-label">Apellidos</label>
          <input className="qlc-input" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
          <label className="qlc-label">Email</label>
          <input className="qlc-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <label className="qlc-label">Usuario</label>
          <input className="qlc-input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
          <label className="qlc-label">Contraseña</label>
          <input className="qlc-input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
          {error && <div className="qlc-field-error">{error}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn primary">Crear administrador</button>
          </div>
        </form>
      )}

      {confirmDeactivate && (
        <ConfirmModal
          title="¿Desactivar administrador?"
          message={`${confirmDeactivate.profile?.firstName} ${confirmDeactivate.profile?.lastName} no podrá iniciar sesión en el panel administrativo hasta que lo reactives.`}
          confirmLabel="Desactivar"
          onClose={() => setConfirmDeactivate(null)}
          onConfirm={() => toggleActive(confirmDeactivate.id, false)}
        />
      )}
    </div>
  );
}

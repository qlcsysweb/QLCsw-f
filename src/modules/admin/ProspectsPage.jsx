import { useEffect, useState } from 'react';
import api from '../../services/api';
import { PROSPECT_STATUS, statusOf } from '../../utils/statusLabels';

function CopyEmailButton({ email }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles no rompemos la vista.
    }
  };

  return (
    <button type="button" className="qlc-btn ghost" onClick={copy}>
      {copied ? '✓ Correo copiado' : 'Copiar correo'}
    </button>
  );
}

function ProspectRow({ p, onUpdateStatus }) {
  const status = statusOf(PROSPECT_STATUS, p.status, 'NUEVO');
  return (
    <tr>
      <td>
        {p.firstName} {p.lastName || ''}
      </td>
      <td>{p.email}</td>
      <td>
        <span className={`qlc-badge ${status.className}`}>{status.text}</span>
      </td>
      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
      <td>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CopyEmailButton email={p.email} />
          <select
            className="qlc-select"
            value={p.status}
            onChange={(e) => onUpdateStatus(p.id, e.target.value)}
          >
            <option value="NUEVO">Nuevo</option>
            <option value="CONTACTADO">Contactado</option>
            <option value="CONVERTIDO">Convertido</option>
            <option value="DESCARTADO">Descartado</option>
          </select>
        </div>
      </td>
    </tr>
  );
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState([]);
  const [counts, setCounts] = useState({ total: 0, registered: 0, unregistered: 0 });

  const load = () =>
    api.get('/admin/prospects').then(({ data }) => {
      setProspects(data.prospects);
      setCounts(data.counts);
    });

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/prospects/${id}`, { status });
    load();
  };

  const unregistered = prospects.filter((p) => !p.isRegistered);
  const registered = prospects.filter((p) => p.isRegistered);

  return (
    <div>
      <div className="qlc-kicker">PROSPECTOS</div>
      <h1 style={{ marginTop: 0 }}>Solicitudes de información</h1>
      <p style={{ color: 'var(--qlc-muted, #8a8f98)', marginTop: -8 }}>
        Personas que solicitaron información en el sitio público. Comparamos su correo contra las
        cuentas ya registradas en QLC para saber a quién todavía hay que invitar a completar su
        registro.
      </p>

      <div className="qlc-stat-grid" style={{ marginBottom: 24 }}>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">Total de prospectos</span>
          <strong className="qlc-stat-value">{counts.total}</strong>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">Ya registrados</span>
          <strong className="qlc-stat-value">{counts.registered}</strong>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">Pendientes de registro</span>
          <strong className="qlc-stat-value">{counts.unregistered}</strong>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3>Prospectos pendientes de registro</h3>
        <p style={{ color: 'var(--qlc-muted, #8a8f98)', marginTop: -4 }}>
          Solicitaron información pero todavía no tienen una cuenta en QLC.
        </p>
        {unregistered.length === 0 ? (
          <div className="qlc-empty">No hay prospectos pendientes de registro.</div>
        ) : (
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Solicitado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unregistered.map((p) => (
                  <ProspectRow key={p.id} p={p} onUpdateStatus={updateStatus} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3>Prospectos ya registrados</h3>
        <p style={{ color: 'var(--qlc-muted, #8a8f98)', marginTop: -4 }}>
          Solicitaron información y ya completaron su registro en QLC.
        </p>
        {registered.length === 0 ? (
          <div className="qlc-empty">No hay prospectos registrados todavía.</div>
        ) : (
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Solicitado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registered.map((p) => (
                  <ProspectRow key={p.id} p={p} onUpdateStatus={updateStatus} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

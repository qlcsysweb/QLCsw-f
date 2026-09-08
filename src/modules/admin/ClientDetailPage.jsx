import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const CONDITION_LABELS = {
  CONTRACT: 'Contrato firmado',
  FUNDS: 'Fondos disponibles',
  PAYMENT: 'Pago reportado',
  API: 'Conexión API',
  ACTIVATION: 'Activación',
};

function ConditionRow({ condition, onUpdate }) {
  const [saving, setSaving] = useState(false);

  const setStatus = async (status) => {
    setSaving(true);
    try {
      await onUpdate(condition.type, status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-condition-row">
      <span>{CONDITION_LABELS[condition.type] || condition.type}</span>
      <span className={`qlc-badge ${condition.status === 'CONFIRMED' ? 'ok' : condition.status === 'REJECTED' ? 'danger' : 'warn'}`}>
        {condition.status}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="qlc-btn ghost" disabled={saving} onClick={() => setStatus('CONFIRMED')}>
          Confirmar
        </button>
        <button className="qlc-btn ghost" disabled={saving} onClick={() => setStatus('REJECTED')}>
          Rechazar
        </button>
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [apiForm, setApiForm] = useState({ apiKey: '', apiSecret: '', status: 'PENDIENTE' });
  const [docForm, setDocForm] = useState({ category: 'identificacion', description: '' });
  const [uploading, setUploading] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const [confirmResetSigned, setConfirmResetSigned] = useState(false);

  const load = () => {
    api
      .get(`/admin/clients/${id}`)
      .then(({ data }) => {
        setClient(data.client);
        setApiForm((f) => ({ ...f, status: data.client.apiConnection?.status || 'PENDIENTE' }));
        setContract(data.client.contracts?.[0] || null);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(load, [id]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const updateCondition = async (type, status) => {
    await api.patch(`/admin/clients/${id}/process/${type}`, { status });
    flash('Condición actualizada.');
    load();
  };

  const toggleActive = async (isActive) => {
    await api.patch(`/admin/clients/${id}/active`, { isActive });
    flash(isActive ? 'Cliente activado.' : 'Cliente desactivado.');
    load();
  };

  const activate = async () => {
    try {
      await api.post(`/admin/clients/${id}/activate`);
      flash('Cliente activado correctamente.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveApiConnection = async (e) => {
    e.preventDefault();
    const payload = { status: apiForm.status };
    if (apiForm.apiKey) payload.apiKey = apiForm.apiKey;
    if (apiForm.apiSecret) payload.apiSecret = apiForm.apiSecret;
    await api.patch(`/admin/clients/${id}/api-connection`, payload);
    setApiForm((f) => ({ ...f, apiKey: '', apiSecret: '' }));
    flash('Conexión API actualizada.');
    load();
  };

  const uploadContract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading('contract');
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/admin/clients/${id}/contracts`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      flash('Contrato subido correctamente.');
      load();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading('');
      e.target.value = '';
    }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    const file = e.target.elements.docFile.files[0];
    if (!file) return;
    setUploading('document');
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', docForm.category);
    fd.append('description', docForm.description);
    try {
      await api.post(`/admin/clients/${id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      flash('Documento subido correctamente.');
      e.target.reset();
      setDocForm((f) => ({ ...f, description: '' }));
      load();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading('');
    }
  };

  const removeDocument = async (docId) => {
    await api.delete(`/admin/documents/${docId}`);
    flash('Documento eliminado.');
    load();
  };

  const confirmDeactivateAccount = async () => {
    await toggleActive(false);
  };

  const resetSignedContract = async () => {
    await api.post(`/admin/contracts/${contract.id}/reset-signed`);
    flash('El contrato firmado fue eliminado. El cliente puede volver a enviarlo.');
    load();
  };

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!client) return <div className="qlc-empty">Cargando cliente…</div>;

  return (
    <div>
      <Link to="/admin/clients" style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
        ← Volver a clientes
      </Link>

      <div className="qlc-page-header" style={{ marginTop: 10 }}>
        <div>
          <div className="qlc-kicker">FICHA DE CLIENTE</div>
          <h1 style={{ margin: 0 }}>
            {client.firstName} {client.lastName}
          </h1>
          <div style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>
            {client.user?.email} · @{client.user?.username}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="qlc-badge warn">{client.status}</span>
          {client.user?.isActive ? (
            <button className="qlc-btn danger" onClick={() => setConfirmDeactivate(true)}>
              Desactivar
            </button>
          ) : (
            <button className="qlc-btn primary" onClick={() => toggleActive(true)}>
              Activar cuenta
            </button>
          )}
        </div>
      </div>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {uploadError && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>
          {uploadError}
        </div>
      )}

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Proceso de activación</h3>
          {client.process?.conditions?.map((c) => (
            <ConditionRow key={c.id} condition={c} onUpdate={updateCondition} />
          ))}
          <button
            className="qlc-btn primary"
            style={{ marginTop: 16, width: '100%' }}
            onClick={activate}
            disabled={client.process?.isActivated}
          >
            {client.process?.isActivated ? 'Cliente ya activado' : 'Activar cliente'}
          </button>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Modelo</h3>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>
            {client.clientModel?.model?.name || 'Sin modelo asignado'}
          </p>
          <h3>Conexión API ({client.apiConnection?.exchangeName || 'Bitget'})</h3>
          <form onSubmit={saveApiConnection}>
            <label className="qlc-label">Estado</label>
            <select
              className="qlc-select"
              value={apiForm.status}
              onChange={(e) => setApiForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONECTADA">Conectada</option>
              <option value="DESCONECTADA">Desconectada</option>
            </select>
            <label className="qlc-label">
              API Key {client.apiConnection?.hasApiKey ? '(ya registrada)' : ''}
            </label>
            <input
              className="qlc-input"
              value={apiForm.apiKey}
              onChange={(e) => setApiForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="Dejar vacío para no cambiar"
            />
            <label className="qlc-label">
              API Secret {client.apiConnection?.hasApiSecret ? '(ya registrada)' : ''}
            </label>
            <input
              className="qlc-input"
              type="password"
              value={apiForm.apiSecret}
              onChange={(e) => setApiForm((f) => ({ ...f, apiSecret: e.target.value }))}
              placeholder="Dejar vacío para no cambiar"
            />
            <button className="qlc-btn primary" style={{ marginTop: 14, width: '100%' }}>
              Guardar conexión API
            </button>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Contrato</h3>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            Estado: <span className="qlc-badge warn">{contract?.status || 'PENDING'}</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="qlc-label">Original (admin sube / reemplaza)</label>
              <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={uploadContract} disabled={uploading === 'contract'} />
              {contract?.originalDriveFileId && (
                <a
                  href={`${API_BASE_URL}/admin/contracts/${contract.id}/download/original`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12 }}
                >
                  Ver original: {contract.originalFileName}
                </a>
              )}
            </div>
            {contract?.signedDriveFileId && (
              <div>
                <label className="qlc-label">Firmado (enviado por el cliente — bloqueado para él)</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <a
                    href={`${API_BASE_URL}/admin/contracts/${contract.id}/download/signed`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12 }}
                  >
                    Ver firmado: {contract.signedFileName}
                  </a>
                  <button className="qlc-btn ghost" onClick={() => setConfirmResetSigned(true)}>
                    Eliminar (permitir reenvío)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Documentos ({client.documents?.length || 0})</h3>
          {client.documents?.length ? (
            <ul className="qlc-plain-list">
              {client.documents.map((d) => (
                <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <a href={`${API_BASE_URL}/admin/documents/${d.id}/download`} target="_blank" rel="noreferrer">
                      {d.fileName}
                    </a>{' '}
                    <span style={{ color: 'var(--qlc-muted2)' }}>({d.category})</span>
                  </span>
                  <button className="qlc-btn ghost" onClick={() => setConfirmDeleteDoc(d)}>
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="qlc-empty">Sin documentos.</div>
          )}

          <form onSubmit={uploadDocument} style={{ marginTop: 14, borderTop: '1px solid var(--qlc-line)', paddingTop: 14 }}>
            <label className="qlc-label">Categoría</label>
            <select
              className="qlc-select"
              value={docForm.category}
              onChange={(e) => setDocForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="identificacion">Identificación</option>
              <option value="comprobante_domicilio">Comprobante de domicilio</option>
              <option value="otro">Otro</option>
            </select>
            <label className="qlc-label">Descripción (opcional)</label>
            <input
              className="qlc-input"
              value={docForm.description}
              onChange={(e) => setDocForm((f) => ({ ...f, description: e.target.value }))}
            />
            <label className="qlc-label">Archivo</label>
            <input type="file" name="docFile" className="qlc-input" accept=".pdf,image/*" required />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={uploading === 'document'}>
              {uploading === 'document' ? 'Subiendo…' : 'Subir documento'}
            </button>
          </form>
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Pagos reportados ({client.paymentReports?.length || 0})</h3>
          {client.paymentReports?.length ? (
            <ul className="qlc-plain-list">
              {client.paymentReports.map((p) => (
                <li key={p.id}>
                  {p.amount} {p.currency} — <span className="qlc-badge muted">{p.status}</span>
                  {p.proofDriveFileId && (
                    <>
                      {' '}
                      ·{' '}
                      <a href={`${API_BASE_URL}/admin/payment-reports/${p.id}/proof`} target="_blank" rel="noreferrer">
                        Ver comprobante
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="qlc-empty">Sin pagos reportados.</div>
          )}
        </div>
      </div>

      {confirmDeactivate && (
        <ConfirmModal
          title="¿Desactivar cuenta?"
          message={`${client.firstName} ${client.lastName} no podrá iniciar sesión en el portal hasta que reactives su cuenta.`}
          confirmLabel="Desactivar"
          onClose={() => setConfirmDeactivate(false)}
          onConfirm={confirmDeactivateAccount}
        />
      )}

      {confirmResetSigned && (
        <ConfirmModal
          title="¿Eliminar contrato firmado?"
          message="El cliente verá su contrato como pendiente de envío nuevamente y podrá volver a subirlo. El archivo actual se eliminará de forma permanente del almacenamiento de QLC."
          confirmLabel="Eliminar"
          twoStep
          onClose={() => setConfirmResetSigned(false)}
          onConfirm={resetSignedContract}
        />
      )}

      {confirmDeleteDoc && (
        <ConfirmModal
          title="¿Eliminar documento?"
          message={`Esta acción eliminará "${confirmDeleteDoc.fileName}" del almacenamiento de QLC y permitirá que el cliente lo vuelva a enviar.`}
          confirmLabel="Eliminar"
          twoStep
          onClose={() => setConfirmDeleteDoc(null)}
          onConfirm={() => removeDocument(confirmDeleteDoc.id)}
        />
      )}
    </div>
  );
}

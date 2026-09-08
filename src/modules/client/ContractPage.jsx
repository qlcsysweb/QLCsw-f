import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';

const STATUS_LABELS = {
  PENDING: { text: '◌ Pendiente', className: 'warn' },
  UPLOADED: { text: '! Requiere tu firma', className: 'warn' },
  RECEIVED_SIGNED: { text: '✓ Enviado', className: 'ok' },
  REJECTED: { text: '× Rechazado', className: 'danger' },
};

export default function ContractPage() {
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => api.get('/client/contract').then(({ data }) => setContract(data.contract));
  useEffect(() => {
    load();
  }, []);

  const uploadSigned = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/client/contract/signed', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Documento enviado correctamente.');
      setTimeout(() => setMessage(''), 4000);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const status = contract ? STATUS_LABELS[contract.status] || STATUS_LABELS.PENDING : null;

  return (
    <div>
      <div className="qlc-kicker">CONTRATO</div>
      <h1 style={{ marginTop: 0 }}>Tu contrato</h1>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      {!contract ? (
        <div className="qlc-empty">Todavía no tienes un contrato disponible. El equipo de QLC lo subirá próximamente.</div>
      ) : (
        <div className="qlc-card" style={{ maxWidth: 520 }}>
          <p>
            Estado: <span className={`qlc-badge ${status.className}`}>{status.text}</span>
          </p>
          {contract.originalDriveFileId && (
            <p>
              <a href={`${API_BASE_URL}/client/contract/${contract.id}/download/original`} target="_blank" rel="noreferrer">
                Descargar contrato para revisar y firmar
              </a>
            </p>
          )}
          {contract.signedDriveFileId ? (
            <div>
              <p>
                <a href={`${API_BASE_URL}/client/contract/${contract.id}/download/signed`} target="_blank" rel="noreferrer">
                  Ver el documento que enviaste
                </a>
              </p>
              <div className="qlc-card" style={{ background: 'rgba(0,168,255,0.06)', borderColor: 'var(--qlc-ok-border)' }}>
                <p style={{ margin: 0, fontSize: 13 }}>
                  ✓ Documento enviado correctamente. Queda bloqueado para modificaciones — si necesitas
                  reemplazarlo, contacta con QLC desde Soporte.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="qlc-label">Subir contrato firmado</label>
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -4 }}>
                Formatos permitidos: PDF, PNG, JPG o WEBP. Tamaño máximo 15 MB. Una vez enviado no
                podrás reemplazarlo tú mismo.
              </p>
              <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={uploadSigned} disabled={uploading} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

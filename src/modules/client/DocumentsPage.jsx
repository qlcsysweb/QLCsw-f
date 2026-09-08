import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';

const CATEGORIES = [
  { value: 'identificacion', label: 'Identificación' },
  { value: 'comprobante_domicilio', label: 'Comprobante de domicilio' },
  { value: 'otro', label: 'Otro' },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({ category: 'identificacion', description: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => api.get('/client/documents').then(({ data }) => setDocuments(data.documents));
  useEffect(() => {
    load();
  }, []);

  const takenCategories = new Set(documents.map((d) => d.category));
  const availableCategories = CATEGORIES.filter((c) => !takenCategories.has(c.value));

  const upload = async (e) => {
    e.preventDefault();
    const file = e.target.elements.docFile.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', form.category);
    fd.append('description', form.description);
    try {
      await api.post('/client/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Documento enviado correctamente.');
      setTimeout(() => setMessage(''), 4000);
      e.target.reset();
      setForm((f) => ({ ...f, description: '' }));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">MIS DOCUMENTOS</div>
      <h1 style={{ marginTop: 0 }}>Documentos</h1>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      <div className="qlc-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Documentos enviados ({documents.length})</h3>
        {documents.length === 0 ? (
          <div className="qlc-empty">Sin documentos enviados todavía.</div>
        ) : (
          <ul className="qlc-plain-list">
            {documents.map((d) => (
              <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {CATEGORIES.find((c) => c.value === d.category)?.label || d.category}
                  <span style={{ color: 'var(--qlc-muted2)', marginLeft: 8, fontSize: 12 }}>
                    <a href={`${API_BASE_URL}/client/documents/${d.id}/download`} target="_blank" rel="noreferrer">
                      Ver
                    </a>
                  </span>
                </span>
                <span className="qlc-badge ok">✓ Enviado</span>
              </li>
            ))}
          </ul>
        )}
        {documents.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: 12, marginBottom: 0 }}>
            Los documentos enviados quedan bloqueados para modificaciones. Si necesitas reemplazar
            alguno, contacta con QLC desde Soporte.
          </p>
        )}
      </div>

      {availableCategories.length > 0 ? (
        <form className="qlc-card" style={{ maxWidth: 480 }} onSubmit={upload}>
          <h3 style={{ marginTop: 0 }}>Subir documento</h3>
          <label className="qlc-label">Categoría</label>
          <select
            className="qlc-select"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {availableCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <label className="qlc-label">Descripción (opcional)</label>
          <input className="qlc-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <label className="qlc-label">Archivo</label>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -4 }}>
            Formatos permitidos: PDF, PNG, JPG o WEBP. Tamaño máximo 15 MB.
          </p>
          <input type="file" name="docFile" className="qlc-input" accept=".pdf,image/*" required />
          <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={uploading}>
            {uploading ? 'Subiendo…' : 'Subir documento'}
          </button>
        </form>
      ) : (
        <div className="qlc-empty">Ya enviaste un documento en cada categoría disponible.</div>
      )}
    </div>
  );
}

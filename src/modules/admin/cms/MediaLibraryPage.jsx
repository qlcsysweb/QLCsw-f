import { useEffect, useRef, useState } from 'react';
import api from '../../../services/api';
import Modal from '../../../components/Modal';
import ConfirmModal from '../../../components/ConfirmModal';
import ConfirmSaveModal from '../../../components/ConfirmSaveModal';
import UnsavedChangesModal from '../../../components/UnsavedChangesModal';
import useUnsavedGuard from '../../../components/useUnsavedGuard';
import { MEDIA_LOCATIONS, locationLabel, mediaTypeLabel } from '../../../utils/mediaLabels';

function Thumb({ item }) {
  if (item.type === 'VIDEO') {
    return <video src={item.url} muted style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />;
  }
  return <img src={item.url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />;
}

function PreviewModal({ item, onClose }) {
  return (
    <Modal title={item.title || item.fileName} subtitle={`${mediaTypeLabel(item.type)} · ${locationLabel(item.location)}`} onClose={onClose} width={720}>
      {item.type === 'VIDEO' ? (
        <video src={item.url} controls muted autoPlay style={{ width: '100%', borderRadius: 12, maxHeight: 480 }} />
      ) : (
        <img src={item.url} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 480, objectFit: 'contain' }} />
      )}
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 12 }}>
        Esta previsualización con controles solo está disponible aquí, en el panel administrativo. En la
        página pública este recurso se muestra sin controles ni interacción, integrado al diseño.
      </p>
    </Modal>
  );
}

function EditModal({ item, onClose, onSaved }) {
  const initial = {
    location: item.location,
    title: item.title || '',
    description: item.description || '',
    order: item.order,
    isPublished: item.isPublished,
    isPrimary: item.isPrimary,
  };
  const [values, setValues] = useState(initial);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [error, setError] = useState('');

  const isDirty = () => JSON.stringify(values) !== JSON.stringify(initial);
  const { requestClose, promptOpen, confirmDiscard, cancelDiscard } = useUnsavedGuard(isDirty, onClose);

  const doSave = async () => {
    setError('');
    try {
      await api.patch(`/admin/media/${item.id}`, values);
      onSaved();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <Modal title="Editar multimedia" onClose={requestClose} width={520}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmingSave(true);
        }}
      >
        <label className="qlc-label">Título interno</label>
        <input
          className="qlc-input"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="Ej. Video principal del Hero"
        />
        <label className="qlc-label">Descripción interna</label>
        <textarea
          className="qlc-textarea"
          rows={2}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
        <label className="qlc-label">Ubicación</label>
        <select
          className="qlc-select"
          value={values.location}
          onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
        >
          {MEDIA_LOCATIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <label className="qlc-label">Orden (cuando la sección tiene varios recursos)</label>
        <input
          className="qlc-input"
          type="number"
          min={0}
          value={values.order}
          onChange={(e) => setValues((v) => ({ ...v, order: Number(e.target.value) }))}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={values.isPublished}
            onChange={(e) => setValues((v) => ({ ...v, isPublished: e.target.checked }))}
          />
          Publicado (visible en la página pública)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={values.isPrimary}
            onChange={(e) => setValues((v) => ({ ...v, isPrimary: e.target.checked }))}
          />
          {values.location === 'logo'
            ? 'Usar como logo activo (reemplaza al que esté activo ahora)'
            : 'Recurso principal de esta sección'}
        </label>

        {error && <div className="qlc-field-error">{error}</div>}

        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={requestClose}>
            Cancelar
          </button>
          <button className="qlc-btn primary">✓ Guardar cambios</button>
        </div>
      </form>

      {confirmingSave && (
        <ConfirmSaveModal
          message="Se actualizará este recurso multimedia. Si está publicado, el cambio se reflejará de inmediato en la página pública."
          onCancel={() => setConfirmingSave(false)}
          onConfirm={doSave}
        />
      )}
      {promptOpen && <UnsavedChangesModal onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />}
    </Modal>
  );
}

function ReplaceModal({ item, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const doReplace = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/admin/media/${item.id}/replace`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <Modal title="Reemplazar archivo" subtitle={`Usado en: ${locationLabel(item.location)}`} onClose={onClose} width={480}>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 0 }}>
        El archivo actual ({item.fileName}) se reemplazará por el nuevo. La ubicación, el estado de
        publicación y el orden se conservan — no queda ninguna referencia al archivo anterior.
      </p>
      <input
        className="qlc-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
        onChange={(e) => setFile(e.target.files[0])}
      />
      {error && <div className="qlc-field-error">{error}</div>}
      <div className="qlc-form-actions">
        <button className="qlc-btn ghost" onClick={onClose} disabled={uploading}>
          Cancelar
        </button>
        <button className="qlc-btn primary" onClick={doReplace} disabled={!file || uploading}>
          {uploading ? 'Reemplazando…' : 'Reemplazar'}
        </button>
      </div>
    </Modal>
  );
}

function UploadForm({ onUploaded }) {
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Selecciona una imagen o un video.');
      return;
    }
    if (!location) {
      setError('Elige a qué ubicación pertenece este archivo.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('location', location);
      if (title) fd.append('title', title);
      if (description) fd.append('description', description);
      await api.post('/admin/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle('');
      setDescription('');
      setFile(null);
      setLocation('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="qlc-card" onSubmit={submit} style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>+ Agregar multimedia</h3>
      <label className="qlc-label">Archivo (PNG, JPG, WEBP, GIF, MP4 o WEBM)</label>
      <input
        ref={fileInputRef}
        className="qlc-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <label className="qlc-label">Ubicación</label>
      <select className="qlc-select" value={location} onChange={(e) => setLocation(e.target.value)}>
        <option value="" disabled>
          Selecciona dónde se usará este archivo…
        </option>
        {MEDIA_LOCATIONS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
      {location === 'logo' && (
        <div className="qlc-field-hint" style={{ marginTop: -6, marginBottom: 10, fontSize: 12, color: 'var(--qlc-gold)' }}>
          Después de subirlo, ábrelo con "Editar" y marca "Publicado" y "Usar como logo activo" — de lo
          contrario no reemplazará al logo actual del sitio.
        </div>
      )}
      <label className="qlc-label">Título interno (opcional)</label>
      <input className="qlc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solo para identificarlo aquí en el panel" />
      <label className="qlc-label">Descripción interna (opcional)</label>
      <textarea className="qlc-textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

      {error && <div className="qlc-field-error">{error}</div>}

      <div className="qlc-form-actions">
        <button className="qlc-btn primary" disabled={uploading}>
          {uploading ? 'Subiendo…' : 'Subir'}
        </button>
      </div>
    </form>
  );
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [replacingItem, setReplacingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const load = () => api.get('/admin/media').then(({ data }) => setItems(data.items));
  useEffect(() => {
    load();
  }, []);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const togglePublish = async (item) => {
    await api.patch(`/admin/media/${item.id}`, { isPublished: !item.isPublished });
    flash(item.isPublished ? '— Recurso desactivado. Ya no aparece en la página pública.' : '✓ Recurso publicado.');
    load();
  };

  const visibleItems = filter === 'all' ? items : items.filter((i) => i.location === filter);

  return (
    <div>
      <div className="qlc-kicker">MULTIMEDIA</div>
      <h1 style={{ marginTop: 0 }}>Imágenes y videos del sitio público</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>
        Sube, publica y ordena las imágenes y videos que aparecen en la página pública, incluyendo el
        logo animado. Solo lo que marques como "Publicado" se muestra a los visitantes.
      </p>

      {message && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>
          {message}
        </div>
      )}

      <UploadForm onUploaded={() => { flash('✓ Archivo subido correctamente.'); load(); }} />

      <div style={{ marginBottom: 14 }}>
        <label className="qlc-label">Filtrar por ubicación</label>
        <select className="qlc-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todas las ubicaciones</option>
          {MEDIA_LOCATIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {visibleItems.length === 0 ? (
        <div className="qlc-empty">No hay multimedia en esta ubicación todavía.</div>
      ) : (
        visibleItems.map((item) => (
          <div className="qlc-card" key={item.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <Thumb item={item} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <strong>{item.title || item.fileName}</strong>
                <div style={{ fontSize: 12, color: 'var(--qlc-muted)', marginTop: 2 }}>
                  {mediaTypeLabel(item.type)} · {locationLabel(item.location)} · Orden {item.order}
                  {item.isPrimary ? ' · Principal' : ''}
                </div>
              </div>
              <span className={`qlc-badge ${item.isPublished ? 'ok' : 'muted'}`}>
                {item.isPublished ? '✓ Publicado' : '— No publicado'}
              </span>
            </div>
            {item.location === 'logo' && !(item.isPublished && item.isPrimary) && (
              <div style={{ fontSize: 12, color: 'var(--qlc-gold)', marginTop: 8 }}>
                ⚠ Todavía no es el logo activo del sitio — le falta {!item.isPublished && 'Publicado'}
                {!item.isPublished && !item.isPrimary && ' y '}
                {!item.isPrimary && '"Usar como logo activo"'}. Ábrelo con "Editar" para activarlo.
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              <button className="qlc-btn ghost" onClick={() => setPreviewItem(item)}>
                Vista previa
              </button>
              <button className="qlc-btn ghost" onClick={() => setEditingItem(item)}>
                Editar
              </button>
              <button className="qlc-btn ghost" onClick={() => togglePublish(item)}>
                {item.isPublished ? 'Desactivar' : 'Publicar'}
              </button>
              <button className="qlc-btn ghost" onClick={() => setReplacingItem(item)}>
                Reemplazar
              </button>
              <button className="qlc-btn danger" onClick={() => setDeletingItem(item)}>
                Eliminar
              </button>
            </div>
          </div>
        ))
      )}

      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      {editingItem && (
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            flash('✓ Cambios guardados.');
            load();
          }}
        />
      )}
      {replacingItem && (
        <ReplaceModal
          item={replacingItem}
          onClose={() => setReplacingItem(null)}
          onSaved={() => {
            setReplacingItem(null);
            flash('✓ Archivo reemplazado.');
            load();
          }}
        />
      )}
      {deletingItem && (
        <ConfirmModal
          title="¿Eliminar este recurso?"
          message={`Se eliminará "${deletingItem.title || deletingItem.fileName}" (usado en: ${locationLabel(
            deletingItem.location
          )}) de forma permanente, incluyendo el archivo en Cloudinary. Dejará de aparecer en la página pública.`}
          confirmLabel="Eliminar"
          twoStep
          onClose={() => setDeletingItem(null)}
          onConfirm={async () => {
            await api.delete(`/admin/media/${deletingItem.id}`);
            flash('✓ Recurso eliminado.');
            load();
          }}
        />
      )}
    </div>
  );
}

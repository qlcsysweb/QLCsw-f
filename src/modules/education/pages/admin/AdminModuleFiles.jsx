import { useRef, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { FormError } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';

const TYPES = { IMAGE: 'Imagen', VIDEO: 'Video', DOCUMENT: 'Documento' };
const PROVIDERS = { CLOUDINARY: 'Cloudinary', GOOGLE_DRIVE: 'Google Drive' };
const size = (b) => (!b ? '—' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export default function AdminModuleFiles() {
  const { user } = useAuth();
  const [moduleNumber, setModuleNumber] = useState(1);
  const res = useAsync(() => api.get(`/admin/module-media?module=${moduleNumber}`), [moduleNumber]);
  const fileRef = useRef(null);
  const [removing, setRemoving] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });
  const canEdit = ['EDIT', 'FULL'].includes(user?.adminLevel);

  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      await fn();
      await res.reload();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  const upload = (file) => run(async () => {
    const data = new FormData();
    data.append('moduleNumber', String(moduleNumber));
    data.append('file', file);
    await api.upload('/admin/module-media', data);
  });

  const open = (m) => run(async () => {
    const { url } = await api.get(`/admin/module-media/${m.id}/link`);
    window.open(url, '_blank', 'noopener');
  });

  return (
    <>
      <PageHeader kicker={tr('Contenido')} title={tr('Academia / archivos')} subtitle={tr('Imágenes en Cloudinary · videos y documentos en Google Drive. Neon guarda solo los metadatos.')} />
      <div className="segmented wide" role="group" aria-label={tr('Módulo')}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <button key={n} type="button" className={moduleNumber === n ? 'is-active' : ''} onClick={() => setModuleNumber(n)}>{tr('Módulo')}{' '}{n}</button>)}
      </div>
      <Notice>{tr('Los videos de contenido de pago no se hacen públicos: se entregan desde el servidor solo a usuarios con acceso completo, mediante enlaces temporales.')}</Notice>
      <Card
        title={tr('Archivos del Módulo {n}', { n: moduleNumber })}
        actions={canEdit && (
          <>
            <input ref={fileRef} type="file" hidden onChange={(e) => { if (e.target.files[0]) upload(e.target.files[0]); e.target.value = ''; }} />
            <Button loading={state.busy} onClick={() => fileRef.current?.click()}>{tr('+ Subir archivo')}</Button>
          </>
        )}
      >
        <FormError error={state.error} />
        <AsyncView {...res} onRetry={res.reload}>
          {(items) => (
            <DataTable rows={items} empty={tr('Este módulo todavía no tiene archivos.')} columns={[
              { key: 'position', label: '#', render: (m) => m.position + 1 },
              { key: 'name', label: tr('Archivo'), render: (m) => <><b>{tr(m.name)}</b><span className="small block">{tr(m.mimeType)}</span></> },
              { key: 'fileType', label: tr('Tipo'), render: (m) => TYPES[m.fileType] },
              { key: 'provider', label: tr('Almacenamiento'), render: (m) => PROVIDERS[m.provider] },
              { key: 'size', label: 'Tamaño', align: 'right', render: (m) => size(m.size) },
              { key: 'active', label: tr('Estado'), render: (m) => <Pill variant={m.active ? '' : 'muted'}>{m.active ? tr('Activo') : tr('Inactivo')}</Pill> },
              { key: 'createdAt', label: 'Subido', render: (m) => dateTime(m.createdAt) },
              { key: 'x', label: tr('Acciones'), align: 'right', render: (m) => (
                <div className="row-actions">
                  <button type="button" className="btn-link" onClick={() => open(m)}>{tr('Ver')}</button>
                  {canEdit && <button type="button" className="btn-link" onClick={() => run(() => api.patch(`/admin/module-media/${m.id}`, { active: !m.active }))}>{m.active ? 'Desactivar' : 'Activar'}</button>}
                  {canEdit && <button type="button" className="btn-link danger" onClick={() => setRemoving(m)}>{tr('Eliminar')}</button>}
                </div>
              ) },
            ]} />
          )}
        </AsyncView>
      </Card>
      <ConfirmDialog open={!!removing} title={tr('Eliminar archivo')} danger confirmLabel={tr('Eliminar')} loading={state.busy}
        message={tr('Se eliminará “{name}” también del proveedor de almacenamiento.', { name: removing?.name })}
        onConfirm={() => run(async () => { await api.del(`/admin/module-media/${removing.id}`); setRemoving(null); })}
        onClose={() => setRemoving(null)} />
    </>
  );
}

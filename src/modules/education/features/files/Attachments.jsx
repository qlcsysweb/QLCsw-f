import { useRef } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { tr } from '../../i18n/tr.js';

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

// Botón "Adjuntar archivo" con la lista de archivos elegidos (imágenes o PDF, máximo 5 de 5 MB).
export function FilePicker({ files, setFiles, onError, disabled = false }) {
  const ref = useRef(null);
  const pick = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    const big = picked.find((f) => f.size > MAX_BYTES);
    if (big) return onError?.(new Error(tr('El archivo «{name}» pesa más de 5 MB.', { name: big.name })));
    if (files.length + picked.length > MAX_FILES) return onError?.(new Error(tr('Puedes adjuntar como máximo 5 archivos.')));
    onError?.(null);
    return setFiles([...files, ...picked]);
  };
  return (
    <div className="attach-picker">
      <input ref={ref} type="file" accept={ACCEPT} multiple hidden onChange={pick} />
      <Button type="button" variant="secondary" disabled={disabled || files.length >= MAX_FILES} onClick={() => ref.current?.click()}>📎 {tr('Adjuntar archivo')}</Button>
      {files.length > 0 && (
        <ul className="small attach-list">
          {files.map((f, i) => <li key={`${f.name}-${i}`}>{f.name} <button type="button" className="btn-link" onClick={() => setFiles(files.filter((_, n) => n !== i))}>{tr('Quitar')}</button></li>)}
        </ul>
      )}
      <span className="small muted">{tr('Imágenes JPG, PNG, WEBP o PDF, de máximo 5 MB cada uno.')}</span>
    </div>
  );
}

// Enlaces para abrir archivos guardados (se piden con la sesión, nunca con la URL directa del servidor).
export function FileLinks({ files, api, pathFor, label }) {
  if (!files?.length) return null;
  const open = (id) => {
    const win = window.open('', '_blank');
    api.blobUrl(pathFor(id)).then((url) => {
      if (win) win.location.href = url;
      else window.location.href = url;
    }).catch((err) => {
      if (win) win.close();
      window.alert(err.message);
    });
  };
  return (
    <div className="attach-links">
      {label && <small className="muted">{label}</small>}
      {files.map((f) => <button key={f.id} type="button" className="btn-link" onClick={() => open(f.id)}>📎 {f.name}</button>)}
    </div>
  );
}

// Arma el FormData con el texto y los archivos para enviarlo con api.upload.
export function formWith(fields, files) {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v ?? ''));
  files.forEach((f) => form.append('files', f));
  return form;
}

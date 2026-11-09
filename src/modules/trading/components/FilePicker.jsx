import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import '../components/BitgetTransfer.css';

// Tipos seguros admitidos por defecto (el backend vuelve a validar tipo,
// firma real del archivo, tamaño y cantidad).
export const SAFE_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const SAFE_FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * Selector de archivos: arrastrar y soltar o botón (funciona igual sin drag
 * & drop). Lista previa con miniatura para imágenes y opción de quitar cada
 * archivo antes de enviar. `files` = [{ key, file, type }].
 * `keptCount`: archivos ya guardados que se conservan (cuentan para el máximo).
 */
export default function FilePicker({
  files,
  onChange,
  disabled = false,
  maxFiles = 5,
  maxBytes = 5 * 1024 * 1024,
  keptCount = 0,
  pickLabel,
  hint,
}) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [pickError, setPickError] = useState('');
  const [previews, setPreviews] = useState({});
  const maxMb = Math.round(maxBytes / (1024 * 1024));

  // Miniaturas (Blob URLs) solo para imágenes; se liberan al quitar/enviar.
  useEffect(() => {
    const next = {};
    files.forEach((f) => {
      if (f.type.startsWith('image/')) next[f.key] = URL.createObjectURL(f.file);
    });
    setPreviews(next);
    return () => Object.values(next).forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (list) => {
    setPickError('');
    const accepted = [];
    for (const file of Array.from(list || [])) {
      if (!SAFE_FILE_TYPES.includes(file.type)) {
        setPickError(t('clientPayments.evidenceInvalid').replace('{name}', file.name));
        continue;
      }
      if (file.size > maxBytes) {
        setPickError(t('files.tooBig').replace('{name}', file.name).replace('{mb}', maxMb));
        continue;
      }
      if (keptCount + files.length + accepted.length >= maxFiles) {
        setPickError(t('files.tooMany').replace('{max}', maxFiles));
        break;
      }
      accepted.push({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, type: file.type });
    }
    if (accepted.length) onChange([...files, ...accepted]);
  };

  const full = keptCount + files.length >= maxFiles;

  return (
    <div>
      <div
        className={`qlc-bt-drop${over ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
      >
        <p>{t('clientPayments.evidenceDrop')}</p>
        <p>{t('clientPayments.evidenceOr')}</p>
        <button type="button" className="qlc-btn ghost" onClick={() => inputRef.current?.click()} disabled={disabled || full}>
          {pickLabel || t('clientPayments.evidencePick')}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={SAFE_FILE_ACCEPT}
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="qlc-bt-drop-hint">{hint || t('files.hint').replace('{max}', maxFiles).replace('{mb}', maxMb)}</p>
      </div>
      {pickError && <p className="qlc-field-error">{pickError}</p>}
      {files.length > 0 && (
        <ul className="qlc-bt-files">
          {files.map((f) => (
            <li key={f.key} className="qlc-bt-file">
              {previews[f.key] ? <img className="qlc-bt-file-thumb" src={previews[f.key]} alt="" /> : <span className="qlc-bt-file-icon">PDF</span>}
              <span className="qlc-bt-file-name" title={f.file.name}>
                {f.file.name}
              </span>
              <span className="qlc-bt-file-size">{formatBytes(f.file.size)}</span>
              <button
                type="button"
                className="qlc-bt-file-remove"
                onClick={() => onChange(files.filter((x) => x.key !== f.key))}
                disabled={disabled}
                aria-label={`${t('clientPayments.evidenceRemove')} ${f.file.name}`}
              >
                {t('clientPayments.evidenceRemove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

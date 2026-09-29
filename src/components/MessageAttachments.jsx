import { useEffect, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import DocumentViewerModal from './DocumentViewerModal';

// Miniatura de una imagen adjunta: se pide como blob con la sesión (nunca la
// URL directa del backend/Drive) y se libera al desmontar.
function Thumb({ url, alt }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    api
      .get(url, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  return src ? <img className="qlc-att-thumb" src={src} alt={alt} /> : <span className="qlc-att-thumb qlc-att-thumb-empty" aria-hidden="true" />;
}

/*
 * Archivos adjuntos de un mensaje. `baseUrl` = ruta autenticada del mensaje
 * (".../messages/:id"); cada archivo se sirve en `${baseUrl}/files/:fileId`.
 * Imágenes: miniatura + Ver. PDF: Ver / Descargar (visor seguro con botón de
 * descarga).
 */
export default function MessageAttachments({ attachments = [], baseUrl }) {
  const { t } = useLanguage();
  const [viewing, setViewing] = useState(null);
  if (!attachments.length) return null;
  return (
    <>
      <ul className="qlc-att-list" aria-label={t('files.attachments')}>
        {attachments.map((a) => {
          const url = `${baseUrl}/files/${a.id}`;
          const isImage = a.mimeType?.startsWith('image/');
          return (
            <li key={a.id} className="qlc-att-item">
              {isImage ? <Thumb url={url} alt={a.fileName} /> : <span className="qlc-att-thumb qlc-att-pdf">PDF</span>}
              <span className="qlc-att-name" title={a.fileName}>
                {a.fileName}
              </span>
              <button type="button" className="qlc-btn ghost qlc-copy-btn" onClick={() => setViewing({ url, fileName: a.fileName })}>
                {isImage ? t('files.view') : t('files.viewDownload')}
              </button>
            </li>
          );
        })}
      </ul>
      {viewing && <DocumentViewerModal url={viewing.url} fileName={viewing.fileName} onClose={() => setViewing(null)} />}
    </>
  );
}

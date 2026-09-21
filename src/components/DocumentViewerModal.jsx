import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { translateBackendMessage } from '../i18n/backendMessages';
import { useLanguage } from '../i18n/LanguageContext';

// Visor autenticado de documentos — reemplaza el enlace directo
// `<a href=".../download" target="_blank">`, que golpeaba el endpoint sin
// pasar por el cliente HTTP autenticado (sin cookie de sesión de terceros ni
// header Authorization) y mostraba "Sesión no encontrada". Aquí se pide el
// archivo como blob con `api` (mismo interceptor que agrega el Bearer token
// y respeta withCredentials), y se muestra dentro del modal — nunca se
// navega a la URL del backend directamente.
export default function DocumentViewerModal({ url, fileName, onClose }) {
  const { t, language } = useLanguage();
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [blobUrl, setBlobUrl] = useState(null);
  const [mimeType, setMimeType] = useState('');
  const blobUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setErrorMessage('');

    api
      .get(url, { responseType: 'blob' })
      .then(({ data: blob }) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
        setMimeType(blob.type || '');
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err.status;
        if (status === 404) {
          setErrorMessage(t('clientDocuments.viewerErrorNotFound'));
        } else if (status === 401 || status === 403) {
          setErrorMessage(translateBackendMessage(err.message, language));
        } else {
          setErrorMessage(translateBackendMessage(err.message, language) || t('clientDocuments.viewerErrorGeneric'));
        }
        setState('error');
      });

    return () => {
      cancelled = true;
      // Libera el Blob URL tanto al desmontar como si `url` cambia mientras
      // el modal sigue abierto (nunca deja referencias colgando).
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handleClose = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    onClose();
  };

  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'documento';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  return (
    <Modal title={fileName || t('clientDocuments.viewerTitle')} onClose={handleClose} width={820} closeOnOverlayClick closeOnEscape>
      {state === 'loading' && <div className="qlc-empty">{t('clientDocuments.viewerLoading')}</div>}

      {state === 'error' && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)' }}>
          <p style={{ margin: 0, fontSize: 13 }}>{errorMessage}</p>
        </div>
      )}

      {state === 'ready' && isPdf && (
        <iframe
          src={blobUrl}
          title={fileName || 'documento'}
          style={{ width: '100%', height: '70vh', border: '1px solid var(--qlc-line)', borderRadius: 10, background: '#fff' }}
        />
      )}

      {state === 'ready' && isImage && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src={blobUrl}
            alt={fileName || 'documento'}
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10, border: '1px solid var(--qlc-line)' }}
          />
        </div>
      )}

      {state === 'ready' && !isPdf && !isImage && (
        <div className="qlc-card" style={{ borderColor: 'var(--qlc-warn-border)' }}>
          <p style={{ margin: 0, fontSize: 13 }}>{t('clientDocuments.viewerUnsupported')}</p>
        </div>
      )}

      {state === 'ready' && (
        <div className="qlc-form-actions" style={{ marginTop: 16 }}>
          <button className="qlc-btn primary" onClick={download}>
            {t('clientDocuments.viewerDownload')}
          </button>
        </div>
      )}
    </Modal>
  );
}

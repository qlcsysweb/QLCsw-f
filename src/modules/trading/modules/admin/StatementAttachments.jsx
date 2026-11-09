import { useRef, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import DocumentViewerModal from '../../components/DocumentViewerModal';

/*
 * ADJUNTOS DEL ESTADO DE CUENTA (QLC Affiliate Program §8.1 / §11.2):
 * administración adjunta archivos (imágenes o PDF, hasta 5 por envío, 10 MB
 * cada uno) además del PDF principal. Se guardan en Google Drive; el cliente
 * los ve en su estado de cuenta y el afiliador nunca.
 */
export default function StatementAttachments({ statement, onChanged, compact = false }) {
  const { t, language } = useLanguage();
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const busyRef = useRef(false);
  const inputRef = useRef(null);
  const attachments = statement.attachments || [];

  const upload = async () => {
    if (busyRef.current || !files.length) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f, f.name));
      await api.post(`/admin/statements/${statement.id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
      onChanged?.();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: compact ? 4 : 10 }}>
      {!compact && <div className="qlc-aff-section-title">{t('statementStatus.attachmentsTitle')}</div>}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {attachments.map((a) => (
            <button
              key={a.id}
              type="button"
              className="qlc-link-btn"
              style={{ fontSize: 12 }}
              onClick={() => setViewing({ url: `/admin/statements/${statement.id}/attachments/${a.id}`, fileName: a.fileName })}
            >
              📎 {a.fileName}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="qlc-input"
          style={{ margin: 0, flex: '1 1 220px', fontSize: 12 }}
          onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
          aria-label={t('statementStatus.attach')}
        />
        <button type="button" className="qlc-btn ghost" disabled={busy || !files.length} onClick={upload}>
          {busy ? t('common.saving') : t('statementStatus.attach')}
        </button>
      </div>
      {error && <p className="qlc-field-error">{error}</p>}
      {viewing && <DocumentViewerModal url={viewing.url} fileName={viewing.fileName} onClose={() => setViewing(null)} />}
    </div>
  );
}

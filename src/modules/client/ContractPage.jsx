import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function ContractPage() {
  const { t, language } = useLanguage();
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const STATUS_LABELS = {
    PENDING: { text: `◌ ${t('status.contract.pending')}`, className: 'warn' },
    UPLOADED: { text: `! ${t('status.contract.uploaded')}`, className: 'warn' },
    RECEIVED_SIGNED: { text: `✓ ${t('status.contract.receivedSigned')}`, className: 'ok' },
    REJECTED: { text: `× ${t('status.contract.rejected')}`, className: 'danger' },
  };

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
      setMessage(t('clientContract.sentOk'));
      setTimeout(() => setMessage(''), 4000);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const status = contract ? STATUS_LABELS[contract.status] || STATUS_LABELS.PENDING : null;

  return (
    <div>
      <div className="qlc-kicker">{t('clientContract.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientContract.title')}</h1>

      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      {!contract ? (
        <div className="qlc-empty">{t('clientContract.noContract')}</div>
      ) : (
        <div className="qlc-card" style={{ maxWidth: 520 }}>
          <p>
            {t('clientContract.statusLabel')}: <span className={`qlc-badge ${status.className}`}>{status.text}</span>
          </p>
          {contract.originalDriveFileId && (
            <p>
              <a href={`${API_BASE_URL}/client/contract/${contract.id}/download/original`} target="_blank" rel="noreferrer">
                {t('clientContract.downloadOriginal')}
              </a>
            </p>
          )}
          {contract.signedDriveFileId ? (
            <div>
              <p>
                <a href={`${API_BASE_URL}/client/contract/${contract.id}/download/signed`} target="_blank" rel="noreferrer">
                  {t('clientContract.viewSubmitted')}
                </a>
              </p>
              <div className="qlc-card" style={{ background: 'rgba(0,168,255,0.06)', borderColor: 'var(--qlc-ok-border)' }}>
                <p style={{ margin: 0, fontSize: 13 }}>{t('clientContract.lockedNotice')}</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="qlc-label">{t('clientContract.uploadLabel')}</label>
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', marginTop: -4 }}>{t('clientContract.uploadHint')}</p>
              <input type="file" className="qlc-input" accept=".pdf,image/*" onChange={uploadSigned} disabled={uploading} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

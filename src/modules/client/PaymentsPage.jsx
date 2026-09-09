import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function PaymentsPage() {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState(null);
  const [reports, setReports] = useState([]);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [walletCopied, setWalletCopied] = useState(false);

  const paymentReportStatusMap = PAYMENT_REPORT_STATUS(t);

  const copyWallet = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles no rompemos la vista.
    }
  };

  const load = () => {
    api.get('/client/payment-config').then(({ data }) => setConfig(data.config));
    api.get('/client/payment-reports').then(({ data }) => setReports(data.reports));
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('amount', amount);
    if (reference) fd.append('reference', reference);
    const file = e.target.elements.proofFile.files[0];
    if (file) fd.append('file', file);
    try {
      await api.post('/client/payment-reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(t('clientPayments.reportedOk'));
      setTimeout(() => setMessage(''), 4000);
      setAmount('');
      setReference('');
      e.target.reset();
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientPayments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientPayments.title')}</h1>

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientPayments.paymentDataTitle')}</h3>
          {config?.walletAddress ? (
            <>
              {config?.qrUrl && <img src={config.qrUrl} alt="QR de pago" style={{ width: 150, borderRadius: 10, marginBottom: 10 }} />}
              <p style={{ fontSize: 13 }}>
                <strong>{t('clientPayments.currency')}:</strong> {config.currency || 'USDT'}
              </p>
              {config?.network && (
                <p style={{ fontSize: 13 }}>
                  <strong>{t('clientPayments.network')}:</strong> {config.network}
                </p>
              )}
              <p style={{ fontSize: 13, wordBreak: 'break-all' }}>
                <strong>{t('clientPayments.wallet')}:</strong> {config.walletAddress}
              </p>
              <button type="button" className="qlc-btn ghost" onClick={() => copyWallet(config.walletAddress)}>
                {walletCopied ? t('clientPayments.walletCopied') : t('clientPayments.copyWallet')}
              </button>
              {config?.paymentLink && (
                <p style={{ fontSize: 13 }}>
                  <a href={config.paymentLink} target="_blank" rel="noreferrer">
                    {t('clientPayments.openWalletLink')}
                  </a>
                </p>
              )}
              {config?.instructions && <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{config.instructions}</p>}
            </>
          ) : (
            <div className="qlc-empty">{t('clientPayments.pendingConfig')}</div>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('clientPayments.reportPaymentTitle')}</h3>
          {message && <div style={{ color: 'var(--qlc-ok)', fontSize: 12, marginBottom: 10 }}>{message}</div>}
          {error && <div className="qlc-field-error">{error}</div>}
          <form onSubmit={submit}>
            <label className="qlc-label">{t('clientPayments.amount')}</label>
            <input className="qlc-input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <label className="qlc-label">{t('clientPayments.reference')}</label>
            <input
              className="qlc-input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('clientPayments.referencePlaceholder')}
              maxLength={200}
            />
            <label className="qlc-label">{t('clientPayments.proof')}</label>
            <input type="file" name="proofFile" className="qlc-input" accept=".pdf,image/*" />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={uploading}>
              {uploading ? t('clientPayments.sending') : t('clientPayments.reportPayment')}
            </button>
          </form>
        </div>
      </div>

      <div className="qlc-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>
          {t('clientPayments.history')} ({reports.length})
        </h3>
        {reports.length === 0 ? (
          <div className="qlc-empty">{t('clientPayments.noReports')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {reports.map((r) => (
              <li key={r.id}>
                {r.amount} {r.currency} —{' '}
                <span className={`qlc-badge ${statusOf(paymentReportStatusMap, r.status).className}`}>
                  {statusOf(paymentReportStatusMap, r.status).text}
                </span>
                {r.reference && (
                  <span style={{ color: 'var(--qlc-muted2)' }}> · {t('clientPayments.reference')}: {r.reference}</span>
                )}
                {r.proofDriveFileId && (
                  <>
                    {' '}
                    ·{' '}
                    <a href={`${API_BASE_URL}/client/payment-reports/${r.id}/proof`} target="_blank" rel="noreferrer">
                      {t('clientPayments.viewProof')}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

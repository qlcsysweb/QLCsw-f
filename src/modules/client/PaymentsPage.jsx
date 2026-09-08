import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';

export default function PaymentsPage() {
  const [config, setConfig] = useState(null);
  const [reports, setReports] = useState([]);
  const [amount, setAmount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [walletCopied, setWalletCopied] = useState(false);

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
    const file = e.target.elements.proofFile.files[0];
    if (file) fd.append('file', file);
    try {
      await api.post('/client/payment-reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Pago reportado correctamente. El equipo lo revisará pronto.');
      setTimeout(() => setMessage(''), 4000);
      setAmount('');
      e.target.reset();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">PAGOS</div>
      <h1 style={{ marginTop: 0 }}>Información de pago y reportes</h1>

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Datos para tu pago</h3>
          {config?.walletAddress ? (
            <>
              {config?.qrUrl && <img src={config.qrUrl} alt="QR de pago" style={{ width: 150, borderRadius: 10, marginBottom: 10 }} />}
              <p style={{ fontSize: 13 }}>
                <strong>Moneda:</strong> {config.currency || 'USDT'}
              </p>
              {config?.network && (
                <p style={{ fontSize: 13 }}>
                  <strong>Red:</strong> {config.network}
                </p>
              )}
              <p style={{ fontSize: 13, wordBreak: 'break-all' }}>
                <strong>Wallet:</strong> {config.walletAddress}
              </p>
              <button type="button" className="qlc-btn ghost" onClick={() => copyWallet(config.walletAddress)}>
                {walletCopied ? '✓ Wallet copiada' : 'Copiar wallet'}
              </button>
              {config?.paymentLink && (
                <p style={{ fontSize: 13 }}>
                  <a href={config.paymentLink} target="_blank" rel="noreferrer">
                    Abrir liga de wallet
                  </a>
                </p>
              )}
              {config?.instructions && <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>{config.instructions}</p>}
            </>
          ) : (
            <div className="qlc-empty">◌ Información de pago pendiente de configuración.</div>
          )}
        </div>

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Reportar un pago</h3>
          {message && <div style={{ color: 'var(--qlc-ok)', fontSize: 12, marginBottom: 10 }}>{message}</div>}
          {error && <div className="qlc-field-error">{error}</div>}
          <form onSubmit={submit}>
            <label className="qlc-label">Monto (USDT)</label>
            <input className="qlc-input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <label className="qlc-label">Comprobante (opcional)</label>
            <input type="file" name="proofFile" className="qlc-input" accept=".pdf,image/*" />
            <button className="qlc-btn primary" style={{ marginTop: 12, width: '100%' }} disabled={uploading}>
              {uploading ? 'Enviando…' : 'Reportar pago'}
            </button>
          </form>
        </div>
      </div>

      <div className="qlc-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Historial de reportes ({reports.length})</h3>
        {reports.length === 0 ? (
          <div className="qlc-empty">Sin reportes todavía.</div>
        ) : (
          <ul className="qlc-plain-list">
            {reports.map((r) => (
              <li key={r.id}>
                {r.amount} {r.currency} —{' '}
                <span className={`qlc-badge ${statusOf(PAYMENT_REPORT_STATUS, r.status).className}`}>
                  {statusOf(PAYMENT_REPORT_STATUS, r.status).text}
                </span>
                {r.proofDriveFileId && (
                  <>
                    {' '}
                    ·{' '}
                    <a href={`${API_BASE_URL}/client/payment-reports/${r.id}/proof`} target="_blank" rel="noreferrer">
                      Ver comprobante
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

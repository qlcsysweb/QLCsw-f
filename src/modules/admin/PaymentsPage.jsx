import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';

const emptyForm = { network: '', walletAddress: '', paymentLink: '', instructions: '' };

export default function PaymentsPage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('');
  const [confirmReject, setConfirmReject] = useState(null);
  const [confirmSave, setConfirmSave] = useState(false);

  const load = () => {
    api.get('/admin/payment-config').then(({ data }) => {
      setConfig(data.config);
      setForm({
        network: data.config?.network || '',
        walletAddress: data.config?.walletAddress || '',
        paymentLink: data.config?.paymentLink || '',
        instructions: data.config?.instructions || '',
      });
    });
    api.get('/admin/payment-reports').then(({ data }) => setReports(data.reports));
  };
  useEffect(() => {
    load();
  }, []);

  const saveConfig = async () => {
    await api.put('/admin/payment-config', form);
    setConfirmSave(false);
    setMessage('Configuración de pagos actualizada.');
    setTimeout(() => setMessage(''), 3000);
    load();
  };

  const uploadQr = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/admin/payment-config/qr', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
  };

  const review = async (id, status) => {
    await api.patch(`/admin/payment-reports/${id}`, { status });
    load();
  };

  return (
    <div>
      <div className="qlc-kicker">PAGOS</div>
      <h1 style={{ marginTop: 0 }}>Configuración e informes de pago</h1>

      <div className="qlc-detail-grid">
        <form
          className="qlc-card"
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmSave(true);
          }}
        >
          <h3 style={{ marginTop: 0 }}>Datos de pago</h3>
          {config?.qrUrl && <img src={config.qrUrl} alt="QR de pago" style={{ width: 120, borderRadius: 10, marginBottom: 10 }} />}
          <label className="qlc-label">Código QR</label>
          <input className="qlc-input" type="file" accept="image/*" onChange={uploadQr} />
          <label className="qlc-label">Moneda</label>
          <input className="qlc-input" value="USDT" disabled title="QLC opera únicamente en USDT" />
          <label className="qlc-label">Red</label>
          <input
            className="qlc-input"
            placeholder="Ej. TRC20, ERC20, BEP20"
            value={form.network}
            onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
          />
          <label className="qlc-label">Wallet</label>
          <input className="qlc-input" value={form.walletAddress} onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))} />
          <label className="qlc-label">Liga de wallet</label>
          <input className="qlc-input" value={form.paymentLink} onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))} />
          <label className="qlc-label">Instrucciones</label>
          <textarea className="qlc-textarea" rows={3} value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary">Guardar</button>
          </div>
        </form>

        {confirmSave && (
          <ConfirmSaveModal
            message="Se actualizará la configuración de pagos (moneda, red, wallet, liga y/o instrucciones) que ven todos los clientes."
            onCancel={() => setConfirmSave(false)}
            onConfirm={saveConfig}
          />
        )}

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>Reportes de pago ({reports.length})</h3>
          {reports.length === 0 ? (
            <div className="qlc-empty">Sin reportes.</div>
          ) : (
            <ul className="qlc-plain-list">
              {reports.map((r) => (
                <li key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {r.client?.firstName} {r.client?.lastName} — {r.amount} {r.currency}
                    </span>
                    {(() => {
                      const s = statusOf(PAYMENT_REPORT_STATUS, r.status, 'PENDING');
                      return <span className={`qlc-badge ${s.className}`}>{s.text}</span>;
                    })()}
                  </div>
                  {['PENDING', 'EN_REVISION'].includes(r.status) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button className="qlc-btn ghost" onClick={() => review(r.id, 'APROBADO')}>
                        Aprobar
                      </button>
                      <button className="qlc-btn ghost" onClick={() => setConfirmReject(r)}>
                        Rechazar
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {confirmReject && (
        <ConfirmModal
          title="¿Rechazar este pago?"
          message={`El cliente ${confirmReject.client?.firstName} ${confirmReject.client?.lastName} verá su reporte de ${confirmReject.amount} ${confirmReject.currency} marcado como rechazado.`}
          confirmLabel="Rechazar"
          onClose={() => setConfirmReject(null)}
          onConfirm={() => review(confirmReject.id, 'RECHAZADO')}
        />
      )}
    </div>
  );
}

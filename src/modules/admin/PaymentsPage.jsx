import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';

const emptyForm = { network: '', walletAddress: '', paymentLink: '', instructions: '' };

export default function PaymentsPage() {
  const { t } = useLanguage();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('');
  const [confirmReject, setConfirmReject] = useState(null);
  const [confirmSave, setConfirmSave] = useState(false);

  const paymentReportStatusMap = PAYMENT_REPORT_STATUS(t);

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

  // Actualización sin refresh manual: si un cliente reporta una
  // transferencia en cualquier subcuenta, este listado global la refleja
  // sin recargar. Poll acotado solo a los reportes (no toca el formulario
  // de configuración en edición). Mismo patrón ya usado en el chat de soporte.
  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/admin/payment-reports').then(({ data }) => setReports(data.reports));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const saveConfig = async () => {
    await api.put('/admin/payment-config', form);
    setConfirmSave(false);
    setMessage(t('adminPayments.updated'));
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
      <div className="qlc-kicker">{t('adminPayments.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminPayments.title')}</h1>

      <div className="qlc-detail-grid">
        <form
          className="qlc-card"
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmSave(true);
          }}
        >
          <h3 style={{ marginTop: 0 }}>{t('adminPayments.paymentData')}</h3>
          {config?.qrUrl && <img src={config.qrUrl} alt="QR de pago" style={{ width: 120, borderRadius: 10, marginBottom: 10 }} />}
          <label className="qlc-label">{t('adminPayments.qrCode')}</label>
          <input className="qlc-input" type="file" accept="image/*" onChange={uploadQr} />
          <label className="qlc-label">{t('adminPayments.currency')}</label>
          <input className="qlc-input" value="USDT" disabled title={t('adminPayments.currencyHint')} />
          <label className="qlc-label">{t('adminPayments.network')}</label>
          <input
            className="qlc-input"
            placeholder={t('adminPayments.networkPlaceholder')}
            value={form.network}
            onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
          />
          <label className="qlc-label">{t('adminPayments.wallet')}</label>
          <input className="qlc-input" value={form.walletAddress} onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))} />
          <label className="qlc-label">{t('adminPayments.walletLink')}</label>
          <input className="qlc-input" value={form.paymentLink} onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))} />
          <label className="qlc-label">{t('adminPayments.instructions')}</label>
          <textarea className="qlc-textarea" rows={3} value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary">{t('common.save')}</button>
          </div>
        </form>

        {confirmSave && (
          <ConfirmSaveModal
            message={t('adminPayments.saveConfirmMessage')}
            onCancel={() => setConfirmSave(false)}
            onConfirm={saveConfig}
          />
        )}

        <div className="qlc-card">
          <h3 style={{ marginTop: 0 }}>
            {t('adminPayments.reports')} ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <div className="qlc-empty">{t('adminPayments.noReports')}</div>
          ) : (
            <ul className="qlc-plain-list">
              {reports.map((r) => (
                <li key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {r.client?.firstName} {r.client?.lastName} — {r.amount} {r.currency}
                    </span>
                    {(() => {
                      const s = statusOf(paymentReportStatusMap, r.status, 'PENDING');
                      return <span className={`qlc-badge ${s.className}`}>{s.text}</span>;
                    })()}
                  </div>
                  {['PENDING', 'EN_REVISION'].includes(r.status) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button className="qlc-btn ghost" onClick={() => review(r.id, 'APROBADO')}>
                        {t('adminPayments.approve')}
                      </button>
                      <button className="qlc-btn ghost" onClick={() => setConfirmReject(r)}>
                        {t('adminPayments.reject')}
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
          title={t('adminPayments.rejectTitle')}
          message={t('adminPayments.rejectMessage')
            .replace('{name}', `${confirmReject.client?.firstName} ${confirmReject.client?.lastName}`)
            .replace('{amount}', confirmReject.amount)
            .replace('{currency}', confirmReject.currency)}
          confirmLabel={t('adminPayments.reject')}
          onClose={() => setConfirmReject(null)}
          onConfirm={() => review(confirmReject.id, 'RECHAZADO')}
        />
      )}
    </div>
  );
}

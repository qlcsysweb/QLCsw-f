import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmSaveModal from '../../components/ConfirmSaveModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import TransferReportList from './TransferReportList';

/*
 * PAGOS / GARANTÍA — Transferencia interna Bitget. El admin configura el
 * UID de recepción de QLC (el cliente solo lo ve/copia) y revisa los
 * reportes de transferencia (número de orden + fecha/hora) de todos los
 * clientes. Nada de wallet, red, QR ni liga de pago.
 */
export default function PaymentsPage() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ bitgetReceiveUid: '', instructions: '' });
  const [savedUid, setSavedUid] = useState('');
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);

  const loadReports = () => api.get('/admin/payment-reports').then(({ data }) => setReports(data.reports));
  const load = () => {
    api.get('/admin/payment-config').then(({ data }) => {
      setSavedUid(data.config?.bitgetReceiveUid || '');
      setForm({
        bitgetReceiveUid: data.config?.bitgetReceiveUid || '',
        instructions: data.config?.instructions || '',
      });
    });
    loadReports();
  };
  useEffect(load, []);

  // Actualización sin refresh manual — solo los reportes (no pisa el
  // formulario de configuración en edición).
  useEffect(() => {
    const interval = setInterval(loadReports, 8000);
    return () => clearInterval(interval);
  }, []);

  const saveConfig = async () => {
    setError('');
    try {
      await api.put('/admin/payment-config', {
        bitgetReceiveUid: form.bitgetReceiveUid.trim(),
        instructions: form.instructions,
      });
      setMessage(t('adminPayments.updated'));
      setTimeout(() => setMessage(''), 3000);
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setConfirmSave(false);
    }
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
          <h3 style={{ marginTop: 0 }}>{t('adminPayments.configTitle')}</h3>
          <p style={{ fontSize: 12, color: 'var(--qlc-muted)', marginTop: 0 }}>{t('adminPayments.configHint')}</p>
          <label className="qlc-label" htmlFor="bitget-uid">
            {t('adminPayments.receiveUid')}
          </label>
          <input
            id="bitget-uid"
            className="qlc-input"
            inputMode="numeric"
            maxLength={40}
            placeholder={t('adminPayments.receiveUidPlaceholder')}
            value={form.bitgetReceiveUid}
            onChange={(e) => setForm((f) => ({ ...f, bitgetReceiveUid: e.target.value.replace(/\D/g, '') }))}
          />
          <label className="qlc-label" htmlFor="bitget-instructions">
            {t('adminPayments.instructions')}
          </label>
          <textarea
            id="bitget-instructions"
            className="qlc-textarea"
            rows={3}
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
          />
          {error && <p className="qlc-field-error">{error}</p>}
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
          <TransferReportList reports={reports} receiveUid={savedUid} showClient onChanged={loadReports} />
        </div>
      </div>
    </div>
  );
}

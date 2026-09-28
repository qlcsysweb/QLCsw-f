import { useEffect, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

/*
 * DATOS DE PAGO GENERALES — UID de recepción Bitget de QLC + instrucciones.
 * Se configuran UNA sola vez aquí y los ven todos los clientes en todas sus
 * subcuentas (Depósito de tu garantía → Transferencia interna Bitget). Ya no
 * existe un dato de pago por cliente ni por subcuenta.
 */
export default function PaymentConfigurationCard() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api.get('/admin/payment-configuration').then(({ data }) => {
      setForm({
        bitgetReceiveUid: data.paymentData?.bitgetReceiveUid || '',
        instructions: data.paymentData?.instructions || '',
      });
    });
  useEffect(() => {
    load().catch((err) => setError(translateBackendMessage(err.message, language)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/admin/payment-configuration', {
        bitgetReceiveUid: form.bitgetReceiveUid.trim(),
        instructions: form.instructions,
      });
      setMessage(t('adminPayments.updated'));
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qlc-card">
      <h3 style={{ marginTop: 0 }}>{t('adminPayments.configTitle')}</h3>
      <p style={{ fontSize: 12, color: 'var(--qlc-muted)', marginTop: 0 }}>{t('adminPayments.configHint')}</p>
      {!form ? (
        <div className="qlc-empty">{error || t('common.loading')}</div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirming(true);
          }}
        >
          <label className="qlc-label" htmlFor="bitget-uid">{t('adminPayments.receiveUid')}</label>
          <input
            id="bitget-uid"
            className="qlc-input"
            inputMode="numeric"
            maxLength={40}
            placeholder={t('adminPayments.receiveUidPlaceholder')}
            value={form.bitgetReceiveUid}
            onChange={(e) => setForm((f) => ({ ...f, bitgetReceiveUid: e.target.value.replace(/\D/g, '') }))}
          />
          <label className="qlc-label" htmlFor="bitget-instructions">{t('adminPayments.instructions')}</label>
          <textarea
            id="bitget-instructions"
            className="qlc-textarea"
            rows={3}
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
          />
          {error && <div className="qlc-field-error">{error}</div>}
          <div className="qlc-form-actions">
            {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
            <button className="qlc-btn primary" disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      )}

      {confirming && (
        <ConfirmModal
          title={t('adminPayments.configTitle')}
          message={t('adminPayments.saveConfirmMessage')}
          confirmLabel={t('common.save')}
          danger={false}
          onClose={() => setConfirming(false)}
          onConfirm={save}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// CORRECCIÓN 28 — wallet personal del cliente: la cuenta externa a la que
// QLC podría transferir fondos en el supuesto contractual establecido.
// Nunca se ejecuta ninguna transferencia automática desde aquí.
export default function WalletPage() {
  const { t, language } = useLanguage();
  const [wallet, setWallet] = useState(null);
  const [form, setForm] = useState({ walletAddress: '', walletNetwork: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api.get('/client/wallet').then(({ data }) => {
      setWallet(data.wallet);
      setForm({ walletAddress: data.wallet.walletAddress || '', walletNetwork: data.wallet.walletNetwork || '' });
    });
  useEffect(() => {
    load();
  }, []);

  if (!wallet) return <div className="qlc-empty">{t('common.loading')}</div>;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/client/wallet', form);
      setWallet(data.wallet);
      setMessage(t('clientWallet.savedOk'));
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientWallet.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientWallet.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientWallet.intro')}</p>

      <div className="qlc-detail-grid">
        <form className="qlc-card" onSubmit={submit}>
          {message && <div style={{ color: 'var(--qlc-ok)', fontSize: 12, marginBottom: 10 }}>{message}</div>}
          {error && <div className="qlc-field-error">{error}</div>}
          <label className="qlc-label">{t('clientWallet.address')}</label>
          <input
            className="qlc-input"
            value={form.walletAddress}
            onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
            placeholder={t('clientWallet.addressPlaceholder')}
          />
          <label className="qlc-label">{t('clientWallet.network')}</label>
          <input
            className="qlc-input"
            value={form.walletNetwork}
            onChange={(e) => setForm((f) => ({ ...f, walletNetwork: e.target.value }))}
            placeholder="TRC20, ERC20, BEP20…"
          />
          <button className="qlc-btn primary" style={{ marginTop: 14, width: '100%' }} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>

        {wallet.walletQrUrl && (
          <div className="qlc-card">
            <h3 style={{ marginTop: 0 }}>{t('clientWallet.qrTitle')}</h3>
            <img src={wallet.walletQrUrl} alt="QR wallet" style={{ width: 160, borderRadius: 10 }} />
          </div>
        )}
      </div>
    </div>
  );
}

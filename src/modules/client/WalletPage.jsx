import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
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
  const [copiedField, setCopiedField] = useState(null);

  const load = () =>
    api.get('/client/wallet').then(({ data }) => {
      setWallet(data.wallet);
      setForm({ walletAddress: data.wallet.walletAddress || '', walletNetwork: data.wallet.walletNetwork || '' });
    });
  useEffect(() => {
    load();
  }, []);

  if (!wallet) return <div className="qlc-empty">{t('common.loading')}</div>;

  const copyField = async (field, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 2500);
    } catch {
      // Clipboard API unavailable — no-op, el usuario puede seleccionar el texto manualmente.
    }
  };

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
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="qlc-input"
              value={form.walletAddress}
              onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
              placeholder={t('clientWallet.addressPlaceholder')}
            />
            <button
              type="button"
              className="qlc-btn ghost"
              style={{ flexShrink: 0 }}
              disabled={!form.walletAddress}
              onClick={() => copyField('address', form.walletAddress)}
            >
              {copiedField === 'address' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <label className="qlc-label">{t('clientWallet.network')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="qlc-input"
              value={form.walletNetwork}
              onChange={(e) => setForm((f) => ({ ...f, walletNetwork: e.target.value }))}
              placeholder="TRC20, ERC20, BEP20…"
            />
            <button
              type="button"
              className="qlc-btn ghost"
              style={{ flexShrink: 0 }}
              disabled={!form.walletNetwork}
              onClick={() => copyField('network', form.walletNetwork)}
            >
              {copiedField === 'network' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <button className="qlc-btn primary" style={{ marginTop: 14, width: '100%' }} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>

        {(wallet.hasWalletQrDrive || wallet.walletQrUrl) && (
          <div className="qlc-card">
            <h3 style={{ marginTop: 0 }}>{t('clientWallet.qrTitle')}</h3>
            <img
              src={wallet.hasWalletQrDrive ? `${API_BASE_URL}/client/wallet/qr` : wallet.walletQrUrl}
              alt="QR wallet"
              style={{ width: 160, borderRadius: 10 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

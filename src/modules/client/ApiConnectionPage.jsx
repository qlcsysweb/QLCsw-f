import { useEffect, useState } from 'react';
import api from '../../services/api';
import { API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

export default function ApiConnectionPage() {
  const { t, language } = useLanguage();
  const [connection, setConnection] = useState(null);
  const [externalUrl, setExternalUrl] = useState(null);
  const [form, setForm] = useState({ exchangeName: '', apiKey: '', apiSecret: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const apiStatusMap = API_CONNECTION_STATUS(t);

  const load = () => {
    api
      .get('/client/api-connection')
      .then(({ data }) => setConnection(data.connection))
      .catch(() => setConnection(null));
    api.get('/client/platform-link').then(({ data }) => setExternalUrl(data.externalPlatformUrl));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.exchangeName && !form.apiKey && !form.apiSecret) return;
    setSaving(true);
    setError('');
    try {
      const payload = {};
      if (form.exchangeName) payload.exchangeName = form.exchangeName;
      if (form.apiKey) payload.apiKey = form.apiKey;
      if (form.apiSecret) payload.apiSecret = form.apiSecret;
      await api.patch('/client/api-connection', payload);
      setMessage(t('clientApiConnection.savedOk'));
      setTimeout(() => setMessage(''), 4000);
      setForm({ exchangeName: '', apiKey: '', apiSecret: '' });
      load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSaving(false);
    }
  };

  const status = statusOf(apiStatusMap, connection?.status, 'PENDIENTE');

  return (
    <div>
      <div className="qlc-kicker">{t('clientApiConnection.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientApiConnection.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientApiConnection.disclaimer')}</p>

      <div className="qlc-detail-grid">
        <div className="qlc-card">
          <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {t('clientApiConnection.statusTitle')}
            <span className={`qlc-badge ${status.className}`}>{status.text}</span>
          </h3>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            <strong>{t('clientApiConnection.exchange')}:</strong> {connection?.exchangeName || 'Bitget'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            <strong>API Key:</strong>{' '}
            {connection?.hasApiKey ? t('clientApiConnection.registered') : t('clientApiConnection.notRegistered')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--qlc-muted)' }}>
            <strong>API Secret:</strong>{' '}
            {connection?.hasApiSecret ? t('clientApiConnection.registered') : t('clientApiConnection.notRegistered')}
          </p>

          {externalUrl && (
            <a className="qlc-btn primary" href={externalUrl} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 14 }}>
              {t('clientApiConnection.goToPlatform')}
            </a>
          )}
        </div>

        <form className="qlc-card" onSubmit={submit}>
          <h3 style={{ marginTop: 0 }}>{t('clientApiConnection.formTitle')}</h3>
          {message && <div style={{ color: 'var(--qlc-ok)', fontSize: 12, marginBottom: 10 }}>{message}</div>}
          {error && <div className="qlc-field-error">{error}</div>}
          <label className="qlc-label">{t('clientApiConnection.exchange')}</label>
          <input
            className="qlc-input"
            value={form.exchangeName}
            onChange={(e) => setForm((f) => ({ ...f, exchangeName: e.target.value }))}
            placeholder={connection?.exchangeName || 'Bitget'}
          />
          <label className="qlc-label">
            API Key {connection?.hasApiKey ? t('clientApiConnection.alreadyRegistered') : ''}
          </label>
          <input
            className="qlc-input"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder={t('clientApiConnection.leaveBlank')}
          />
          <label className="qlc-label">
            API Secret {connection?.hasApiSecret ? t('clientApiConnection.alreadyRegistered') : ''}
          </label>
          <input
            className="qlc-input"
            type="password"
            value={form.apiSecret}
            onChange={(e) => setForm((f) => ({ ...f, apiSecret: e.target.value }))}
            placeholder={t('clientApiConnection.leaveBlank')}
          />
          <button className="qlc-btn primary" style={{ marginTop: 14, width: '100%' }} disabled={saving}>
            {saving ? t('common.saving') : t('clientApiConnection.save')}
          </button>
        </form>
      </div>
    </div>
  );
}

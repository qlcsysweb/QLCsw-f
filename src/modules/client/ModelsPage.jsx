import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedModel } from '../../i18n/bilingualContent';

export default function ModelsPage() {
  const { t, language } = useLanguage();
  const [modelsRaw, setModels] = useState([]);
  const [currentModelKey, setCurrentModelKey] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState('');

  const load = () => {
    api.get('/client/models').then(({ data }) => setModels(data.models));
    api.get('/client/me').then(({ data }) => setCurrentModelKey(data.profile.model?.key || null));
  };
  useEffect(load, []);

  const models = useMemo(() => modelsRaw.map((m) => getLocalizedModel(m, language)), [modelsRaw, language]);

  const select = async (modelKey) => {
    setSaving(modelKey);
    try {
      await api.patch('/client/model', { modelKey });
      setMessage(t('clientModels.confirmed'));
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving('');
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientModels.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientModels.title')}</h1>
      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-detail-grid">
        {models.map((m) => (
          <div className="qlc-card" key={m.id}>
            <div className="qlc-kicker">{m.key}</div>
            <h3 style={{ margin: '6px 0' }}>{m.name}</h3>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{m.description}</p>
            {m.conditions && (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>
                {t('clientModels.conditions')}: {m.conditions}
              </p>
            )}
            {m.objective && (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>
                {t('clientModels.objective')}: {m.objective}
              </p>
            )}
            <button
              className={`qlc-btn ${currentModelKey === m.key ? 'ghost' : 'primary'}`}
              style={{ width: '100%', marginTop: 12 }}
              disabled={currentModelKey === m.key || saving === m.key}
              onClick={() => select(m.key)}
            >
              {currentModelKey === m.key
                ? t('clientModels.currentModel')
                : saving === m.key
                  ? t('common.saving')
                  : t('clientModels.selectConfirm')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

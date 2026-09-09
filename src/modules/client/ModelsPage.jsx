import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { pickBilingual } from '../../i18n/bilingualContent';

export default function ModelsPage() {
  const { t, language } = useLanguage();
  const [models, setModels] = useState([]);
  const [currentModelKey, setCurrentModelKey] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState('');

  const load = () => {
    api.get('/client/models').then(({ data }) => setModels(data.models));
    api.get('/client/me').then(({ data }) => setCurrentModelKey(data.profile.model?.key || null));
  };
  useEffect(load, []);

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
            <h3 style={{ margin: '6px 0' }}>{pickBilingual(m.name, m.nameEn, language)}</h3>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{pickBilingual(m.description, m.descriptionEn, language)}</p>
            {m.conditions && (
              <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>
                {t('clientModels.conditions')}: {pickBilingual(m.conditions, m.conditionsEn, language)}
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

import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ModelsPage() {
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
      setMessage('Modelo seleccionado y confirmado.');
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving('');
    }
  };

  return (
    <div>
      <div className="qlc-kicker">MODELOS DE PARTICIPACIÓN</div>
      <h1 style={{ marginTop: 0 }}>Elige tu modelo</h1>
      {message && <div className="qlc-card" style={{ borderColor: 'var(--qlc-ok-border)', marginBottom: 16 }}>{message}</div>}

      <div className="qlc-detail-grid">
        {models.map((m) => (
          <div className="qlc-card" key={m.id}>
            <div className="qlc-kicker">{m.key}</div>
            <h3 style={{ margin: '6px 0' }}>{m.name}</h3>
            <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{m.description}</p>
            {m.conditions && <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>Condiciones: {m.conditions}</p>}
            {m.objective && <p style={{ fontSize: 12, color: 'var(--qlc-muted2)' }}>Objetivo: {m.objective}</p>}
            <button
              className={`qlc-btn ${currentModelKey === m.key ? 'ghost' : 'primary'}`}
              style={{ width: '100%', marginTop: 12 }}
              disabled={currentModelKey === m.key || saving === m.key}
              onClick={() => select(m.key)}
            >
              {currentModelKey === m.key ? 'Modelo actual' : saving === m.key ? 'Guardando…' : 'Seleccionar y confirmar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

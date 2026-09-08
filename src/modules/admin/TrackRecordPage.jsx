import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function TrackRecordPage() {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get('/admin/track-record').then(({ data }) => {
      setRecord(data.trackRecord);
      setForm(data.trackRecord);
    });
  useEffect(() => {
    load();
  }, []);

  if (!form) return <div className="qlc-empty">Cargando…</div>;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/track-record/${record.id}`, {
        title: form.title,
        description: form.description,
        platformName: form.platformName,
        profileLink: form.profileLink || '',
        ranking: form.ranking,
      });
      setMessage('Track Record actualizado.');
      setTimeout(() => setMessage(''), 3000);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="qlc-kicker">TRACK RECORD</div>
      <h1 style={{ marginTop: 0 }}>Referencia externa verificable</h1>
      <form className="qlc-card" style={{ maxWidth: 560 }} onSubmit={submit}>
        <label className="qlc-label">Título</label>
        <input className="qlc-input" value={form.title} onChange={update('title')} />
        <label className="qlc-label">Descripción</label>
        <textarea className="qlc-textarea" rows={3} value={form.description} onChange={update('description')} />
        <label className="qlc-label">Plataforma</label>
        <input className="qlc-input" value={form.platformName} onChange={update('platformName')} />
        <label className="qlc-label">Enlace del perfil (Bitget)</label>
        <input
          className="qlc-input"
          value={form.profileLink || ''}
          onChange={update('profileLink')}
          placeholder="https://www.bitget.com/copytrading/..."
        />
        <label className="qlc-label">Clasificación actual</label>
        <input className="qlc-input" value={form.ranking} onChange={update('ranking')} placeholder="#XXX" />

        <div className="qlc-form-actions">
          {message && <span style={{ color: 'var(--qlc-ok)', fontSize: 12 }}>{message}</span>}
          <button className="qlc-btn primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

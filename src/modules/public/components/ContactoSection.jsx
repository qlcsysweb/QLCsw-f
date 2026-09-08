import { useState } from 'react';
import api from '../../../services/api';
import SectionMedia from './SectionMedia';

const initialForm = { firstName: '', lastName: '', email: '', phone: '', message: '' };

export default function ContactoSection({ text, media = () => [] }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api.post('/prospects', { ...form, source: 'web_publica' });
      setStatus('sent');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <section className="section" id="contacto">
      <div className="container">
        <div className="contact-clean">
          <div>
            <div className="kicker">{text('contacto', 'kicker', 'QUANTUM LIQUIDITY CAPITAL')}</div>
            <h2 style={{ marginBottom: 10 }}>{text('contacto', 'title', 'COPYTRADING INSTITUCIONAL.')}</h2>
            <p className="sub">
              {text('contacto', 'sub', 'Trading cuantitativo · Algoritmos · API Execution · Microposiciones')}
            </p>
          </div>
          <div>
            <a className="btn primary" href="#registro-form">
              Solicitar información
            </a>
          </div>
        </div>

        <div className="registro-panel" id="registro-form">
          <div className="kicker">REGISTRO</div>
          <h3 style={{ margin: '4px 0 18px' }}>Solicita información y comienza tu proceso</h3>

          {status === 'sent' ? (
            <p style={{ color: 'var(--qlc-blue2)', fontSize: 14 }}>
              Gracias. Hemos recibido tu solicitud — un miembro del equipo de QLC se pondrá en contacto
              contigo en breve.
            </p>
          ) : (
            <form onSubmit={submit}>
              <label>Nombre</label>
              <input value={form.firstName} onChange={update('firstName')} required />
              <label>Apellidos</label>
              <input value={form.lastName} onChange={update('lastName')} />
              <label>Email</label>
              <input type="email" value={form.email} onChange={update('email')} required />
              <label>Teléfono (opcional)</label>
              <input value={form.phone} onChange={update('phone')} />
              <label>Mensaje (opcional)</label>
              <textarea rows={3} value={form.message} onChange={update('message')} />

              {error && <div style={{ color: '#ffb3b3', fontSize: 12, marginBottom: 10 }}>{error}</div>}

              <button className="btn primary" type="submit" disabled={status === 'sending'} style={{ width: '100%' }}>
                {status === 'sending' ? 'Enviando…' : 'Solicitar información'}
              </button>
            </form>
          )}
        </div>

        <SectionMedia items={media('contacto')} />
      </div>
    </section>
  );
}

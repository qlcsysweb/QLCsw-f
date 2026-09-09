import { useState } from 'react';
import api from '../../../services/api';
import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';
import { translateBackendMessage } from '../../../i18n/backendMessages';

const initialForm = { firstName: '', lastName: '', email: '', phone: '', message: '' };

export default function ContactoSection({ text, media = () => [] }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email) {
      setError(t('contact.requiredError'));
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api.post('/prospects', { ...form, source: 'web_publica', language });
      setStatus('sent');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setError(translateBackendMessage(err.message, language));
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
            <a
              className="btn primary"
              href="#registro-form"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('registro-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {t('contact.submit')}
            </a>
          </div>
        </div>

        <div className="registro-panel" id="registro-form">
          <div className="kicker">{t('contact.registerKicker')}</div>
          <h3 style={{ margin: '4px 0 18px' }}>{t('contact.registerSubtitle')}</h3>

          {status === 'sent' ? (
            <p style={{ color: 'var(--qlc-blue2)', fontSize: 14 }}>{t('contact.successMessage')}</p>
          ) : (
            <form onSubmit={submit}>
              <label>{t('contact.firstName')}</label>
              <input value={form.firstName} onChange={update('firstName')} required />
              <label>{t('contact.lastName')}</label>
              <input value={form.lastName} onChange={update('lastName')} />
              <label>{t('contact.email')}</label>
              <input type="email" value={form.email} onChange={update('email')} required />
              <label>{t('contact.phone')}</label>
              <input value={form.phone} onChange={update('phone')} />
              <label>{t('contact.message')}</label>
              <textarea rows={3} value={form.message} onChange={update('message')} />

              {error && <div style={{ color: '#ffb3b3', fontSize: 12, marginBottom: 10 }}>{error}</div>}

              <button className="btn primary" type="submit" disabled={status === 'sending'} style={{ width: '100%' }}>
                {status === 'sending' ? t('contact.sending') : t('contact.submit')}
              </button>
            </form>
          )}
        </div>

        <SectionMedia items={media('contacto')} />
      </div>
    </section>
  );
}

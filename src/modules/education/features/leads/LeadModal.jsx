import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

export const LEAD_INTERESTS = {
  EDUCACION_FINANCIERA: 'Educación financiera',
  TRADING_ACADEMY: 'Institutional Trading Academy',
  COPYTRADING: 'QLC Quantitative Trading Bot',
  GENERAL: 'Información general de QLC',
};

const LeadContext = createContext(() => undefined);
export const useLeadRequest = () => useContext(LeadContext);

const EMPTY = { name: '', email: '', phone: '', message: '' };

function LeadForm({ interest, onClose }) {
  const { t } = useI18n();
  const location = useLocation();
  const [f, setF] = useState({ ...EMPTY, interest });
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState({ busy: false, error: null, done: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!accepted) return setState({ busy: false, error: { message: t('public.lead.acceptRequired') }, done: false });
    setState({ busy: true, error: null, done: false });
    try {
      await api.post('/public/leads', { ...f, acceptPrivacy: true, sourcePath: location.pathname });
      setState({ busy: false, error: null, done: true });
    } catch (error) {
      setState({ busy: false, error, done: false });
    }
  };

  if (state.done) {
    return (
      <div className="stack lead-done">
        <div className="lead-check" aria-hidden="true">✓</div>
        <p><b>{t('public.lead.received')}</b>{t('public.lead.receivedText', { interest: t(`public.lead.interests.${f.interest}`) })}</p>
        <Button onClick={onClose}>{t('public.lead.close')}</Button>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="form-grid cols-2">
        <Field label={t('public.lead.name')}><Input required maxLength={120} autoComplete="name" value={f.name} onChange={set('name')} /></Field>
        <Field label={t('public.lead.email')}><Input type="email" required maxLength={160} autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label={t('public.lead.phone')}><Input type="tel" maxLength={30} autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label={t('public.lead.interest')}><Select value={f.interest} onChange={set('interest')} options={Object.keys(LEAD_INTERESTS).map((value) => ({ value, label: t(`public.lead.interests.${value}`) }))} /></Field>
        <Field label={t('public.lead.message')} full><Textarea rows={3} maxLength={1000} value={f.message} onChange={set('message')} placeholder={t('public.lead.messagePlaceholder')} /></Field>
      </div>
      <label className="check legal-check">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
        <span>{t('public.lead.acceptBefore')}<Link to="/privacidad" target="_blank" rel="noopener">{t('common.privacy')}</Link>{t('public.lead.acceptAfter')}</span>
      </label>
      <FormError error={state.error} />
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>{t('public.lead.cancel')}</Button>
        <Button type="submit" loading={state.busy}>{t('public.lead.submit')}</Button>
      </div>
    </form>
  );
}

export function LeadRequestProvider({ children }) {
  const [interest, setInterest] = useState(null);
  const open = useCallback((value = 'GENERAL') => setInterest(value), []);
  const close = useCallback(() => setInterest(null), []);
  const value = useMemo(() => open, [open]);
  const { t } = useI18n();
  return (
    <LeadContext.Provider value={value}>
      {children}
      <Modal open={!!interest} title={t('public.lead.title')} onClose={close} wide>
        {interest && <LeadForm key={interest} interest={interest} onClose={close} />}
      </Modal>
    </LeadContext.Provider>
  );
}

export function LeadButton({ interest = 'GENERAL', className = 'pbtn pbtn-primary', children }) {
  const open = useLeadRequest();
  return <button type="button" className={className} onClick={() => open(interest)}>{children}</button>;
}

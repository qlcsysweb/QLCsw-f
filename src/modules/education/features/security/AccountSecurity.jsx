import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { CodeInput, Field, FormError, Input } from '../../components/ui/Form.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

const EMPTY = { code: '', newPassword: '', confirm: '' };

function ChangePasswordModal({ onClose }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [f, setF] = useState(EMPTY);
  const [state, setState] = useState({ busy: false, error: null, done: null });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return setState({ busy: false, error: { message: t('common.passwordMismatch') }, done: null });
    setState({ busy: true, error: null, done: null });
    try {
      const res = await api.post('/auth/change-password', { code: f.code, newPassword: f.newPassword });
      setF(EMPTY);
      setState({ busy: false, error: null, done: res.message });
    } catch (error) {
      setState({ busy: false, error, done: null });
    }
  };

  return (
    <Modal open title={t('app.security.title')} onClose={onClose}>
      {state.done ? (
        <div className="stack">
          <p className="notice">{state.done}</p>
          <Button onClick={onClose}>{t('app.security.done')}</Button>
        </div>
      ) : (
        <form className="stack" onSubmit={save}>
          <p className="small muted">{t('app.security.introBefore')}<b>{user?.email}</b>{t('app.security.introAfter')}</p>
          <Field label={t('app.security.code')}><CodeInput value={f.code} onChange={set('code')} /></Field>
          <Field label={t('app.security.newPassword')} hint={t('app.security.minChars')}><Input type="password" required minLength={8} autoComplete="new-password" value={f.newPassword} onChange={set('newPassword')} /></Field>
          <Field label={t('app.security.confirm')}><Input type="password" required minLength={8} autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></Field>
          <FormError error={state.error} />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>{t('app.security.cancel')}</Button>
            <Button type="submit" loading={state.busy}>{t('app.security.submit')}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function SecurityNavButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="nav-logout" onClick={() => setOpen(true)}><span className="ico">⚿</span>{t('app.changePassword')}</button>
      {open && <ChangePasswordModal onClose={() => setOpen(false)} />}
    </>
  );
}

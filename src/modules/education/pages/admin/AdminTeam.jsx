import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { date } from '../../utils/format.js';
import { ADMIN_LEVELS } from '../../utils/labels.js';
import { Card, PageHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog, Modal } from '../../components/ui/Modal.jsx';
import { Field, FormError, Input, Select } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';

const levelOptions = Object.entries(ADMIN_LEVELS).map(([value, label]) => ({ value, label }));

function NewAdmin({ onClose, onSaved }) {
  const [f, setF] = useState({ name: '', email: '', password: '', adminLevel: 'VIEW' });
  const [state, setState] = useState({ busy: false, error: null });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null });
    try { await api.post('/admin/admins', f); onSaved(); } catch (error) { setState({ busy: false, error }); }
  };
  return (
    <Modal open title={tr('Nuevo administrador')} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <Field label={tr('Nombre')}><Input required value={f.name} onChange={set('name')} /></Field>
        <Field label={tr('Correo')}><Input type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label={tr('Contraseña inicial')} hint={tr('Mínimo 8 caracteres. Compártela por un canal seguro.')}><Input type="password" minLength={8} required value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label={tr('Nivel')}><Select value={f.adminLevel} onChange={set('adminLevel')} options={levelOptions} /></Field>
        <p className="small muted">{tr('En su primer inicio de sesión deberá registrar la verificación en dos pasos con Google Authenticator.')}</p>
        <FormError error={state.error} />
        <div className="form-actions"><Button type="button" variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button><Button type="submit" loading={state.busy}>{tr('Crear')}</Button></div>
      </form>
    </Modal>
  );
}

const DIALOGS = {
  status: (a) => ({
    title: a.isActive ? 'Inactivar administrador' : 'Reactivar administrador',
    message: a.isActive ? tr('{name} no podrá iniciar sesión hasta que lo reactives.', { name: a.name }) : tr('{name} podrá volver a iniciar sesión.', { name: a.name }),
    confirmLabel: a.isActive ? 'Inactivar' : 'Reactivar',
    danger: a.isActive,
    run: () => api.patch(`/admin/admins/${a.id}/status`, { isActive: !a.isActive }),
  }),
  password: (a) => ({
    title: 'Cambiar contraseña',
    message: tr('Asigna una nueva contraseña a {name}. Compártela por un canal seguro.', { name: a.name }),
    confirmLabel: 'Guardar contraseña',
    run: (password) => api.post(`/admin/admins/${a.id}/password`, { password }),
  }),
  delete: (a) => ({
    title: 'Eliminar administrador',
    message: tr('Se eliminará definitivamente la cuenta de {name} ({email}).', { name: a.name, email: a.email }),
    confirmLabel: 'Eliminar',
    danger: true,
    run: () => api.del(`/admin/admins/${a.id}`),
  }),
};

function AdminAction({ dialog, onClose, onDone }) {
  const [password, setPassword] = useState({ value: '', confirm: '' });
  const [state, setState] = useState({ busy: false, error: null });
  const config = DIALOGS[dialog.kind](dialog.admin);
  const needsPassword = dialog.kind === 'password';

  const confirm = async () => {
    if (needsPassword && password.value.length < 8) return setState({ busy: false, error: { message: tr('La contraseña debe tener al menos 8 caracteres') } });
    if (needsPassword && password.value !== password.confirm) return setState({ busy: false, error: { message: tr('Las contraseñas no coinciden') } });
    setState({ busy: true, error: null });
    try {
      await config.run(password.value);
      onDone();
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  return (
    <ConfirmDialog open title={config.title} message={config.message} confirmLabel={config.confirmLabel} danger={config.danger} loading={state.busy} onConfirm={confirm} onClose={onClose}>
      <div className="stack">
        {needsPassword && (
          <>
            <Field label={tr('Nueva contraseña')} hint={tr('Mínimo 8 caracteres.')}><Input type="password" minLength={8} autoComplete="new-password" value={password.value} onChange={(e) => setPassword({ ...password, value: e.target.value })} /></Field>
            <Field label={tr('Confirmar contraseña')}><Input type="password" minLength={8} autoComplete="new-password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} /></Field>
          </>
        )}
        <FormError error={state.error} />
      </div>
    </ConfirmDialog>
  );
}

export default function AdminTeam() {
  const { user } = useAuth();
  const res = useAsync(() => api.get('/admin/admins'), []);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [err, setErr] = useState(null);
  const changeLevel = async (a, adminLevel) => {
    if (!window.confirm(tr('¿Cambiar el nivel de {name} a {level}?', { name: a.name, level: ADMIN_LEVELS[adminLevel] }))) return;
    try { await api.patch(`/admin/admins/${a.id}/level`, { adminLevel }); res.reload(); } catch (e) { setErr(e); }
  };
  const isSelf = (a) => a.id === user.id;
  return (
    <>
      <PageHeader title={tr('Administradores')} subtitle={tr('Visualización · Edición · Administración completa')} actions={<Button onClick={() => setOpen(true)}>{tr('+ Administrador')}</Button>} />
      <Card>
        <FormError error={err} />
        <AsyncView {...res} onRetry={res.reload}>
          {(list) => (
            <DataTable rows={list} columns={[
              { key: 'name', label: tr('Nombre'), render: (a) => <>{tr(a.name)}{isSelf(a) && <span className="pill info">{tr('Tú')}</span>}<span className="small block">{a.email}</span></> },
              { key: 'level', label: tr('Nivel'), render: (a) => (isSelf(a) ? ADMIN_LEVELS[a.adminLevel] : (
                <Select value={a.adminLevel || ''} onChange={(e) => changeLevel(a, e.target.value)} options={levelOptions} aria-label={tr('Nivel')} />
              )) },
              { key: 'status', label: tr('Estado'), render: (a) => (
                <span className="row-actions">
                  <span className={`pill ${a.isActive ? '' : 'bad'}`}>{a.isActive ? tr('Activo') : tr('Inactivo')}</span>
                  <span className={`pill ${a.twoFactorEnabled ? 'info' : 'warn'}`}>{a.twoFactorEnabled ? tr('2FA activo') : tr('2FA pendiente')}</span>
                </span>
              ) },
              { key: 'createdAt', label: tr('Alta'), render: (a) => date(a.createdAt) },
              { key: 'actions', label: tr('Acciones'), align: 'right', render: (a) => (isSelf(a) ? <span className="small muted">{tr('Usa “Cambiar contraseña” del menú')}</span> : (
                <span className="row-actions">
                  <Button variant="secondary" onClick={() => setDialog({ kind: 'password', admin: a })}>{tr('Contraseña')}</Button>
                  <Button variant="secondary" onClick={() => setDialog({ kind: 'status', admin: a })}>{a.isActive ? tr('Inactivar') : tr('Reactivar')}</Button>
                  <Button variant="danger" onClick={() => setDialog({ kind: 'delete', admin: a })}>{tr('Eliminar')}</Button>
                </span>
              )) },
            ]} />
          )}
        </AsyncView>
      </Card>
      {open && <NewAdmin onClose={() => setOpen(false)} onSaved={() => { setOpen(false); res.reload(); }} />}
      {dialog && <AdminAction key={`${dialog.kind}-${dialog.admin.id}`} dialog={dialog} onClose={() => setDialog(null)} onDone={() => { setDialog(null); res.reload(); }} />}
    </>
  );
}

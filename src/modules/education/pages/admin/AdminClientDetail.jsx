import { COUNTRIES, countryName } from '../../shared/countries.js';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { date, dateTime } from '../../utils/format.js';
import { Card, PageHeader, Pill, Row } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { FormError } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { accessPill } from './AdminClients.jsx';
import { getLanguage, tr } from '../../i18n/tr.js';

const SOURCE_LABELS = { PAGO: 'Pago', MANUAL: 'Manual', REGALO: 'Regalo', PROMOCION: 'Pago promocional' };

function ClientGrants({ client }) {
  return (
    <Card title={tr('Accesos del cliente')} actions={<Link className="btn-secondary" to="/admin/control-accesos">{tr('Control de accesos')}</Link>}>
      <DataTable rows={client.grants} empty={tr('Sin accesos otorgados.')} columns={[
        { key: 'offer', label: tr('Producto') },
        { key: 'startsAt', label: tr('Inicio'), render: (g) => date(g.startsAt) },
        { key: 'expiresAt', label: tr('Vence'), render: (g) => (g.expiresAt ? date(g.expiresAt) : tr('Sin vencimiento')) },
        { key: 'origin', label: tr('Origen'), render: (g) => <>{tr(SOURCE_LABELS[g.source] || g.source)}{g.reason && <span className="small block">{g.reason}</span>}</> },
        { key: 'active', label: tr('Estado'), render: (g) => <Pill variant={g.active ? '' : 'muted'}>{g.active ? tr('Activo') : tr('Retirado')}</Pill> },
      ]} />
      <p className="small muted">{tr('Conceder, modificar o retirar accesos se hace en Administración General – Control de accesos, con la contraseña maestra.')}</p>
    </Card>
  );
}

function TwoFactorReset({ client, onSaved }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ busy: false, error: null });
  const confirm = async () => {
    setState({ busy: true, error: null });
    try {
      await api.post(`/admin/clients/${client.id}/reset-2fa`);
      setOpen(false);
      setState({ busy: false, error: null });
      onSaved();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  if (!client.twoFactorEnabled) return null;
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>{tr('Restablecer 2FA')}</Button>
      <ConfirmDialog
        open={open}
        title={tr('Restablecer verificación en dos pasos')}
        danger
        loading={state.busy}
        message={tr('{name} deberá configurar de nuevo Google Authenticator en su próximo inicio de sesión con contraseña.', { name: client.name })}
        onConfirm={confirm}
        onClose={() => setOpen(false)}
      >
        <FormError error={state.error} />
      </ConfirmDialog>
    </>
  );
}

function ResidenceCountry({ client, canEdit, onSaved }) {
  const [error, setError] = useState(null);
  const lang = getLanguage() === 'en' ? 'en' : 'es';
  const list = [...COUNTRIES].sort((a, b) => a[lang].localeCompare(b[lang], lang));
  const save = async (e) => {
    setError(null);
    try {
      await api.patch(`/admin/clients/${client.id}/residence-country`, { residenceCountry: e.target.value });
      onSaved();
    } catch (err) {
      setError(err);
    }
  };
  if (!canEdit) return countryName(client.residenceCountry, lang) || '—';
  return (
    <>
      <select className="input" value={client.residenceCountry || ''} onChange={save} aria-label={tr('País de residencia')}>
        {!client.residenceCountry && <option value="">—</option>}
        {list.map((c) => <option key={c.code} value={c.code}>{c[lang]}</option>)}
      </select>
      <FormError error={error} />
    </>
  );
}

export default function AdminClientDetail() {
  const { clientId } = useParams();
  const { user } = useAuth();
  const client = useAsync(() => api.get(`/admin/clients/${clientId}`), [clientId]);

  return (
    <AsyncView {...client} onRetry={client.reload}>
      {(c) => (
        <>
          <Link className="btn-secondary back" to="/admin/clientes">{tr('← Clientes')}</Link>
          <PageHeader title={c.name} subtitle={c.email} actions={c.dataShare
            ? (
              <span className="row-actions">
                <Link className="btn-primary" to={`/admin/clientes/${c.id}/app`}>{c.dataShare.allowEdit ? tr('Entrar y modificar datos') : tr('Ver datos compartidos')}</Link>
                <Button variant="danger" onClick={async () => { await api.post(`/admin/clients/${c.id}/data-share/stop`, {}); client.reload(); }}>{tr('Salir de compartir datos')}</Button>
              </span>
            )
            : <Pill variant="muted">{tr('El cliente no comparte sus datos')}</Pill>} />
          <Card title={tr('Datos compartidos por el cliente')}>
            {c.dataShare
              ? (
                <>
                  <p className="small">{tr('El cliente autorizó compartir sus datos desde el {date}; el acceso dura hasta que tú pulses «Salir de compartir datos» o el cliente deje de compartirlos.', { date: dateTime(c.dataShare.grantedAt) })}</p>
                  <p className="small">{c.dataShare.allowEdit ? tr('También autorizó que modifiques sus datos: puedes escribir en su panel como si fueras el cliente. Cada cambio queda registrado.') : tr('Solo puedes ver sus datos. Para modificarlos, pídele que active «Autorizar modificar mis datos».')}</p>
                </>
              )
              : <p className="small muted">{tr('Solo puedes ver el panel del cliente cuando él lo autoriza desde Mi acceso o Asesoría personalizada, con el botón «Compartir mis datos».')}</p>}
          </Card>
          <div className="layout">
            <Card title={tr('Información')}>
              <Row label={tr('Acceso')} value={accessPill(c.access)} />
              {c.access.full && <Row label={tr('Acceso anual vigente hasta')} value={date(c.access.full.expiresAt)} />}
              <Row label={tr('Módulos completados')} value={`${c.completedModules} / 12`} />
              <Row label={tr('Verificación en dos pasos')} value={<Pill variant={c.twoFactorEnabled ? '' : 'warn'}>{c.twoFactorEnabled ? tr('Activa') : tr('Pendiente')}</Pill>} />
              {user?.adminLevel === 'FULL' && <TwoFactorReset client={c} onSaved={client.reload} />}
              <Row label={tr('Teléfono')} value={c.phone || '—'} />
              <Row label={tr('País de residencia')} value={<ResidenceCountry client={c} canEdit={user?.adminLevel === 'FULL' || user?.adminLevel === 'EDIT'} onSaved={client.reload} />} />
              <Row label={tr('Último acceso')} value={dateTime(c.lastLoginAt)} />
              <Row label={tr('Periodos / cortes / citas')} value={`${c.counts.periods} / ${c.counts.monthlyCloses} / ${c.counts.appointments}`} />
              <Row label={tr('Cliente desde')} value={date(c.createdAt)} />
            </Card>
            <ClientGrants client={c} />
          </div>
        </>
      )}
    </AsyncView>
  );
}

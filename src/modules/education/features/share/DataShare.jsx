import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime } from '../../utils/format.js';
import { Card, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { FormError } from '../../components/ui/Form.jsx';
import { tr } from '../../i18n/tr.js';
import { ShareChat } from './ShareChat.jsx';

const EVENT = 'qlc-data-share';

function useDataShare() {
  const res = useAsync(() => api.get('/auth/data-share'), []);
  useEffect(() => {
    const reload = () => res.reload();
    window.addEventListener(EVENT, reload);
    return () => window.removeEventListener(EVENT, reload);
  }, [res.reload]);
  const [state, setState] = useState({ busy: false, error: null });
  const run = async (path, body = {}) => {
    setState({ busy: true, error: null });
    try {
      await api.post(path, body);
      setState({ busy: false, error: null });
      window.dispatchEvent(new Event(EVENT));
      return true;
    } catch (error) {
      setState({ busy: false, error });
      return false;
    }
  };
  return {
    active: res.data?.active || null,
    loaded: !!res.data,
    busy: state.busy,
    error: state.error,
    start: () => run('/auth/data-share/start'),
    stop: () => run('/auth/data-share/stop'),
    allowEdit: () => run('/auth/data-share/edit', { allow: true }),
    revokeEdit: () => run('/auth/data-share/edit', { allow: false }),
  };
}

export function DataShareCard() {
  const share = useDataShare();
  const [confirm, setConfirm] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  if (!share.loaded) return null;
  const canModify = !!share.active?.allowEdit;
  return (
    <Card id="compartir-datos" title={tr('Compartir mis datos con mi asesor QLC')} actions={share.active ? <Pill>{canModify ? tr('Puede modificar') : tr('Compartiendo')}</Pill> : <Pill variant="muted">{tr('No compartido')}</Pill>}>
      {share.active ? (
        <>
          <p className="small">{tr('Estás compartiendo tus datos con el equipo QLC desde el {date}: pueden ver toda la información que registraste en la plataforma para orientarte mejor.', { date: dateTime(share.active.grantedAt) })}</p>
          {canModify
            ? <p className="small">{tr('También autorizaste al equipo QLC a modificar tus datos desde el {date}: puede escribir en tu panel como si fueras tú para enseñarte a usar las herramientas.', { date: dateTime(share.active.editGrantedAt) })}</p>
            : <p className="small">{tr('Por ahora solo pueden ver tus datos. Si quieres que tu asesor te enseñe directamente en tu panel, autoriza que los modifique.')}</p>}
          <p className="small muted">{tr('El acceso termina cuando tú pulses «Dejar de compartir mis datos» o cuando tu asesor lo cierre.')}</p>
          <div className="form-actions">
            {canModify
              ? <Button variant="secondary" loading={share.busy} onClick={share.revokeEdit}>{tr('Quitar permiso de modificar')}</Button>
              : <Button onClick={() => setConfirmEdit(true)}>{tr('Autorizar modificar mis datos')}</Button>}
            <Button variant="danger" loading={share.busy} onClick={share.stop}>{tr('Dejar de compartir mis datos')}</Button>
          </div>
        </>
      ) : (
        <>
          <p className="small">{tr('Si necesitas orientación, puedes autorizar que el equipo QLC vea toda la información que registraste: inicio, portafolio, ingresos y gastos, deudas, protección, academia y reportes.')}</p>
          <p className="small muted">{tr('Nadie puede ver tus datos sin tu autorización. El acceso es temporal: dura hasta que tú dejes de compartir o tu asesor lo cierre.')}</p>
          <div className="form-actions">
            <Button onClick={() => setConfirm(true)}>{tr('Compartir mis datos')}</Button>
            <Button variant="secondary" onClick={() => setConfirmEdit(true)}>{tr('Autorizar modificar mis datos')}</Button>
          </div>
        </>
      )}
      <FormError error={share.error} />
      <ConfirmDialog
        open={confirm}
        title={tr('Compartir mis datos')}
        message={tr('El equipo QLC podrá ver toda la información que registraste en la plataforma hasta que tú dejes de compartirla o tu asesor cierre el acceso. ¿Deseas continuar?')}
        loading={share.busy}
        onConfirm={async () => { if (await share.start()) setConfirm(false); }}
        onClose={() => setConfirm(false)}
      />
      <ConfirmDialog
        open={confirmEdit}
        title={tr('Autorizar modificar mis datos')}
        message={tr('El equipo QLC podrá ver y modificar toda tu información, escribiendo en tu panel como si fueras tú, para enseñarte a usar las herramientas. Puedes quitar este permiso en cualquier momento. ¿Deseas continuar?')}
        loading={share.busy}
        onConfirm={async () => { if (await share.allowEdit()) setConfirmEdit(false); }}
        onClose={() => setConfirmEdit(false)}
      />
    </Card>
  );
}

export function DataShareBanner() {
  const share = useDataShare();
  if (!share.active) return null;
  return (
    <div className="admin-banner share-banner">
      <span>{share.active.allowEdit
        ? tr('Tu asesor QLC puede ver y modificar tus datos desde el {date}', { date: dateTime(share.active.editGrantedAt) })
        : tr('Estás compartiendo tus datos con tu asesor QLC desde el {date}', { date: dateTime(share.active.grantedAt) })}</span>
      {share.active.allowEdit && <Button variant="secondary" loading={share.busy} onClick={share.revokeEdit}>{tr('Quitar permiso de modificar')}</Button>}
      <Button variant="secondary" loading={share.busy} onClick={share.stop}>{tr('Dejar de compartir mis datos')}</Button>
      <ShareChat key={share.active.id} />
    </div>
  );
}

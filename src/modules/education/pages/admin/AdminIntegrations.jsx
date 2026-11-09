import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { tr } from '../../i18n/tr.js';
import { MailSettings } from '../../features/admin/MailSettings.jsx';
import { DriveSettings } from '../../features/admin/DriveSettings.jsx';

export default function AdminIntegrations() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const res = useAsync(() => api.get('/admin/integrations'), []);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected || error) {
      setFlash(connected ? { ok: true, text: connected === 'DRIVE' ? 'Google Drive conectado correctamente. Pulsa Probar conexión para confirmarlo.' : 'Gmail conectado correctamente.' } : { ok: false, text: error });
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  return (
    <>
      <PageHeader kicker={tr('Sistema')} title={tr('Integraciones')} subtitle={tr('Conexiones OAuth 2.0 administradas por el servidor. Los tokens se guardan cifrados y nunca llegan al navegador.')} />
      {flash && <Notice variant={flash.ok ? '' : 'gold'}>{tr(flash.text)}</Notice>}
      <AsyncView {...res} onRetry={res.reload}>
        {(d) => (
          <>
            <MailSettings canManage={user?.adminLevel === 'FULL'} onChanged={res.reload} />
            {user?.adminLevel === 'FULL' && <DriveSettings canManage onChanged={res.reload} />}
            <Card title={tr('Últimos correos del sistema')}>
              <DataTable rows={d.emails} empty={tr('Sin envíos registrados.')} columns={[
                { key: 'createdAt', label: tr('Fecha'), render: (e) => dateTime(e.createdAt) },
                { key: 'to', label: tr('Destinatario') },
                { key: 'subject', label: tr('Asunto') },
                { key: 'status', label: tr('Estado'), render: (e) => <Pill variant={e.status === 'SENT' ? '' : 'bad'}>{e.status === 'SENT' ? tr('Enviado') : tr('Fallido')}</Pill> },
                { key: 'error', label: tr('Detalle'), render: (e) => e.error || '—' },
              ]} />
            </Card>
          </>
        )}
      </AsyncView>
    </>
  );
}

import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime } from '../../utils/format.js';
import { Card, PageHeader } from '../../components/ui/Card.jsx';
import { Field, FormError, Input } from '../../components/ui/Form.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { NoticeBody } from '../../features/notice/LoginNotice.jsx';
import { NOTICE_TEXT } from '../../features/notice/noticeContent.js';
import { tr } from '../../i18n/tr.js';

const METRICS = [
  ['returnPct', 'Retorno sobre inversión (ROI, %)', '0.01'],
  ['days', 'Días del periodo', '1'],
  ['wins', 'Operaciones ganadas', '1'],
  ['losses', 'Operaciones perdidas', '1'],
  ['hitRate', 'Tasa de aciertos (%)', '0.01'],
  ['drawdown', 'Drawdown máximo (%)', '0.01'],
];

const toForm = (n) => ({
  active: n.active,
  metrics: Object.fromEntries(METRICS.map(([k]) => [k, String(n.metrics[k] ?? '')])),
  bitgetUrl: n.bitgetUrl || '',
  infoUrl: n.infoUrl || '',
});

const toBody = (f) => ({ ...f, metrics: Object.fromEntries(METRICS.map(([k]) => [k, Number(f.metrics[k] || 0)])) });

function NoticeEditor({ notice, onSaved }) {
  const [f, setF] = useState(() => toForm(notice));
  const [state, setState] = useState({ busy: false, error: null, saved: false });
  const setMetric = (k) => (e) => setF({ ...f, metrics: { ...f.metrics, [k]: e.target.value } });
  const save = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null, saved: false });
    try {
      await api.put('/admin/login-notice', toBody(f));
      setState({ busy: false, error: null, saved: true });
      onSaved();
    } catch (error) {
      setState({ busy: false, error, saved: false });
    }
  };
  return (
    <div className="layout">
      <Card title={tr('Parámetros del aviso')}>
        <form className="stack" onSubmit={save}>
          <label className="check">
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
            <span>{tr('Mostrar el aviso cada vez que un cliente inicia sesión')}</span>
          </label>
          <div className="form-grid cols-2">
            {METRICS.map(([k, label, step]) => (
              <Field key={k} label={tr(label)}><Input type="number" inputMode="decimal" step={step} min={k === 'returnPct' ? undefined : 0} required value={f.metrics[k]} onChange={setMetric(k)} /></Field>
            ))}
          </div>
          <Field label={tr('Enlace al perfil Trader Elite de Bitget')} hint={tr('Opcional. Si lo dejas vacío no se muestra el botón.')}>
            <Input type="url" value={f.bitgetUrl} onChange={(e) => setF({ ...f, bitgetUrl: e.target.value })} placeholder="https://www.bitget.com/…" />
          </Field>
          <Field label={tr('Enlace para solicitar información')}>
            <Input type="url" value={f.infoUrl} onChange={(e) => setF({ ...f, infoUrl: e.target.value })} placeholder="https://www.qlctrade.net/" />
          </Field>
          <FormError error={state.error} />
          {state.saved && <p className="small up">{tr('Aviso actualizado. Los clientes lo verán en su próximo inicio de sesión.')}</p>}
          <div className="form-actions"><Button type="submit" loading={state.busy}>{tr('Guardar aviso')}</Button></div>
          {notice.updatedAt && <p className="small muted">{tr('Última actualización: {date}', { date: dateTime(notice.updatedAt) })}</p>}
        </form>
      </Card>
      <Card title={tr('Vista previa')}>
        <h3 className="section-title">{NOTICE_TEXT.es.title}</h3>
        <NoticeBody notice={toBody(f)} text={NOTICE_TEXT.es} />
      </Card>
    </div>
  );
}

export default function AdminLoginNotice() {
  const res = useAsync(() => api.get('/admin/login-notice'), []);
  return (
    <>
      <PageHeader title={tr('Aviso de QLC Quantitative Trading Bot')} subtitle={tr('Mensaje que ve cada cliente al iniciar sesión. Edita las métricas y los enlaces.')} />
      <AsyncView {...res} onRetry={res.reload}>
        {(notice) => <NoticeEditor notice={notice} onSaved={res.reload} />}
      </AsyncView>
    </>
  );
}

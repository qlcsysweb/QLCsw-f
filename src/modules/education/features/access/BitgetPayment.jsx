import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, priceMoney } from '../../utils/format.js';
import { Card, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Input } from '../../components/ui/Form.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { tr } from '../../i18n/tr.js';

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

export const REPORT_VARIANT = { PENDING: 'warn', REVIEW: 'warn', CONFIRMED: '', REJECTED: 'bad' };

const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function openEvidence(path) {
  const win = window.open('', '_blank');
  return api.blobUrl(path).then((url) => {
    if (win) win.location.href = url;
    else window.location.href = url;
  }).catch((err) => {
    if (win) win.close();
    window.alert(err.message);
  });
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return <Button variant="secondary" onClick={copy}>{copied ? tr('Copiado') : tr('Copiar')}</Button>;
}

export function BitgetInstructions({ uid, instructions, wallet, amount, currency }) {
  return (
    <div className="stack">
      <h4>{tr('Transferencia en USDT')}</h4>
      <div className="checkout-amount">
        <span>{tr('Monto a transferir')}</span>
        <strong>{amount === null || amount === undefined ? '—' : `${priceMoney(amount)} ${currency}`}</strong>
      </div>
      {uid && (
        <div className="inline-form">
          <Field label={tr('Transferencia interna Bitget: UID de QLC (sin comisión)')}><Input readOnly value={uid} /></Field>
          <CopyButton value={uid} />
        </div>
      )}
      {wallet && (
        <div className="wallet-box">
          <img className="wallet-qr" src={wallet.qr} alt={tr('Código QR de la dirección de USDT')} width="132" height="132" />
          <div className="wallet-info">
            <span className="small muted">{tr('Dirección de USDT · Red {network}', { network: wallet.network })}</span>
            <code className="wallet-address">{wallet.address}</code>
            <CopyButton value={wallet.address} />
            <p className="small down">{tr('Envía solo USDT por la red {network}. Si usas otra red, los fondos se pueden perder.', { network: wallet.network })}</p>
          </div>
        </div>
      )}
      {instructions && <p className="small muted" style={{ whiteSpace: 'pre-line' }}>{instructions}</p>}
      <ol className="small">
        <li>{tr('Envía los USDT por una de las opciones de arriba. Debe llegar el monto completo.')}</li>
        <li>{tr('Guarda el N.º de orden de Bitget o el hash de la transacción.')}</li>
        <li>{tr('Llena abajo «Confirma tu transferencia» con ese dato, la fecha y hora, y tu evidencia.')}</li>
      </ol>
    </div>
  );
}

export function BitgetReportForm({ attemptId, report, onDone, onCancel }) {
  const [f, setF] = useState({ orderNumber: report?.orderNumber || '', transferredAt: report ? toLocalInput(report.transferredAt) : '' });
  const [files, setFiles] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [state, setState] = useState({ busy: false, error: null });
  const kept = (report?.files || []).filter((file) => !removed.includes(file.id));
  const total = kept.length + files.length;

  const addFiles = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    const tooBig = picked.find((file) => file.size > MAX_BYTES);
    if (tooBig) return setState({ busy: false, error: new Error(tr('El archivo «{name}» pesa más de 5 MB.', { name: tooBig.name })) });
    if (total + picked.length > MAX_FILES) return setState({ busy: false, error: new Error(tr('Puedes adjuntar como máximo 5 archivos.')) });
    setState({ busy: false, error: null });
    return setFiles([...files, ...picked]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null });
    try {
      const form = new FormData();
      form.append('orderNumber', f.orderNumber.trim());
      form.append('transferredAt', new Date(f.transferredAt).toISOString());
      removed.forEach((id) => form.append('removeFileIds', id));
      files.forEach((file) => form.append('files', file));
      const res = report
        ? await api.upload(`/payments/bitget/reports/${report.id}`, form, 'PUT')
        : await api.upload(`/payments/attempts/${attemptId}/bitget-report`, form);
      onDone(res);
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <h4>{tr('Confirma tu transferencia')}</h4>
      <div className="form-grid cols-2">
        <Field label={tr('N.º de orden o hash de la transacción')}><Input required maxLength={128} autoComplete="off" value={f.orderNumber} onChange={(e) => setF({ ...f, orderNumber: e.target.value })} /></Field>
        <Field label={tr('Fecha y hora de la transferencia')}><Input required type="datetime-local" value={f.transferredAt} onChange={(e) => setF({ ...f, transferredAt: e.target.value })} /></Field>
      </div>
      <Field label={tr('Evidencia')} hint={tr('De 1 a 5 archivos JPG, PNG, WEBP o PDF, de máximo 5 MB cada uno.')}>
        <Input type="file" accept={ACCEPT} multiple disabled={total >= MAX_FILES} onChange={addFiles} />
      </Field>
      {total > 0 && (
        <ul className="small">
          {kept.map((file) => <li key={file.id}>{file.name} <button type="button" className="btn-link" onClick={() => setRemoved([...removed, file.id])}>{tr('Quitar')}</button></li>)}
          {files.map((file, i) => <li key={`${file.name}-${i}`}>{file.name} <button type="button" className="btn-link" onClick={() => setFiles(files.filter((_, n) => n !== i))}>{tr('Quitar')}</button></li>)}
        </ul>
      )}
      <FormError error={state.error} />
      <div className="form-actions">
        {onCancel && <Button variant="secondary" onClick={onCancel}>{tr('Cancelar')}</Button>}
        <Button type="submit" loading={state.busy} disabled={total < 1}>{report ? tr('Enviar corrección') : tr('Enviar')}</Button>
      </div>
    </form>
  );
}

export function BitgetReportsCard() {
  const res = useAsync(() => api.get('/payments/bitget'), []);
  const [fixing, setFixing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState(null);
  const data = res.data;
  if (!data || (!data.reports.length && !data.pending.length)) return null;

  const hide = async (report) => {
    if (!window.confirm(tr('¿Borrar este reporte de tu historial? El registro se conserva en QLC.'))) return;
    try {
      await api.post(`/payments/bitget/reports/${report.id}/hide`, {});
      res.reload();
    } catch (err) {
      setError(err);
    }
  };

  const done = () => {
    setFixing(null);
    setPaying(null);
    res.reload();
  };

  return (
    <Card title={tr('Transferencias Bitget')}>
      <div className="stack">
        {data.pending.map((a) => (
          <div key={a.id} className="inline-form">
            <p className="small">{tr('Pago pendiente de reportar: {name} · {amount}', { name: tr(a.product), amount: `${priceMoney(a.amount)} ${a.currency}` })}</p>
            <Button variant="secondary" onClick={() => setPaying(a)}>{tr('Reportar transferencia')}</Button>
          </div>
        ))}
        {data.reports.map((r) => (
          <article key={r.id} className="stack">
            <div className="mail-status">
              <Pill variant={REPORT_VARIANT[r.status]}>{tr(r.statusLabel)}</Pill>
              <b>{tr(r.attempt?.product || '')}</b>
              <span className="small muted">{`${priceMoney(r.attempt?.amount)} ${r.attempt?.currency || ''}`}</span>
            </div>
            <p className="small muted">{tr('Comprobante {order} · {date}', { order: r.orderNumber, date: dateTime(r.transferredAt) })}</p>
            {r.status === 'REJECTED' && <p className="small down">{r.rejectReason ? tr('Motivo: {reason}', { reason: r.rejectReason }) : tr('Tu reporte fue rechazado. Corrígelo para enviarlo de nuevo.')}</p>}
            {r.status === 'REVIEW' && <p className="small muted">{tr('Identificamos tu transferencia. Tu pago sigue en revisión.')}</p>}
            <div className="form-actions">
              {r.files.map((file) => <button key={file.id} type="button" className="btn-link" onClick={() => openEvidence(`/payments/bitget/files/${file.id}`)}>{file.name}</button>)}
              {['PENDING', 'REJECTED'].includes(r.status) && <Button variant="secondary" onClick={() => setFixing(r)}>{tr('Corregir reporte')}</Button>}
              {['CONFIRMED', 'REJECTED'].includes(r.status) && <Button variant="secondary" onClick={() => hide(r)}>{tr('Borrar del historial')}</Button>}
            </div>
          </article>
        ))}
        <FormError error={error} />
      </div>
      <Modal open={!!fixing} title={tr('Corregir reporte')} onClose={() => setFixing(null)}>
        {fixing && <BitgetReportForm report={fixing} onDone={done} onCancel={() => setFixing(null)} />}
      </Modal>
      <Modal open={!!paying} title={tr('Reportar transferencia')} onClose={() => setPaying(null)}>
        {paying && (
          <div className="stack">
            <BitgetInstructions uid={data.info?.uid} instructions={data.info?.instructions} wallet={data.info?.wallet} amount={paying.amount} currency={paying.currency} />
            <BitgetReportForm attemptId={paying.id} onDone={done} onCancel={() => setPaying(null)} />
          </div>
        )}
      </Modal>
    </Card>
  );
}

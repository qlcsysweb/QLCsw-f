import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { dateTime, priceMoney } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

// Ficha de pago en efectivo en OXXO generada por Mercado Pago.
export function OxxoTicket({ oxxo, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(oxxo.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="oxxo-ticket">
      <div className="oxxo-head">
        <span className="oxxo-badge">OXXO</span>
        <div>
          <h4>{tr('Paga en efectivo en cualquier OXXO')}</h4>
          <p className="muted small">{tr('Monto a pagar: {amount}', { amount: `${priceMoney(oxxo.amount)} ${oxxo.currency}` })}</p>
        </div>
      </div>
      {oxxo.qr && (
        <figure className="oxxo-qr">
          <img src={oxxo.qr} alt={tr('Código QR de la ficha de pago')} width="200" height="200" />
          <figcaption className="small muted">{tr('Escanéalo con tu celular para llevar la ficha de pago contigo a la tienda.')}</figcaption>
        </figure>
      )}
      {oxxo.reference && (
        <div className="oxxo-reference">
          <span className="small muted">{tr('También puedes dictar este número en caja:')}</span>
          <div className="oxxo-number">
            <b>{oxxo.reference.replace(/(\d{4})(?=\d)/g, '$1 ')}</b>
            <Button variant="secondary" onClick={copy}>{copied ? tr('Copiado') : tr('Copiar')}</Button>
          </div>
        </div>
      )}
      <ol className="small oxxo-steps">
        <li>{tr('Acude a cualquier tienda OXXO y di que quieres hacer un pago de Mercado Pago.')}</li>
        <li>{tr('Muestra la ficha o dicta el número de referencia y paga el monto exacto en efectivo.')}</li>
        <li>{tr('Tu acceso se activa en cuanto Mercado Pago confirma el pago; te avisaremos en Notificaciones.')}</li>
      </ol>
      {oxxo.expiresAt && <p className="small muted">{tr('La ficha vence el {date}.', { date: dateTime(oxxo.expiresAt) })}</p>}
      <div className="form-actions">
        {oxxo.ticketUrl && <a className="btn-secondary" href={oxxo.ticketUrl} target="_blank" rel="noopener noreferrer">{tr('Ver ficha de pago')}</a>}
        <Button onClick={onClose}>{tr('Entendido')}</Button>
      </div>
    </div>
  );
}

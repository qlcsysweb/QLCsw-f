import { useState } from 'react';
import { date } from '../../utils/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { tr } from '../../i18n/tr.js';

export const redeemUrl = (code) => `${window.location.origin}/regalo?codigo=${encodeURIComponent(code)}`;

export function GiftCardVisual({ gift }) {
  return (
    <div className="gift-card">
      <div className="gift-card-top">
        <span className="gift-card-brand">QLC · Gift Access</span>
        <span className="gift-card-badge">🎁</span>
      </div>
      <h3>{tr('¡Tienes un regalo de QLC!')}</h3>
      {gift.recipientName && <p className="gift-card-to">{tr('Para')} <b>{gift.recipientName}</b></p>}
      <p className="gift-card-product">{tr(gift.product)}{gift.duration ? ` · ${tr(gift.duration)}` : ''}</p>
      {gift.message && <blockquote className="gift-card-message">“{gift.message}”</blockquote>}
      <div className="gift-card-code">
        <span>{tr('Código de acceso de regalo')}</span>
        <strong>{gift.code}</strong>
      </div>
      <p className="gift-card-foot">{gift.redeemBy
        ? tr('Actívalo en {url} antes del {date}. No necesitas pagar nada.', { url: `${window.location.host}/regalo`, date: date(gift.redeemBy) })
        : tr('Actívalo en {url}. No necesitas pagar nada.', { url: `${window.location.host}/regalo` })}</p>
    </div>
  );
}

export function GiftCardModal({ gift, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = tr('¡Tienes un regalo de QLC! {product}. Actívalo con el código {code} en {url}', { product: gift.product, code: gift.code, url: redeemUrl(gift.code) });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Modal open title={tr('Tarjeta de regalo digital')} onClose={onClose} className="gift-modal"
      footer={(
        <div className="row-actions">
          <Button variant="secondary" onClick={copy}>{copied ? tr('Copiado') : tr('Copiar mensaje')}</Button>
          <a className="btn-secondary" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="btn-secondary" href={`mailto:?subject=${encodeURIComponent(tr('Un regalo de QLC para ti'))}&body=${encodeURIComponent(text)}`}>{tr('Correo')}</a>
          <Button onClick={() => window.print()}>{tr('Descargar / imprimir')}</Button>
        </div>
      )}>
      <div className="gift-print">
        <GiftCardVisual gift={gift} />
      </div>
    </Modal>
  );
}

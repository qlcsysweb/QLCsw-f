import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { date } from '../../utils/format.js';
import { Card, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Field, FormError, Input } from '../../components/ui/Form.jsx';
import { CheckoutModal, offerPrice } from '../access/CheckoutModal.jsx';
import { GiftCardModal } from './GiftCard.jsx';
import { tr } from '../../i18n/tr.js';

const GIFT_STATUS = { DISPONIBLE: ['Disponible', ''], ACTIVADO: ['Activado', 'info'], VENCIDO: ['Vencido', 'warn'], CANCELADO: ['Cancelado', 'bad'] };

export const giftPill = (status) => {
  const [label, variant] = GIFT_STATUS[status] || [status, 'muted'];
  return <Pill variant={variant}>{tr(label)}</Pill>;
};

export function SubscriptionCard() {
  const { accessInfo, access, refreshAccess } = useAuth();
  const sub = accessInfo?.subscription;
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState({ busy: false, error: null });
  if (!sub) return null;
  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      await fn();
      await refreshAccess();
      setState({ busy: false, error: null });
      setConfirm(false);
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  const until = access.full?.expiresAt || access.toolAccess?.reduce((max, t) => (t.expiresAt && (!max || t.expiresAt > max) ? t.expiresAt : max), null);
  return (
    <Card title={tr('Mi suscripción')} actions={sub.cancelledAt ? <Pill variant="warn">{tr('Cancelada')}</Pill> : access.hasAny ? <Pill>{tr('Activa')}</Pill> : <Pill variant="muted">{tr('Sin acceso activo')}</Pill>}>
      {sub.cancelledAt ? (
        <p className="small">{access.hasAny
          ? tr('Cancelaste tu suscripción el {date}. Conservas tu acceso hasta el {until}; después no se renovará.', { date: date(sub.cancelledAt), until: until ? date(until) : '—' })
          : tr('Cancelaste tu suscripción el {date}. Tus datos se conservan y puedes regresar cuando quieras.', { date: date(sub.cancelledAt) })}</p>
      ) : (
        <p className="small">{access.hasAny ? tr('Tu suscripción está activa{until}.', { until: until ? tr(' hasta el {date}', { date: date(until) }) : '' }) : tr('Aún no tienes un acceso activo.')}</p>
      )}
      {sub.billing && (
        <p className="small">{tr('{name}: cobro automático de {amount} cada {period} con {provider}.', { name: tr(sub.billing.offerName || ''), amount: `${priceMoney(sub.billing.amount)} ${sub.billing.currency}`, period: tr(sub.billing.cycle === 'YEARLY' ? 'año' : 'mes'), provider: tr(sub.billing.provider === 'PAYPAL' ? 'PayPal' : 'tarjeta') })}{sub.billing.nextBillingAt ? ` ${tr('Próximo cobro: {date}.', { date: date(sub.billing.nextBillingAt) })}` : ''}</p>
      )}
      <div className="row-actions">
        {sub.cancelledAt && !sub.billing
          ? sub.canResume !== false && <Button loading={state.busy} onClick={() => run(() => api.post('/payments/subscription/resume'))}>{tr('Reactivar mi suscripción')}</Button>
          : (access.hasAny || sub.billing) && <Button variant="secondary" onClick={() => setConfirm(true)}>{tr('Cancelar mi suscripción')}</Button>}
      </div>
      <label className="check">
        <input type="checkbox" checked={!sub.marketingOptOut} disabled={state.busy} onChange={(e) => run(() => api.put('/payments/preferences', { marketingOptOut: !e.target.checked }))} />
        {tr('Quiero recibir promociones y beneficios de QLC por correo')}
      </label>
      <FormError error={state.error} />
      <ConfirmDialog
        open={confirm}
        title={tr('Cancelar mi suscripción')}
        message={tr('Ya no se te cobrará de nuevo. Conservarás tu acceso hasta su fecha de vencimiento y tus datos no se borran. ¿Deseas cancelar?')}
        danger
        loading={state.busy}
        onConfirm={() => run(() => api.post('/payments/subscription/cancel'))}
        onClose={() => setConfirm(false)}
      />
    </Card>
  );
}

export function PromoCodeCard() {
  const [code, setCode] = useState('');
  const [promo, setPromo] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('promo');
    if (fromUrl) setCode(fromUrl);
  }, []);
  const check = async (e) => {
    e?.preventDefault();
    setState({ busy: true, error: null });
    try {
      setPromo(await api.post('/payments/promo/check', { code }));
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Card id="promocion" title={tr('¿Tienes un código promocional?')}>
      <form className="inline-form" onSubmit={check}>
        <Field label={tr('Código promocional')}><Input value={code} maxLength={40} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PROMO-XXXX-XXXX" /></Field>
        <Button type="submit" loading={state.busy} disabled={code.trim().length < 4}>{tr('Aplicar código')}</Button>
      </form>
      <FormError error={state.error} />
      {promo && (
        <CheckoutModal promo={promo} offer={promo.offer} onClose={() => setPromo(null)} />
      )}
    </Card>
  );
}

export function GiftShop() {
  const { accessInfo } = useAuth();
  const [selected, setSelected] = useState(null);
  const offers = (accessInfo?.offers || []).filter((o) => o.giftable !== false);
  if (!offers.length) return null;
  return (
    <Card id="regalar" title={tr('Regalar acceso')} actions={<Pill>QLC Gift Access</Pill>}>
      <p className="small">{tr('Regala conocimiento financiero: compra un acceso y recibe un código único para compartir. Quien lo recibe lo activa en su cuenta sin pagar nada, y su periodo empieza el día que lo activa.')}</p>
      <div className="gift-shop">
        {offers.map((o) => (
          <div key={o.code} className="gift-offer">
            <b>{tr(o.name)}</b>
            <span className="small muted">{o.description ? tr(o.description) : ''}</span>
            <span className="gift-offer-price">{offerPrice(o)}</span>
            <Button variant="secondary" onClick={() => setSelected(o)}>{tr('Regalar')}</Button>
          </div>
        ))}
      </div>
      {selected && <CheckoutModal offer={selected} mode="gift" onClose={() => setSelected(null)} />}
    </Card>
  );
}

export function MyGifts() {
  const { accessInfo } = useAuth();
  const gifts = useAsync(() => api.get('/gifts/mine'), [accessInfo]);
  const [card, setCard] = useState(null);
  if (!gifts.data?.length) return null;
  return (
    <Card title={tr('Mis regalos')}>
      <DataTable
        rows={gifts.data}
        columns={[
          { key: 'code', label: tr('Código'), render: (g) => <b className="mono">{g.code}</b> },
          { key: 'product', label: tr('Producto'), render: (g) => `${tr(g.product)} · ${tr(g.duration)}` },
          { key: 'createdAt', label: tr('Compra'), render: (g) => date(g.createdAt) },
          { key: 'redeemBy', label: tr('Canjear antes del'), render: (g) => date(g.redeemBy) },
          { key: 'status', label: tr('Estado'), render: (g) => <>{giftPill(g.status)}{g.recipient ? <span className="small block">{g.recipient.name}</span> : null}</> },
          { key: 'x', label: '', align: 'right', render: (g) => g.status === 'DISPONIBLE' && <button type="button" className="btn-link" onClick={() => setCard(g)}>{tr('Ver tarjeta y compartir')}</button> },
        ]}
      />
      {card && <GiftCardModal gift={card} onClose={() => setCard(null)} />}
    </Card>
  );
}

export function RedeemBox({ initialCode = '', onRedeemed }) {
  const { user, refreshAccess } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState(initialCode);
  const [preview, setPreview] = useState(null);
  const [done, setDone] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });
  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      await fn();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  const look = (e) => {
    e?.preventDefault();
    run(async () => setPreview(await api.get(`/public/gifts/${encodeURIComponent(code.trim())}`)));
  };
  useEffect(() => {
    if (initialCode) look();
  }, []);
  const redeem = () => run(async () => {
    const res = await api.post('/gifts/redeem', { code: preview.code });
    setDone(res);
    await refreshAccess();
    onRedeemed?.(res);
  });
  const next = `/regalo?codigo=${encodeURIComponent(preview?.code || code)}`;
  if (done) {
    return (
      <div className="gift-done">
        <h3>{tr('¡Tu regalo está activo!')}</h3>
        <p>{tr('Ya tienes acceso a {product} hasta el {date}.', { product: done.product, date: date(done.expiresAt) })}</p>
        <Button onClick={() => navigate('/app')}>{tr('Entrar a mi plataforma')}</Button>
      </div>
    );
  }
  return (
    <div className="redeem-box">
      <form className="inline-form" onSubmit={look}>
        <Field label={tr('Código de acceso de regalo')}><Input value={code} maxLength={40} onChange={(e) => { setCode(e.target.value.toUpperCase()); setPreview(null); }} placeholder="QLC-XXXX-XXXX" /></Field>
        <Button type="submit" variant="secondary" loading={state.busy && !preview} disabled={code.trim().length < 6}>{tr('Revisar código')}</Button>
      </form>
      {preview && (
        <div className="redeem-preview">
          <span className="checkout-kicker">{tr('Recibiste')}</span>
          <b>{tr(preview.product)} · {tr(preview.duration)}</b>
          {preview.recipientName && <span>{tr('Para')} {preview.recipientName}</span>}
          {preview.message && <blockquote className="gift-card-message">“{preview.message}”</blockquote>}
          {preview.status === 'DISPONIBLE' ? (
            user?.role === 'CLIENT' ? (
              <Button loading={state.busy} onClick={redeem}>{tr('Activar mi regalo')}</Button>
            ) : user ? (
              <p className="small muted">{tr('Los regalos se activan desde una cuenta de cliente.')}</p>
            ) : (
              <>
                <p className="small">{tr('¿Ya tienes una cuenta? Inicia sesión o crea una cuenta gratuita para activar tu regalo.')}</p>
                <div className="row-actions">
                  <Link className="btn-primary" to="/login" state={{ from: next }}>{tr('Iniciar sesión')}</Link>
                  <Link className="btn-secondary" to="/registro" state={{ from: next }}>{tr('Crear cuenta gratuita')}</Link>
                </div>
              </>
            )
          ) : (
            <p className="small">{giftPill(preview.status)} {preview.status === 'ACTIVADO' ? tr('Este código ya fue utilizado.') : preview.status === 'VENCIDO' ? tr('Este código ya venció.') : tr('Este código fue cancelado.')}</p>
          )}
        </div>
      )}
      <FormError error={state.error} />
    </div>
  );
}

export function RedeemCard() {
  return (
    <Card id="canjear" title={tr('Canjear código de regalo')}>
      <RedeemBox />
    </Card>
  );
}

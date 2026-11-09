import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, FormError, Input, Textarea } from '../../components/ui/Form.jsx';
import { date, priceMoney } from '../../utils/format.js';
import { GiftCardModal } from '../gifts/GiftCard.jsx';
import { BitgetInstructions, BitgetReportForm } from './BitgetPayment.jsx';
import { COUNTRIES } from '../../shared/countries.js';
import { getLanguage, tr } from '../../i18n/tr.js';

const METHODS = [
  { value: 'CARD', label: 'Tarjeta', hint: 'Débito o crédito' },
  { value: 'TRANSFER', label: 'Transferencia', hint: 'Pago bancario' },
];

export const offerPrice = (offer) =>
  offer?.price === null || offer?.price === undefined ? tr('Precio por definir') : `${priceMoney(offer.price)} ${offer.currency}`;

const durationText = (offer) => {
  const days = offer.accessDays || (offer.type === 'FULL_ANNUAL' ? 365 : 30);
  return days >= 365 ? tr('Anual') : days >= 28 && days <= 31 ? tr('Mensual') : tr('{n} días', { n: days });
};

export const isService = (offer) => offer?.type === 'CONSULTA' || offer?.type === 'ORIENTACION';

const kickerOf = (offer) => {
  if (offer.type === 'MASTERCLASS') return offer.moduleNumber ? tr('Masterclass · Módulo {n}', { n: offer.moduleNumber }) : tr('Masterclass');
  if (offer.type === 'CONSULTA') return tr('Consulta sobre ejercicios');
  if (offer.type === 'ORIENTACION') return tr('Orientación personalizada · 20 minutos');
  if (offer.type === 'FULL_ANNUAL') return tr('Membresía anual');
  return offer.moduleNumber ? tr('Herramienta · Módulo {n}', { n: offer.moduleNumber }) : tr('Herramientas M1–M12');
};

const chargePreview = (total, currency, charge) => {
  if (!charge || total === null || total === undefined) return null;
  const source = String(currency).toUpperCase();
  if (source === charge.currency) return null;
  const rate = Number(charge.rates?.[source]);
  if (!(rate > 0)) return null;
  const value = Number(total) * rate;
  return `${priceMoney(charge.whole ? Math.ceil(value) : Math.round(value * 100) / 100)} ${charge.currency}`;
};

const GATEWAYS = {
  MERCADOPAGO: { label: 'Mercado Pago', hint: 'Pagas en la página de Mercado Pago' },
  BITGET: { label: 'Transferencia en USDT', hint: 'Por UID de Bitget o a una wallet' },
};

const periodLabel = (cycle) => tr(cycle === 'YEARLY' ? 'año' : 'mes');

function Summary({ offer, method, setMethod, gift, setGift, promo, quantity, setQuantity, charge, gateways, gateway, setGateway, simulated }) {
  const recurring = gateway === 'MERCADOPAGO' && !gift && !promo ? offer.billingCycle : null;
  const unit = offer.price === null || offer.price === undefined ? null : Number(offer.price);
  const total = promo ? promo.finalPrice : unit === null ? null : unit * (gift ? Number(gift.quantity || 1) : isService(offer) ? Number(quantity || 1) : 1);
  return (
    <div className="checkout-summary">
      <div className="checkout-product">
        <span className="checkout-kicker">{gift ? tr('Regalo · {duration}', { duration: durationText(offer) }) : promo ? tr('Promoción personalizada') : kickerOf(offer)}</span>
        <b>{tr(offer.name)}</b>
        {offer.description && <p>{tr(offer.description)}</p>}
      </div>
      {gift && (
        <div className="checkout-gift">
          <Field label={tr('Número de accesos a regalar')} hint={tr('Se genera un código único por cada acceso.')}>
            <Input type="number" min="1" max="20" value={gift.quantity} onChange={(e) => setGift({ ...gift, quantity: e.target.value })} />
          </Field>
          <Field label={tr('Nombre de quien recibe (opcional)')}><Input maxLength={120} value={gift.recipientName} onChange={(e) => setGift({ ...gift, recipientName: e.target.value })} /></Field>
          <Field label={tr('Mensaje para la tarjeta (opcional)')}><Textarea maxLength={500} rows={3} value={gift.message} onChange={(e) => setGift({ ...gift, message: e.target.value })} /></Field>
        </div>
      )}
      {!gift && !promo && isService(offer) && (
        <Field label={offer.type === 'CONSULTA' ? tr('Número de consultas') : tr('Número de sesiones de 20 minutos')}>
          <Input type="number" min="1" max="20" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
      )}
      <div className="checkout-amount">
        <span>{tr('Total')}</span>
        {promo && unit !== null && <small className="checkout-strike">{priceMoney(unit)} {offer.currency} · −{promo.discountPercent}%</small>}
        <strong>{total === null ? tr('Precio por definir — simulación de acceso') : `${priceMoney(total)} ${offer.currency}`}</strong>
        {chargePreview(total, offer.currency, charge) && <small><b>{tr(recurring ? 'Se cobrará cada ' + (recurring === 'YEARLY' ? 'año' : 'mes') + ': {amount}' : 'Se cobrará: {amount}', { amount: chargePreview(total, offer.currency, charge) })}</b></small>}
        {gift && <small>{tr('El periodo empieza cuando la persona active su regalo, no hoy.')}</small>}
        {promo && <small>{tr('Tu acceso se activará cuando el equipo de QLC autorice el pago.')}</small>}
        {gateway === 'BITGET' && !gift && !promo && offer.billingCycle && <small><b>{tr('Este pago no se renueva solo: te avisaremos por correo antes de que venza.')}</b></small>}
        {recurring && <small><b>{tr('Suscripción con cobro automático cada {period} hasta que canceles en Mi acceso.', { period: periodLabel(recurring) })}</b></small>}
        {!gift && !promo && !recurring && offer.type === 'FULL_ANNUAL' && <small>{tr('Vigencia de')}{' '}{offer.accessDays || 365}{' '}{tr('días')}</small>}
        {!recurring && !gift && !promo && offer.type === 'TOOL_ONLY' && <small>{offer.accessDays || 30}{' '}{tr('días de acceso por pago. Al terminar se bloquea y puedes renovar.')}</small>}
        {!gift && !promo && offer.type === 'MASTERCLASS' && <small>{offer.accessDays || 30}{' '}{tr('días de acceso a este módulo. Tu avance se conserva.')}</small>}
        {!gift && !promo && offer.sessions > 0 && <small>{tr('Incluye {n} sesiones de orientación de 20 minutos', { n: offer.sessions })}</small>}
      </div>
      {gateways.length > 0 ? (
        gateways.length > 1 ? (
          <fieldset className="checkout-methods">
            <legend>{tr('Método de pago')}</legend>
            {gateways.map((code) => (
              <label key={code} className={`checkout-method ${gateway === code ? 'is-selected' : ''}`}>
                <input type="radio" name="gateway" value={code} checked={gateway === code} onChange={() => setGateway(code)} />
                <span><b>{tr(GATEWAYS[code].label)}</b><small>{tr(GATEWAYS[code].hint)}</small></span>
              </label>
            ))}
          </fieldset>
        ) : <p className="small muted">{gateway === 'BITGET' ? tr('En el siguiente paso verás los datos de QLC para transferir tus USDT.') : tr('En el siguiente paso pagarás en la página de Mercado Pago.')}</p>
      ) : !simulated ? <p className="small muted">{tr('Por ahora no hay una forma de pago disponible para tu país. Escríbenos para ayudarte.')}</p> : (
      <fieldset className="checkout-methods">
        <legend>{tr('Método de pago')}</legend>
        {METHODS.map((m) => (
          <label key={m.value} className={`checkout-method ${method === m.value ? 'is-selected' : ''}`}>
            <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} />
            <span><b>{tr(m.label)}</b><small>{tr(m.hint)}</small></span>
          </label>
        ))}
      </fieldset>
      )}
    </div>
  );
}

const STEPS = ['Resumen', 'Pago', 'Resultado'];

export function Steps({ current }) {
  const index = STEPS.findIndex((s) => s === current);
  return (
    <ol className="checkout-steps">
      {STEPS.map((label, i) => (
        <li key={label} className={i < index ? 'is-done' : i === index ? 'is-current' : ''} aria-current={i === index ? 'step' : undefined}>
          <span>{i < index ? '✓' : i + 1}</span>{tr(label)}
        </li>
      ))}
    </ol>
  );
}

const untilText = (value) => (value ? tr('hasta el {date}', { date: date(value) }) : tr('sin fecha de vencimiento'));

function outcomeOf(offer, attempt, access, credits) {
  const isDiamond = offer.sessions > 0;
  if (offer.type === 'TOOL_ONLY') {
    return {
      lines: [tr('Ya puedes usar las herramientas {until}.', { until: untilText(access?.toolAccess?.[0]?.expiresAt) }), ...(access?.full ? [] : [tr('La Masterclass sigue bloqueada: se adquiere por separado.')])],
      actions: [{ label: tr('Ir a las herramientas'), to: '/app/academia' }],
    };
  }
  if (offer.type === 'FULL_ANNUAL') {
    return {
      lines: [
        tr('Ya tienes todas las herramientas y la Masterclass completa {until}.', { until: untilText(access?.full?.expiresAt) }),
        ...(isDiamond ? [tr('Tienes {n} sesión(es) de orientación de 20 minutos disponible(s).', { n: credits?.ORIENTACION ?? offer.sessions })] : []),
      ],
      actions: [{ label: tr('Abrir la Masterclass'), to: '/app/masterclass' }, ...(isDiamond ? [{ label: tr('Agendar una sesión'), to: '/app/asesoria' }] : [{ label: tr('Ir a las herramientas'), to: '/app/academia' }])],
    };
  }
  if (offer.type === 'MASTERCLASS') {
    const expiresAt = access?.masterclassModules?.find((m) => m.moduleNumber === offer.moduleNumber)?.expiresAt;
    return {
      lines: [tr('La Masterclass del Módulo {n} está abierta {until}.', { n: offer.moduleNumber, until: untilText(expiresAt) }), tr('Al terminarla pulsa "Terminé esta Masterclass" para poder adquirir el siguiente módulo.')],
      actions: [{ label: tr('Abrir la Masterclass'), to: `/app/masterclass/${offer.moduleNumber}` }],
    };
  }
  if (offer.type === 'CONSULTA') {
    return {
      lines: [tr('Compraste {q} consulta(s). Ahora tienes {n} disponible(s).', { q: attempt.quantity, n: credits?.CONSULTA ?? attempt.quantity }), tr('Escríbela en la pestaña Ejercicio y avance de cualquier módulo. El equipo QLC te responde ahí mismo.')],
      actions: [{ label: tr('Ir a los módulos'), to: '/app/academia' }],
    };
  }
  if (offer.type === 'ORIENTACION') {
    return {
      lines: [tr('Compraste {q} sesión(es) de 20 minutos. Ahora tienes {n} disponible(s).', { q: attempt.quantity, n: credits?.ORIENTACION ?? attempt.quantity })],
      actions: [{ label: tr('Agendar una sesión'), to: '/app/asesoria' }],
    };
  }
  return { lines: [tr('Tu acceso a {name} ya está activo.', { name: offer.name })], actions: [] };
}

const paidPreview = (offer, mode, promo) => {
  if (mode === 'gift') return tr('Se generan los códigos de regalo y quedan guardados en Mis regalos.');
  if (promo) return tr('El pago queda confirmado y el acceso se activa cuando el Administrador General lo autorice.');
  if (offer.type === 'CONSULTA') return tr('Se suman las consultas a tu cuenta.');
  if (offer.type === 'ORIENTACION') return tr('Se suman las sesiones a tu cuenta.');
  return tr('Se activa {name} de inmediato.', { name: offer.name });
};

export function PaymentResult({ attempt, offer, codes, gift, access, credits, onClose, onGo, onRetry }) {
  const [card, setCard] = useState(null);
  const ok = attempt.status === 'APPROVED';
  const pending = ok && attempt.kind === 'PROMO';
  const outcome = ok && !pending && !codes ? outcomeOf(offer, attempt, access, credits) : null;
  return (
    <div className={`checkout-result ${ok ? 'is-ok' : 'is-bad'}`} role="status">
      <span className="checkout-result-icon" aria-hidden="true">{ok ? '✓' : '!'}</span>
      <h4>{!ok ? tr('El pago no se realizó') : pending ? tr('Pago confirmado') : tr('Pago realizado')}</h4>
      {!ok && <p>{tr('No se hizo ningún cobro y no se activó nada. Tu cuenta y tu información siguen igual. Puedes intentarlo de nuevo cuando quieras.')}</p>}
      {pending && <p>{tr('Recibimos tu pago promocional. Tu acceso a {name} se activará en cuanto el Administrador de QLC lo autorice; te avisaremos al quedar listo.', { name: offer.name })}</p>}
      {ok && !pending && codes && (
        <>
          <p>{tr('Tu regalo está listo. Comparte el código con la persona que quieres obsequiar. También queda guardado en Mis regalos, dentro de Mi acceso.')}</p>
          <div className="gift-codes">
            {codes.map((code) => (
              <div key={code} className="gift-code-row">
                <strong>{code}</strong>
                <Button variant="secondary" onClick={() => setCard({ code, product: offer.name, duration: durationText(offer), message: gift?.message, recipientName: gift?.recipientName, redeemBy: null })}>{tr('Ver tarjeta')}</Button>
              </div>
            ))}
          </div>
        </>
      )}
      {outcome && (
        <>
          <b>{tr(offer.name)}</b>
          <ul className="checkout-outcome">{outcome.lines.map((line) => <li key={line}>{line}</li>)}</ul>
        </>
      )}
      <div className="form-actions">
        {!ok && <Button variant="secondary" onClick={onClose}>{tr('Cerrar')}</Button>}
        {!ok && <Button onClick={onRetry}>{tr('Intentar de nuevo')}</Button>}
        {ok && <Button variant={outcome?.actions.length ? 'secondary' : undefined} onClick={onClose}>{outcome?.actions.length ? tr('Quedarme aquí') : tr('Continuar')}</Button>}
        {outcome?.actions.map((action) => <Button key={action.to} onClick={() => onGo(action.to)}>{action.label}</Button>)}
      </div>
      {card && <GiftCardModal gift={card} onClose={() => setCard(null)} />}
    </div>
  );
}

function CountryPrompt({ onSaved }) {
  const [value, setValue] = useState('');
  const [state, setState] = useState({ busy: false, error: null });
  const lang = getLanguage() === 'en' ? 'en' : 'es';
  const list = [...COUNTRIES].sort((a, b) => a[lang].localeCompare(b[lang], lang));
  const save = async () => {
    setState({ busy: true, error: null });
    try {
      await api.put('/auth/residence-country', { residenceCountry: value });
      await onSaved();
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <div className="stack">
      <p>{tr('Para mostrarte las formas de pago disponibles, indica tu país de residencia.')}</p>
      <Field label={tr('País de residencia')}>
        <select className="input" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">{tr('Selecciona tu país')}</option>
          {list.map((c) => <option key={c.code} value={c.code}>{c[lang]}</option>)}
        </select>
      </Field>
      <FormError error={state.error} />
      <Button variant="secondary" loading={state.busy} disabled={!value} onClick={save}>{tr('Guardar')}</Button>
    </div>
  );
}

export function CheckoutModal({ offer, mode = 'buy', promo = null, onClose }) {
  const { refreshAccess, accessInfo } = useAuth();
  const gateways = accessInfo?.providers || [];
  const simulated = accessInfo?.provider === 'MOCK';
  const needsCountry = !accessInfo?.residenceCountry;
  const [chosenGateway, setGateway] = useState(null);
  const selectedGateway = gateways.includes(chosenGateway) ? chosenGateway : gateways[0] || null;
  const charge = selectedGateway === 'BITGET' ? accessInfo?.bitget : selectedGateway === 'MERCADOPAGO' ? accessInfo?.charge : null;
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState({ paid: false, access: null, credits: null });
  const [bitget, setBitget] = useState(null);
  const [step, setStep] = useState('summary');
  const [method, setMethod] = useState('CARD');
  const [gift, setGift] = useState(mode === 'gift' ? { quantity: 1, recipientName: '', message: '' } : null);
  const [attempt, setAttempt] = useState(null);
  const [codes, setCodes] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState({ busy: false, error: null });
  const product = promo ? promo.offer : offer;

  const run = async (fn) => {
    setState({ busy: true, error: null });
    try {
      await fn();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  const start = () => run(async () => {
    const body = promo
      ? { promoCode: promo.code }
      : { offerCode: offer.code, ...(isService(offer) ? { quantity: Math.min(20, Math.max(1, Number(quantity) || 1)) } : {}), ...(gift ? { gift: { quantity: Number(gift.quantity || 1), recipientName: gift.recipientName || null, message: gift.message || null } } : {}) };
    const res = await api.post('/payments/checkout', { ...body, ...(selectedGateway ? { provider: selectedGateway } : {}) });
    setAttempt(res.attempt);
    if (res.checkout.mode === 'REDIRECT' && res.checkout.initPoint) {
      window.location.assign(res.checkout.initPoint);
    } else if (res.checkout.mode === 'BITGET') {
      setBitget({ uid: res.checkout.uid, instructions: res.checkout.instructions, wallet: res.checkout.wallet });
      setStep('bitget');
    } else setStep('test');
  });

  const simulate = (outcome) => run(async () => {
    const res = await api.post(`/payments/attempts/${attempt.id}/simulate`, { outcome });
    setAttempt(res.attempt);
    setCodes(res.gifts || null);
    const paid = res.attempt.status === 'APPROVED';
    const credits = paid ? await api.get('/payments/credits').catch(() => null) : null;
    setOutcome({ paid, access: res.access || null, credits });
    setStep('result');
  });

  const finish = async () => {
    if (outcome.paid || step === 'reported') await refreshAccess();
    onClose();
  };

  const go = async (to) => {
    await finish();
    navigate(to);
  };

  return (
    <Modal open title={gift ? tr('Regalar acceso') : tr('Pago seguro')} onClose={finish} className="checkout">
      {simulated && <div className="checkout-env">{tr('ENTORNO DE PRUEBA · No se realiza ningún cobro real')}</div>}
      <Steps current={step === 'summary' ? 'Resumen' : step === 'result' ? 'Resultado' : 'Pago'} />
      {step === 'summary' && (
        <>
          {needsCountry && <CountryPrompt onSaved={refreshAccess} />}
          <Summary offer={product} method={method} setMethod={setMethod} gift={gift} setGift={setGift} promo={promo} quantity={quantity} setQuantity={setQuantity} charge={charge} gateways={gateways} gateway={selectedGateway} setGateway={setGateway} simulated={simulated} />
          <FormError error={state.error} />
          <div className="form-actions">
            <Button variant="secondary" onClick={onClose}>{tr('Cancelar')}</Button>
            <Button loading={state.busy} disabled={needsCountry || (!simulated && !selectedGateway)} onClick={start} data-autofocus>{tr('Continuar al pago')}</Button>
          </div>
        </>
      )}
      {step === 'bitget' && attempt && bitget && (
        <div className="stack">
          <BitgetInstructions uid={bitget.uid} instructions={bitget.instructions} wallet={bitget.wallet} amount={attempt.chargedAmount} currency={attempt.chargedCurrency} />
          <BitgetReportForm attemptId={attempt.id} onDone={() => setStep('reported')} />
          <p className="muted small">{tr('Si aún no transfieres, puedes cerrar esta ventana y reportarla después en Mi acceso, en Transferencias Bitget.')}</p>
        </div>
      )}
      {step === 'reported' && (
        <div className="checkout-processing-result" role="status">
          <h4>{tr('Transferencia reportada')}</h4>
          <p className="muted">{tr('Revisaremos tu transferencia. Tu acceso se activará cuando se confirme el pago y te avisaremos. Puedes ver el estado en Mi acceso.')}</p>
          <div className="form-actions"><Button onClick={finish}>{tr('Entendido')}</Button></div>
        </div>
      )}
      {step === 'test' && attempt && (
        <div className="checkout-test">
          <div className="checkout-processing">
            <span className="checkout-pulse" aria-hidden="true" />
            <div>
              <b>{tr(product.name)}</b>
              <small>{attempt.amount === null ? tr('Precio por definir') : `${priceMoney(attempt.amount)} ${attempt.currency}`} · {tr('Referencia')} {attempt.id.slice(-8).toUpperCase()} · {date(attempt.createdAt)}</small>
            </div>
          </div>
          <h4 className="checkout-question">{tr('¿Se realizó el pago?')}</h4>
          <dl className="checkout-paths">
            <div><dt>{tr('Sí se pagó')}</dt><dd>{paidPreview(product, mode, promo)}</dd></div>
            <div><dt>{tr('No se pagó')}</dt><dd>{tr('No se cobra ni se activa nada, y puedes intentarlo de nuevo.')}</dd></div>
          </dl>
          <FormError error={state.error} />
          <div className="checkout-sim">
            <Button variant="danger" loading={state.busy} onClick={() => simulate('REJECTED')}>{tr('No se pagó')}</Button>
            <Button loading={state.busy} onClick={() => simulate('APPROVED')} data-autofocus>{tr('Sí se pagó')}</Button>
          </div>
          <p className="muted small">{tr('Si cierras esta ventana sin elegir, el pago queda pendiente y no se activa nada.')}</p>
        </div>
      )}
      {step === 'result' && attempt && (
        <PaymentResult attempt={attempt} offer={product} codes={codes} gift={gift} access={outcome.access} credits={outcome.credits} onClose={finish} onGo={go} onRetry={() => { setAttempt(null); setBitget(null); setOutcome({ paid: false, access: null, credits: null }); setStep('summary'); }} />
      )}
    </Modal>
  );
}

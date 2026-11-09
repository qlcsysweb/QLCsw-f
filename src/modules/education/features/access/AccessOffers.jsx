import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { date } from '../../utils/format.js';
import { Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { BRAND_FULL } from '../../components/layout/Brand.jsx';
import { CheckoutModal, offerPrice } from './CheckoutModal.jsx';
import { tr } from '../../i18n/tr.js';

const TOOL_LABELS = [
  'Diagnóstico financiero', 'Mapa de productos', 'Constructor de portafolio', 'Riesgo y exposición', 'Simulador de operación', 'Operación profesional',
  'Presupuesto y control', 'Fondo de emergencia', 'Panel de obligaciones', 'Rendimiento neto', 'Poder adquisitivo', 'Evolución patrimonial',
];

const PLAN_TEXT = {
  TOOLS_ALL: {
    tag: 'Herramientas',
    text: 'Acceso a todas las herramientas financieras por 30 días o por 1 año. Al terminar se bloquean y puedes renovar cuando quieras.',
    list: ['Herramientas M1–M12 conectadas a tu plataforma', 'Mi portafolio de inversión, patrimonio, cortes e informe anual', 'La Masterclass no está incluida'],
  },
  FULL_ANNUAL: {
    tag: 'Membresía anual',
    text: 'Todas las herramientas y todos los módulos de la Masterclass durante 12 meses.',
    list: ['Herramientas M1–M12 durante 12 meses', 'Masterclass completa de los 12 módulos', 'Mi portafolio de inversión, patrimonio, cortes e informe anual'],
  },
  DIAMOND_ANNUAL: {
    tag: 'Membresía anual',
    text: 'Todo lo de QLC Premium Access más 6 sesiones de orientación personalizada de 20 minutos.',
    list: ['Todo lo incluido en QLC Premium Access', '6 sesiones de orientación de 20 minutos por el chat interno', 'Sesiones válidas durante los 12 meses de la membresía'],
  },
};

const SERVICE_TEXT = {
  CONSULTA: ['Consulta sobre ejercicios', 'Envía una consulta en la sección Ejercicio y avance de cualquier módulo. El equipo QLC te responde ahí mismo.', 'por consulta'],
  ORIENTACION: ['Orientación personalizada', 'Sesión de 20 minutos por el chat interno. Agéndala en Asesoría personalizada.', 'por sesión de 20 minutos'],
};

export function AccessOffers({ title = 'Elige cómo usar QLC Financial Education', compact }) {
  const { accessInfo, access } = useAuth();
  const [selected, setSelected] = useState(null);
  const [gift, setGift] = useState(null);
  const offers = accessInfo?.offers || [];
  const billing = accessInfo?.subscription?.billing || null;
  const recurring = (offer) => accessInfo?.provider !== 'MOCK' && !!offer.billingCycle;
  const [params, setParams] = useSearchParams();
  const renew = params.get('renovar');
  useEffect(() => {
    if (!renew || !offers.length) return;
    const offer = offers.find((o) => o.code === renew);
    if (offer) setSelected(offer);
    const next = new URLSearchParams(params);
    next.delete('renovar');
    setParams(next, { replace: true });
  }, [renew, offers, params, setParams]);
  const byCode = (code) => offers.find((o) => o.code === code);
  const plans = ['TOOLS_ALL', 'FULL_ANNUAL', 'DIAMOND_ANNUAL'].map(byCode).filter(Boolean);
  const services = ['CONSULTA', 'ORIENTACION'].map(byCode).filter(Boolean);
  const masterclass = byCode('MASTERCLASS_M1');
  const toolsOwned = !!access.full || access.tools.length === TOOL_LABELS.length;
  const toolsUntil = toolsOwned && !access.full ? access.toolAccess.reduce((min, t) => (t.expiresAt && (!min || t.expiresAt < min) ? t.expiresAt : min), null) : null;

  const status = (offer) => {
    if (offer.type === 'FULL_ANNUAL' && access.full) return tr('Activo hasta {date}', { date: date(access.full.expiresAt) });
    if (offer.type === 'TOOL_ONLY' && toolsUntil) return tr('Activo hasta {date}', { date: date(toolsUntil) });
    return null;
  };

  return (
    <section className={`offers ${compact ? 'is-compact' : ''}`}>
      <header className="offers-head">
        <div className="section-kicker">{tr(BRAND_FULL)}</div>
        <h2>{tr(title)}</h2>
        <p className="muted">{tr('Las herramientas y la Masterclass se adquieren por separado o juntas en una membresía anual. Los datos que registres siempre se conservan mientras tu cuenta exista.')}</p>
      </header>
      <div className="offers-grid offers-grid-3">
        {plans.map((offer) => {
          const info = PLAN_TEXT[offer.code];
          const active = status(offer);
          const annual = offer.code === 'TOOLS_ALL' ? byCode('TOOLS_ANNUAL') : null;
          const buyButton = (item, label) => (billing?.offerCode === item.code
            ? <Pill key={item.code}>{tr('Suscripción activa')}</Pill>
            : item.type === 'TOOL_ONLY' && toolsOwned && !toolsUntil
              ? <Pill key={item.code}>{tr('Incluido en tu membresía')}</Pill>
              : <Button key={item.code} variant={item.type === 'TOOL_ONLY' ? 'secondary' : undefined} onClick={() => setSelected(item)}>{label}</Button>);
          return (
            <article key={offer.code} className={`offer-card ${offer.code === 'DIAMOND_ANNUAL' ? 'is-featured' : ''}`}>
              <div className="offer-top">
                <span className="offer-tag">{tr(info.tag)}</span>
                {active && <Pill>{active}</Pill>}
              </div>
              <h3>{tr(offer.name)}</h3>
              <p>{tr(info.text)}</p>
              <ul className="offer-list">{info.list.map((l) => <li key={l}>{tr(l)}</li>)}</ul>
              <div className="offer-price">{offerPrice(offer)}{' '}{offer.type === 'TOOL_ONLY' ? tr('/ 30 días') : recurring(offer) ? tr(offer.billingCycle === 'YEARLY' ? '/ año' : '/ mes') : tr('/ 1 año')}</div>
              {annual && <div className="offer-price">{offerPrice(annual)}{' '}{tr('/ 1 año')}</div>}
              {buyButton(offer, annual ? (active ? tr('Renovar por 30 días') : tr('Adquirir por 30 días')) : active ? tr('Renovar') : tr('Adquirir'))}
              {annual && buyButton(annual, active ? tr('Renovar por 1 año') : tr('Adquirir por 1 año'))}
              {offer.giftable !== false && <Button variant="secondary" onClick={() => setGift(offer)}>{tr('🎁 Regalar')}</Button>}
            </article>
          );
        })}
      </div>
      {!compact && (masterclass || services.length > 0) && (
        <div className="offers-grid offers-grid-3 offers-extra">
          {masterclass && (
            <article className="offer-card is-mini">
              <span className="offer-tag">{tr('Masterclass')}</span>
              <h3>{tr('Masterclass por módulo')}</h3>
              <p>{tr('Cada módulo se adquiere por separado con 30 días de acceso. Se avanza en orden: para adquirir un módulo debes terminar el anterior. Tu avance se conserva.')}</p>
              <div className="offer-price">{offerPrice(masterclass)}{' '}{tr('por módulo')}</div>
              <Link className="btn-secondary" to="/app/masterclass">{tr('Ver la Masterclass')}</Link>
            </article>
          )}
          {services.map((offer) => {
            const [name, text, unit] = SERVICE_TEXT[offer.code];
            return (
              <article key={offer.code} className="offer-card is-mini">
                <span className="offer-tag">{tr('Servicio')}</span>
                <h3>{tr(name)}</h3>
                <p>{tr(text)}</p>
                <div className="offer-price">{offerPrice(offer)}{' '}{tr(unit)}</div>
                {offer.code === 'CONSULTA' && !access.hasAny
                  ? <p className="small muted">{tr('Disponible con Herramientas o una membresía activa.')}</p>
                  : <Button variant="secondary" onClick={() => setSelected(offer)}>{tr('Adquirir')}</Button>}
              </article>
            );
          })}
        </div>
      )}
      {selected && <CheckoutModal offer={selected} onClose={() => setSelected(null)} />}
      {gift && <CheckoutModal offer={gift} mode="gift" onClose={() => setGift(null)} />}
    </section>
  );
}

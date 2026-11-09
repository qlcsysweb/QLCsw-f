import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { priceMoney } from '../../utils/format.js';
import { Card, Notice, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Field, FormError, Input, MoneyInput } from '../../components/ui/Form.jsx';
import { AsyncView } from '../../components/ui/States.jsx';
import { tr } from '../../i18n/tr.js';

const priceText = (o) => (o.price === null ? tr('Precio por definir') : `${priceMoney(o.price)} ${o.currency}`);

function OfferEditor({ offer, onSaved, canEdit }) {
  const [f, setF] = useState({ name: offer.name, description: offer.description || '', price: offer.price ?? '', currency: offer.currency, accessDays: offer.accessDays ?? '', billingCycle: offer.billingCycle || '', active: offer.active, giftable: offer.giftable !== false });
  const recurrable = offer.type === 'TOOL_ONLY' || offer.type === 'FULL_ANNUAL';
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState({ busy: false, error: null });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async () => {
    setState({ busy: true, error: null });
    try {
      await api.put(`/admin/pricing/${offer.code}`, {
        ...f,
        price: f.price === '' ? null : Number(f.price),
        accessDays: Number(f.accessDays || (offer.type === 'TOOL_ONLY' ? 30 : 365)),
        ...(recurrable ? { billingCycle: f.billingCycle || null } : {}),
      });
      setConfirm(false);
      setState({ busy: false, error: null });
      onSaved();
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  return (
    <article className={`price-card ${offer.type === 'FULL_ANNUAL' ? 'is-featured' : ''}`}>
      <header>
        <span className="price-code">{offer.type === 'FULL_ANNUAL' ? tr('Acceso completo anual') : offer.code === 'TOOLS_ANNUAL' ? tr('Herramientas M1–M12 · 1 año') : (offer.moduleNumber ? `Herramienta M${offer.moduleNumber}` : tr('Herramientas M1–M12'))}</span>
        <Pill variant={offer.active ? '' : 'muted'}>{offer.active ? tr('Activo') : tr('Inactivo')}</Pill>
      </header>
      <strong className="price-current">{priceText(offer)}</strong>
      <div className="form-grid cols-2">
        <Field label={tr('Nombre')} full><Input value={f.name} onChange={set('name')} disabled={!canEdit} /></Field>
        <Field label={tr('Precio')} hint={tr('Vacío = Precio por definir')}><MoneyInput value={f.price} onChange={set('price')} disabled={!canEdit} placeholder={tr('Por definir')} /></Field>
        <Field label={tr('Moneda')}><Input maxLength={3} value={f.currency} onChange={set('currency')} disabled={!canEdit} /></Field>
        <Field label={offer.type !== 'TOOL_ONLY' || offer.code === 'TOOLS_ANNUAL' ? tr('Días de acceso') : tr('Días por mensualidad')}><Input type="number" min="1" value={f.accessDays} onChange={set('accessDays')} disabled={!canEdit} /></Field>
        {recurrable && (
          <Field label={tr('Renovación')} hint={tr('Con Mercado Pago el cobro es automático en cada periodo. Con Bitget el cliente paga de nuevo y recibe un correo 3 días antes de vencer.')}>
            <select className="input" value={f.billingCycle} onChange={set('billingCycle')} disabled={!canEdit}>
              <option value="">{tr('Pago único')}</option>
              <option value="MONTHLY">{tr('Mensual')}</option>
              <option value="YEARLY">{tr('Anual')}</option>
            </select>
          </Field>
        )}
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} disabled={!canEdit} />{' '}{tr('Disponible para compra')}</label>
        <label className="check"><input type="checkbox" checked={f.giftable} onChange={set('giftable')} disabled={!canEdit} />{' '}{tr('Se puede regalar (QLC Gift Access)')}</label>
      </div>
      <FormError error={state.error} />
      {canEdit && <Button onClick={() => setConfirm(true)}>{tr('Guardar')}</Button>}
      <ConfirmDialog
        open={confirm}
        title={tr('Confirmar cambio de precio')}
        message={tr('El cambio se aplica a nuevas compras.')}
        details={[
          { field: tr('Precio'), from: priceText(offer), to: f.price === '' ? tr('Precio por definir') : `${priceMoney(f.price)} ${f.currency}` },
          { field: tr('Estado'), from: offer.active ? tr('Activo') : tr('Inactivo'), to: f.active ? tr('Activo') : tr('Inactivo') },
          { field: tr('Regalable'), from: offer.giftable !== false ? tr('Sí') : tr('No'), to: f.giftable ? tr('Sí') : tr('No') },
        ]}
        loading={state.busy}
        onConfirm={save}
        onClose={() => setConfirm(false)}
      />
    </article>
  );
}

function MasterclassSettings({ canEdit }) {
  const res = useAsync(() => api.get('/admin/masterclass/settings'), []);
  const [state, setState] = useState({ busy: false, error: null });
  const toggle = async (includedWithFull) => {
    setState({ busy: true, error: null });
    try {
      await api.put('/admin/masterclass/settings', { includedWithFull });
      await res.reload();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  if (!res.data) return null;
  return (
    <div className="stack">
      <label className="check">
        <input type="checkbox" checked={res.data.includedWithFull} disabled={!canEdit || state.busy} onChange={(e) => toggle(e.target.checked)} />
        {' '}{tr('Incluir la Masterclass completa en QLC Premium Access y QLC Diamond Access')}
      </label>
      <p className="small muted">{res.data.includedWithFull
        ? tr('Las membresías anuales incluyen los 12 módulos de la Masterclass. Cada módulo también se vende por separado (Masterclass M1 a M12) con 30 días de acceso y en orden.')
        : tr('La Masterclass se cobra aparte: solo la ven quienes compran cada módulo.')}</p>
      <FormError error={state.error} />
    </div>
  );
}

export default function AdminPricing() {
  const { user } = useAuth();
  const res = useAsync(() => api.get('/admin/pricing'), []);
  const canEdit = user?.adminLevel === 'FULL';
  return (
    <>
      <PageHeader kicker={tr('Comercial')} title={tr('Precios y accesos')} subtitle={tr('Los precios provienen de la base de datos. Ninguno está escrito en el código.')} />
      <Notice>{tr('Si un precio no está configurado, la plataforma muestra “Precio por definir” y el entorno de pruebas permite simular la compra.')}</Notice>
      <AsyncView {...res} onRetry={res.reload}>
        {(offers) => (
          <>
            <Card title={tr('Acceso completo anual')}>
              <div className="price-grid single">{offers.filter((o) => o.type === 'FULL_ANNUAL').map((o) => <OfferEditor key={`${o.code}-${o.price}-${o.active}`} offer={o} onSaved={res.reload} canEdit={canEdit} />)}</div>
            </Card>
            <Card title={tr('Solo herramientas · un solo pago mensual por las 12 herramientas')}>
              <div className="price-grid">{offers.filter((o) => o.type === 'TOOL_ONLY' && !o.moduleNumber).map((o) => <OfferEditor key={`${o.code}-${o.price}-${o.active}`} offer={o} onSaved={res.reload} canEdit={canEdit} />)}</div>
            </Card>
            <Card title={tr('Masterclass · submódulo de cada módulo')}>
              <MasterclassSettings canEdit={canEdit} />
              <div className="price-grid single">{offers.filter((o) => o.type === 'MASTERCLASS').map((o) => <OfferEditor key={`${o.code}-${o.price}-${o.active}`} offer={o} onSaved={res.reload} canEdit={canEdit} />)}</div>
            </Card>
          </>
        )}
      </AsyncView>
    </>
  );
}

import { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dateTime, priceMoney } from '../../utils/format.js';
import { ACCESS_MODES, PAYMENT_STATUS } from '../../utils/labels.js';
import { Card, PageHeader, Pill } from '../../components/ui/Card.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CodeInput, Field, FormError, Input } from '../../components/ui/Form.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { AccessOffers } from '../../features/access/AccessOffers.jsx';
import { BitgetReportsCard } from '../../features/access/BitgetPayment.jsx';
import { TrialNotice } from '../../features/access/TrialNotice.jsx';
import { tr } from '../../i18n/tr.js';
import { DataShareCard } from '../../features/share/DataShare.jsx';
import { GiftShop, MyGifts, PromoCodeCard, RedeemCard, SubscriptionCard } from '../../features/gifts/ClientCommerce.jsx';

function RetentionInfo() {
  return (
    <Card title={tr('Si no renuevas tu acceso')}>
      <p className="small muted">{tr('Cuando vence tu acceso tienes un mes para pagar. Si no pagas, tu cuenta y tus datos se eliminan de forma definitiva:')}</p>
      <ul className="small">
        <li>{tr('A los 10 días sin pagar te avisamos que en 20 días se eliminará tu cuenta.')}</li>
        <li>{tr('A los 20 días sin pagar te avisamos que en 10 días se eliminará.')}</li>
        <li>{tr('A los 29 días sin pagar te avisamos que en 1 día se eliminará.')}</li>
        <li>{tr('A los 30 días sin pagar tu cuenta queda eliminada.')}</li>
      </ul>
    </Card>
  );
}

function clearPeriodSelection() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('edu_period_')).forEach((k) => localStorage.removeItem(k));
  } catch {
    return;
  }
}

function ResetProfile() {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [state, setState] = useState({ busy: false, error: null });
  const reset = async () => {
    setState({ busy: true, error: null });
    try {
      await api.post('/auth/reset-profile', { confirm: word.trim().toUpperCase() });
      clearPeriodSelection();
      window.location.assign('/app');
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <Card title={tr('Reiniciar mi perfil (pruebas)')}>
      <p className="small muted">{tr('Borra tu diagnóstico, periodos, portafolio, ingresos y gastos, deudas, presupuestos, cortes y avance de la academia para empezar desde cero. Tu cuenta, tu verificación en dos pasos, tus pagos, tu acceso y tus citas se conservan. No se puede deshacer.')}</p>
      <Button variant="secondary" onClick={() => setOpen(true)}>{tr('Reiniciar mi perfil')}</Button>
      <Modal
        open={open}
        title={tr('¿Reiniciar tu perfil?')}
        onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{tr('Cancelar')}</Button><Button loading={state.busy} disabled={word.trim().toUpperCase() !== 'REINICIAR'} onClick={reset}>{tr('Borrar y empezar de cero')}</Button></>}
      >
        <div className="stack">
          <p>{tr('Se borrará toda tu información financiera y tu avance. Esta acción no se puede deshacer.')}</p>
          <Field label={tr('Escribe REINICIAR para confirmar')}><Input value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" /></Field>
          <FormError error={state.error} />
        </div>
      </Modal>
    </Card>
  );
}

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const periodName = (p) => `${MONTH_NAMES[p.month - 1]} ${p.year}`;

function ResetPeriod() {
  const { periods, period, reloadPeriods } = useWorkspace();
  const open = (periods || []).filter((p) => p.status === 'OPEN');
  const [selected, setSelected] = useState('');
  const [show, setShow] = useState(false);
  const [word, setWord] = useState('');
  const [state, setState] = useState({ busy: false, error: null, done: null });
  const target = open.find((p) => p.id === (selected || period?.id)) || open[0];
  if (!target) return null;
  const reset = async () => {
    setState({ busy: true, error: null, done: null });
    try {
      const fresh = await api.post(`/periods/${target.id}/reset`, { confirm: word.trim().toUpperCase() });
      await reloadPeriods(fresh.id);
      setShow(false);
      setWord('');
      setState({ busy: false, error: null, done: periodName(fresh) });
    } catch (error) {
      setState({ busy: false, error, done: null });
    }
  };
  return (
    <Card title={tr('Reiniciar solo un periodo mensual')}>
      <p className="small muted">{tr('Borra únicamente la información del mes que elijas: ingresos y gastos, movimientos, protección, deudas del mes, presupuesto, aportaciones y cambios de tu portafolio en ese mes. Los demás meses, tu diagnóstico y tu avance de la academia no se tocan. No se puede deshacer.')}</p>
      <div className="inline-form">
        <Field label={tr('Periodo a reiniciar')}>
          <select className="input" value={target.id} onChange={(e) => setSelected(e.target.value)}>
            {open.map((p) => <option key={p.id} value={p.id}>{periodName(p)}</option>)}
          </select>
        </Field>
        <Button variant="secondary" onClick={() => setShow(true)}>{tr('Reiniciar este periodo')}</Button>
      </div>
      {state.done && <p className="small up">{tr('El periodo {name} quedó reiniciado.', { name: state.done })}</p>}
      <Modal
        open={show}
        title={tr('¿Reiniciar {name}?', { name: periodName(target) })}
        onClose={() => setShow(false)}
        footer={<><Button variant="secondary" onClick={() => setShow(false)}>{tr('Cancelar')}</Button><Button loading={state.busy} disabled={word.trim().toUpperCase() !== 'REINICIAR'} onClick={reset}>{tr('Reiniciar el periodo')}</Button></>}
      >
        <div className="stack">
          <p>{tr('Se borrará solo la información de {name}. Esta acción no se puede deshacer.', { name: periodName(target) })}</p>
          <Field label={tr('Escribe REINICIAR para confirmar')}><Input value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" /></Field>
          <FormError error={state.error} />
        </div>
      </Modal>
    </Card>
  );
}

function DeleteAccount() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ word: '', code: '' });
  const [state, setState] = useState({ busy: false, error: null });
  const ready = f.word.trim().toUpperCase() === 'ELIMINAR' && /^\d{6}$/.test(f.code);
  const remove = async () => {
    setState({ busy: true, error: null });
    try {
      await api.post('/auth/delete-account', { confirm: 'ELIMINAR', code: f.code });
      clearPeriodSelection();
      await logout();
      window.location.assign('/');
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <div id="eliminar-cuenta">
    <Card title={tr('Eliminar mi cuenta')}>
      <p className="small muted">{tr('Borra definitivamente tu cuenta y toda tu información: diagnóstico, portafolio, ingresos y gastos, deudas, seguros, cortes, avance de la academia, pagos registrados, acceso y citas. No se puede deshacer y perderás el acceso que hayas comprado.')}</p>
      <Button variant="secondary" className="danger" onClick={() => setOpen(true)}>{tr('Eliminar mi cuenta')}</Button>
      <Modal
        open={open}
        title={tr('¿Eliminar tu cuenta definitivamente?')}
        onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{tr('Cancelar')}</Button><Button loading={state.busy} disabled={!ready} onClick={remove}>{tr('Eliminar definitivamente')}</Button></>}
      >
        <div className="stack">
          <p>{tr('Esta acción borra tu cuenta y toda tu información. No se puede deshacer.')}</p>
          <Field label={tr('Escribe ELIMINAR para confirmar')}><Input value={f.word} onChange={(e) => setF({ ...f, word: e.target.value })} autoComplete="off" /></Field>
          <Field label={tr('Código de Google Authenticator')}><CodeInput value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
          <FormError error={state.error} />
        </div>
      </Modal>
    </Card>
    </div>
  );
}

export default function AccessPage() {
  const { access, accessInfo, user } = useAuth();
  const { isAdminView } = useWorkspace();
  const isClient = user?.role === 'CLIENT' && !isAdminView;
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const target = search.get('promo') ? 'promocion' : search.get('prueba') ? 'prueba-gratis' : window.location.hash.slice(1);
    if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 400);
  }, []);
  const attempts = useAsync(() => api.get('/payments/attempts'), [accessInfo]);
  return (
    <>
      <PageHeader kicker={tr('Mi acceso')} title={tr('Acceso a QLC Financial Education')} subtitle={`Modalidad actual: ${ACCESS_MODES[access.mode]}`} />
      {isClient && <TrialNotice />}
      {isClient && <SubscriptionCard />}
      <AccessOffers title={tr('Formas de adquirir')} />
      {isClient && <BitgetReportsCard key={accessInfo?.access?.mode} />}
      {isClient && <RetentionInfo />}
      {isClient && <PromoCodeCard />}
      {isClient && <GiftShop />}
      {isClient && <MyGifts />}
      {isClient && <RedeemCard />}
      <Card title={tr('Historial de pagos')}>
        <DataTable
          rows={attempts.data || []}
          empty={tr('Aún no hay intentos de pago.')}
          columns={[
            { key: 'createdAt', label: tr('Fecha'), render: (a) => dateTime(a.createdAt) },
            { key: 'offer', label: tr('Producto'), render: (a) => a.offer?.name },
            { key: 'amount', label: tr('Monto'), align: 'right', render: (a) => (a.amount === null ? tr('Por definir') : `${priceMoney(a.amount)} ${a.currency}${a.chargedAmount !== null && a.chargedAmount !== undefined && a.chargedCurrency !== a.currency ? ` · ${priceMoney(a.chargedAmount)} ${a.chargedCurrency}` : ''}`) },
            { key: 'provider', label: tr('Proveedor'), render: (a) => ({ MOCK: tr('Simulado'), PAYPAL: 'PayPal', DLOCALGO: tr('Pago local'), BITGET: 'Bitget', STP: tr('Transferencia STP'), OXXO_DEPOSITO: 'OXXO' }[a.provider] || tr('Tarjeta')) },
            { key: 'status', label: tr('Estado'), render: (a) => <Pill variant={a.status === 'APPROVED' ? '' : a.status === 'REJECTED' ? 'bad' : 'warn'}>{tr(PAYMENT_STATUS[a.status])}</Pill> },
          ]}
        />
      </Card>
      {isClient && <DataShareCard />}
      {isClient && <ResetPeriod />}
      {isClient && <ResetProfile />}
      {isClient && <DeleteAccount />}
    </>
  );
}

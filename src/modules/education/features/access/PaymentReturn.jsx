import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Loading } from '../../components/ui/States.jsx';
import { PaymentResult, Steps } from './CheckoutModal.jsx';
import { tr } from '../../i18n/tr.js';

const MAX_CHECKS = 6;
const WAIT_MS = 3000;

export function PaymentReturn() {
  const [params, setParams] = useSearchParams();
  const id = params.get('pago');
  const { refreshAccess } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ checking: true, data: null, failed: false });
  const alive = useRef(true);

  useEffect(() => {
    if (!id) return undefined;
    alive.current = true;
    const check = async () => {
      setState({ checking: true, data: null, failed: false });
      let last = null;
      for (let i = 0; i < MAX_CHECKS && alive.current; i += 1) {
        try {
          last = await api.post(`/payments/attempts/${encodeURIComponent(id)}/sync`, {});
          if (last.attempt.status !== 'PENDING') break;
        } catch {
          if (alive.current) setState({ checking: false, data: null, failed: true });
          return;
        }
        await new Promise((r) => setTimeout(r, WAIT_MS));
      }
      if (alive.current) setState({ checking: false, data: last, failed: false });
    };
    check();
    return () => {
      alive.current = false;
    };
  }, [id]);

  if (!id) return null;

  const finish = async () => {
    await refreshAccess();
    const next = new URLSearchParams(params);
    next.delete('pago');
    setParams(next, { replace: true });
  };
  const go = async (to) => {
    await refreshAccess();
    navigate(to, { replace: true });
  };

  const attempt = state.data?.attempt;
  return (
    <Modal open title={tr('Confirmación de pago')} onClose={finish} className="checkout">
      <Steps current={state.checking || attempt?.status === 'PENDING' ? 'Pago' : 'Resultado'} />
      {state.checking && (
        <div className="stack">
          <Loading />
          <p className="muted small">{tr('Estamos confirmando tu pago…')}</p>
        </div>
      )}
      {state.failed && (
        <div className="checkout-result is-bad" role="status">
          <span className="checkout-result-icon" aria-hidden="true">!</span>
          <h4>{tr('No pudimos confirmar el pago')}</h4>
          <p>{tr('Si realizaste el pago, tu acceso se activará en cuanto recibamos la confirmación. Revisa tu historial de pagos en Mi acceso.')}</p>
          <div className="form-actions"><Button onClick={finish}>{tr('Cerrar')}</Button></div>
        </div>
      )}
      {!state.checking && attempt?.status === 'PENDING' && (
        <div className="checkout-processing-result" role="status">
          <h4>{tr('Tu pago está en proceso')}</h4>
          <p className="muted">{attempt.billingCycle ? tr('Tu suscripción quedó registrada. El primer cobro puede tardar; tu acceso se activará solo en cuanto se confirme y te avisaremos por correo. Si no terminaste de contratarla, no se hizo ningún cobro.') : tr('Todavía no se confirma. Puede tardar si pagaste en efectivo o por transferencia. Tu acceso se activará solo en cuanto se confirme y te avisaremos por correo. Si no terminaste el pago, no se hizo ningún cobro.')}</p>
          <div className="form-actions"><Button onClick={finish}>{tr('Entendido')}</Button></div>
        </div>
      )}
      {!state.checking && attempt && attempt.status !== 'PENDING' && (
        <PaymentResult
          attempt={attempt}
          offer={attempt.offer}
          codes={state.data.gifts || null}
          gift={null}
          access={state.data.access}
          credits={state.data.credits}
          onClose={finish}
          onGo={go}
          onRetry={finish}
        />
      )}
    </Modal>
  );
}

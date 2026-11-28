import { useState } from 'react';
import { api } from '../../api/client.js';
import { tr } from '../../i18n/tr.js';

// Misma clave con la que el panel de trading guarda su sesión (frontend/src/modules/trading/services/api.js).
const TRADING_TOKEN_KEY = 'trad_auth_token';

// Abre el panel de administración de trading cuantitativo sin volver a iniciar sesión: el servidor abre la
// sesión de trading para el mismo correo, solo si allí también es administrador activo.
export function TradingPanelButton({ className = 'trading-panel-btn' }) {
  const [state, setState] = useState({ busy: false, error: null });
  const open = async () => {
    setState({ busy: true, error: null });
    try {
      const { token } = await api.post('/admin/trading-session', {});
      try {
        localStorage.setItem(TRADING_TOKEN_KEY, token);
      } catch {
        // Sin localStorage la sesión de trading sigue por la cookie que puso el servidor.
      }
      window.location.assign('/trad/admin');
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  return (
    <div className="trading-panel">
      <button type="button" className={className} onClick={open} disabled={state.busy}>
        <span className="ico">⇄</span>{state.busy ? tr('Abriendo…') : tr('Panel administrador de trading cuantitativo')}
      </button>
      {state.error && <p className="small down trading-panel-error">{state.error.message}</p>}
    </div>
  );
}

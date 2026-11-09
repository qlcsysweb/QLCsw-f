import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { FormError } from '../../../components/ui/Form.jsx';
import { ErrorState, Loading } from '../../../components/ui/States.jsx';
import { Pill } from '../../../components/ui/Card.jsx';
import { ModuleLayout } from '../../../features/academy/ModuleLayout.jsx';
import { useAcademy } from '../../../features/academy/useAcademy.js';
import { tr } from '../../../i18n/tr.js';

const ROUTES = [
  {
    key: 'MARKETS',
    badge: 'Ruta opcional',
    title: 'Quiero aprender sobre mercados',
    text: 'Quiero entender las inversiones de mayor riesgo, el trading, la volatilidad, el apalancamiento y cómo funciona una operación profesional.',
    modules: [['4', 'Inversiones de mayor riesgo', 'Riesgo, volatilidad, apalancamiento y drawdown.'], ['5', 'Trading', 'Cómo funciona una operación y sus riesgos.'], ['6', 'Operación profesional', 'Datos, ejecución, gestión de riesgo y tecnología.']],
    cta: 'Explorar ruta de mercados',
    note: 'Antes del Módulo 4 se aplicará un filtro de conocimientos básicos. La ruta es opcional: el Bloque 2 (M7–M12) sigue disponible sin completarla. Esta selección no activa ninguna estrategia, cuenta, operación ni asignación de capital.',
  },
  {
    key: 'PATRIMONIAL',
    badge: 'Ruta patrimonial',
    title: 'Quiero continuar con mi educación financiera',
    text: 'No me interesa estudiar trading ni estrategias de mayor riesgo por ahora. Quiero continuar con la organización y crecimiento de mi patrimonio.',
    modules: [['7', 'Presupuesto y control financiero', 'Ingresos, gastos y capacidad de ahorro.'], ['8', 'Fondo de emergencia, Meta patrimonial y Liquidez', 'Reserva, metas y capacidad de respuesta.'], ['9–12', 'Organización y crecimiento patrimonial', 'Deudas, impuestos, inflación y plan patrimonial.']],
    cta: 'Continuar con educación patrimonial',
    note: 'Continúas directamente con el Módulo 7. No se registrará ninguna exposición ni actividad relacionada con trading.',
  },
];

export default function RoutePage() {
  const { api, basePath, canEdit } = useWorkspace();
  const navigate = useNavigate();
  const overview = useAcademy();
  const [state, setState] = useState({ busy: null, error: null });

  if (overview.loading && !overview.data) return <Loading />;
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />;
  const a = overview.data;

  const choose = async (route) => {
    setState({ busy: route, error: null });
    try {
      await api.put('/academy/route', { route });
      await overview.reload();
      setState({ busy: null, error: null });
      navigate(route === 'MARKETS' ? `${basePath}/academia/filtro` : `${basePath}/academia/m/7`);
    } catch (error) {
      setState({ busy: null, error });
    }
  };

  return (
    <ModuleLayout overview={a} kicker={tr('Selección de ruta')} title={tr('¿Cómo quieres continuar tu educación?')} subtitle={tr('Ya conoces tu situación financiera, tus productos y la estructura de tu portafolio.')}>
      <div className="notice">
        <b>{tr('Importante:')}</b>{' '}{tr('la Ruta de Mercados es')}{' '}<span className="gold-text">{tr('opcional')}</span>{tr('. Sus módulos son educativos e informativos. No necesitas operar, hacer trading ni utilizar estrategias de QLC para continuar con tu educación financiera.')}
      </div>
      {!a.routeAvailable && <div className="notice gold">{tr('Completa el Módulo 3 para elegir tu ruta.')}</div>}
      <FormError error={state.error} />
      <div className="route-grid">
        {ROUTES.map((r) => (
          <article key={r.key} className={`route-card ${a.route === r.key ? 'is-selected' : ''} ${r.key === 'MARKETS' ? 'is-markets' : 'is-patrimonial'}`}>
            <div className="route-top">
              <span className="route-badge">{tr(r.badge)}</span>
              {a.route === r.key && <Pill>{tr('Ruta seleccionada')}</Pill>}
            </div>
            <h2>{tr(r.title)}</h2>
            <p className="muted">{tr(r.text)}</p>
            <ul className="route-modules">
              {r.modules.map(([n, t, d]) => (<li key={n}><span>{n}</span><div><b>{tr(t)}</b><small>{tr(d)}</small></div></li>))}
            </ul>
            {canEdit && (
              <Button variant={r.key === 'MARKETS' ? 'primary' : 'secondary'} disabled={!a.routeAvailable} loading={state.busy === r.key} onClick={() => choose(r.key)}>
                {tr(r.cta)} →
              </Button>
            )}
            <p className="small muted">{tr(r.note)}</p>
          </article>
        ))}
      </div>
      <p className="center small muted">{tr('Puedes estudiar la Ruta de Mercados por conocimiento aunque nunca tengas intención de operar. Podrás cambiar de ruta más adelante.')}</p>
    </ModuleLayout>
  );
}

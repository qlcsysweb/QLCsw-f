import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { date } from '../../../utils/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { FormError } from '../../../components/ui/Form.jsx';
import { ErrorState, Loading } from '../../../components/ui/States.jsx';
import { ModuleLayout } from '../../../features/academy/ModuleLayout.jsx';
import { modulePath, useAcademy } from '../../../features/academy/useAcademy.js';
import { tr } from '../../../i18n/tr.js';

const M4_INTRO = [
  'En este módulo comprenderás por qué el trading puede generar rendimientos significativos y cómo el apalancamiento amplifica los resultados de una operación, tanto positivos como negativos. Aprenderás a distinguir entre el capital que aportas, la exposición que asumes y el riesgo al que realmente estás sometido.',
  'La gestión del riesgo y del capital es uno de los pilares de QLC y una de nuestras principales especialidades. Nuestro enfoque se centra en comprender, medir y administrar la exposición financiera para tomar decisiones con mayor control y disciplina.',
  'A través de nuestro simulador, podrás observar cómo un mismo movimiento del mercado produce resultados diferentes según el nivel de apalancamiento y la exposición utilizada.',
];
const M4_WARNING = 'Sin embargo, un mayor potencial de rentabilidad también implica un mayor riesgo de pérdida.';
const M4_OUTRO = [
  'Los beneficios nunca están garantizados y una operación apalancada puede ocasionar pérdidas importantes, incluso superiores al margen aportado, dependiendo del instrumento y de sus condiciones.',
  'Por ello, es fundamental mantener una exposición prudente en relación con el patrimonio total, evitar concentrar demasiado capital en una sola operación y priorizar la preservación del capital sobre la búsqueda de rendimientos elevados.',
  'Nuestro objetivo no es asumir el máximo riesgo posible, sino gestionar el capital de manera estratégica, consciente y sostenible.',
];

function Module4Intro({ to, label }) {
  return (
    <article className="m4-intro" aria-labelledby="m4-intro-title">
      <span className="section-kicker">{tr('Antes de comenzar el Módulo 4')}</span>
      <h3 id="m4-intro-title">{tr('Riesgo, exposición y gestión profesional del capital')}</h3>
      {M4_INTRO.map((p) => <p key={p}>{tr(p)}</p>)}
      <p className="m4-intro-warning"><b>{tr(M4_WARNING)}</b>{' '}{tr(M4_OUTRO[0])}</p>
      {M4_OUTRO.slice(1).map((p) => <p key={p}>{tr(p)}</p>)}
      <Link className="btn-primary" to={to}>{tr(label)}</Link>
    </article>
  );
}

const QUESTIONS = [
  { id: 'q1', group: 'A · Conceptos básicos de trading', text: '¿Qué significa abrir una posición LONG?', options: [['1', 'Buscar beneficiarse de una subida del precio.'], ['0a', 'Buscar beneficiarse únicamente de una caída del precio.'], ['0b', 'Mantener el dinero fuera del mercado.']] },
  { id: 'q2', text: '¿Qué es el apalancamiento?', options: [['1', 'Permite controlar una exposición mayor utilizando una cantidad menor de margen.'], ['0a', 'Garantiza una mayor rentabilidad.'], ['0b', 'Elimina el riesgo de una operación.']] },
  { id: 'q3', text: '¿Qué representa el drawdown?', options: [['1', 'Una caída desde un máximo de referencia hasta un mínimo posterior.'], ['0a', 'La comisión que cobra un exchange.'], ['0b', 'El precio de entrada de una operación.']] },
  { id: 'q4', group: 'B · Manejo básico de un exchange', text: '¿Sabes localizar en un exchange un mercado de futuros o derivados y distinguirlo del mercado spot?', options: [['1', 'Sí, sé identificar la diferencia y dónde se encuentra.'], ['0a', 'No, todavía no sé hacerlo.']] },
  { id: 'q5', text: '¿Sabes qué significan conceptos como margen, posición, precio de entrada y precio de liquidación?', options: [['1', 'Sí, conozco su significado básico.'], ['0a', 'Conozco algunos, pero no sé realmente cómo funcionan.']] },
  { id: 'q6', text: '¿Has utilizado al menos las funciones básicas de un exchange, como consultar saldo, abrir/cerrar una posición o revisar una operación?', options: [['1', 'Sí, sé realizar o identificar esas funciones básicas.'], ['0a', 'No, nunca las he utilizado.']] },
];

export default function MarketFilterPage() {
  const { api, basePath, canEdit } = useWorkspace();
  const overview = useAcademy();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });

  if (overview.loading && !overview.data) return <Loading />;
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />;
  const a = overview.data;
  const complete = QUESTIONS.every((q) => answers[q.id]);

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null });
    try {
      const payload = Object.fromEntries(QUESTIONS.map((q) => [q.id, answers[q.id] === '1' ? 1 : 0]));
      setResult(await api.post('/academy/market-filter', { answers: payload }));
      await overview.reload();
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  return (
    <ModuleLayout overview={a} kicker={tr('Ruta de Mercados')} title={tr('¿Estás preparado para la Ruta de Mercados?')} subtitle="No evaluamos si eres rentable ni si sabes desarrollar estrategias; únicamente si tienes la base para comprender los Módulos 4–6.">
      {a.filter.passed && !result && (
        <div className="filter-result is-pass">
          <b>✓ Filtro aprobado{a.filter.last ? ` el ${date(a.filter.last.createdAt)}` : ''}.</b>
          <span>{tr('Tienes la base necesaria para continuar con la Ruta de Mercados.')}</span>
        </div>
      )}
      {a.filter.passed && !result && <Module4Intro to={modulePath(basePath, 4)} label="Ir al Módulo 4 →" />}
      <form className="filter-form" onSubmit={submit}>
        {QUESTIONS.map((q, i) => (
          <fieldset key={q.id} className="filter-q">
            {q.group && <div className="filter-group">{tr(q.group)}</div>}
            <legend><span>{i + 1}.</span> {tr(q.text)}</legend>
            <div className="filter-options">
              {q.options.map(([value, label]) => (
                <label key={value} className={answers[q.id] === value ? 'is-selected' : ''}>
                  <input type="radio" name={q.id} value={value} checked={answers[q.id] === value} onChange={() => setAnswers({ ...answers, [q.id]: value })} disabled={!canEdit} />
                  <span>{tr(label)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <FormError error={state.error} />
        {canEdit && <Button type="submit" disabled={!complete} loading={state.busy}>{complete ? tr('Evaluar conocimientos →') : tr('Responde las 6 preguntas')}</Button>}
      </form>
      {result && (
        <div className={`filter-result ${result.passed ? 'is-pass' : 'is-fail'}`} role="status">
          {result.passed ? (
            <>
              <b>{tr('✓ Filtro aprobado.')}</b>
              <span>{tr('Tienes la base necesaria para continuar con la Ruta de Mercados. Trading')}{' '}{result.tradingScore}/3 · Exchange {result.exchangeScore}/3.</span>
            </>
          ) : (
            <>
              <b>{tr('⚠ Antes de continuar, te recomendamos reforzar los conceptos básicos.')}</b>
              <span>{tr('Los Módulos 4–6 utilizan conceptos operativos. No necesitas ser profesional, pero sí comprender cómo funciona un exchange y los fundamentos del trading. Puedes continuar con la educación patrimonial (Módulos 7–12) y volver a esta ruta cuando tengas la base necesaria.')}</span>
              <div className="form-actions">
                <Button variant="secondary" onClick={() => { setResult(null); setAnswers({}); }}>{tr('Intentar de nuevo')}</Button>
                <Link className="btn-secondary" to={`${basePath}/academia/ruta`}>{tr('Ver rutas')}</Link>
              </div>
            </>
          )}
        </div>
      )}
      {result?.passed && <Module4Intro to={modulePath(basePath, 4)} label="Comenzar Módulo 4 →" />}
    </ModuleLayout>
  );
}

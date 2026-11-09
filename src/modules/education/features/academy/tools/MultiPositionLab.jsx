import { useMemo, useState } from 'react';
import { pct, signedUsd, usd } from '../../../utils/format.js';
import { options } from '../../../utils/labels.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Field, Input, MoneyInput, Select } from '../../../components/ui/Form.jsx';
import { MetricCard, MetricGrid, RiskNote, SimBadge, ToolCard } from '../ResultParts.jsx';
import {
  MAX_POSITIONS, START_PRICE, applyMove, closeAll, createPositions, estimatedRisk, exposureOf, initialState, randomMove, riskPctOfMargin, summarize, validate,
} from '../multiPosition.js';
import { tr } from '../../../i18n/tr.js';

const VOLATILITY_OPTIONS = [
  { value: 'BAJA', label: 'Baja (±0.75% por ronda)' },
  { value: 'MEDIA', label: 'Media (±1.5% por ronda)' },
  { value: 'ALTA', label: 'Alta (±3% por ronda)' },
];
const STATUS = { OPEN: ['Abierta', 'info'], TP: ['Cerrada por TP', 'good'], SL: ['Cerrada por SL', 'bad'], MANUAL: ['Cerrada manualmente', 'warn'] };
const toneOf = (v) => (Math.abs(v) < 0.005 ? '' : v > 0 ? 'up' : 'down');
const signedPct = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%`;

const CONCEPTS = [
  ['Capital operativo total', 'Límite de capital del escenario. La suma de los márgenes asignados no debe superarlo.'],
  ['Margen asignado', 'Capital destinado como margen a una posición; no es lo mismo que la exposición nominal.'],
  ['Exposición nominal', 'Margen × apalancamiento: el tamaño nominal de la posición en el modelo.'],
  ['LONG y SHORT', 'LONG obtiene un resultado favorable si el precio sube; SHORT, si baja, antes de considerar costos.'],
  ['Take profit (TP)', 'Movimiento porcentual favorable desde la entrada que activa el cierre simulado.'],
  ['Stop loss (SL)', 'Movimiento porcentual adverso desde la entrada que activa el cierre simulado.'],
  ['Riesgo estimado', 'Pérdida estimada al SL = exposición nominal × SL %. También se muestra como porcentaje del margen asignado.'],
  ['Resultado neto', 'Suma de resultados realizados y no realizados de las posiciones del escenario.'],
  ['Drawdown máximo', 'Mayor caída porcentual desde el máximo de balance registrado por la simulación.'],
];
const HOW_TO = [
  'Configura el escenario: capital operativo, número de posiciones, apalancamiento máximo y volatilidad.',
  'Revisa el mercado simulado: el precio inicial es BTC/USDT 100,000. Cada ronda genera un movimiento aleatorio dentro del rango elegido; no es una cotización en tiempo real.',
  'Configura cada posición: entrada, LONG/SHORT, margen, apalancamiento, TP y SL. El sistema calcula exposición, resultado y riesgo estimado.',
  'Pulsa «Generar movimiento del mercado» y observa el efecto en las posiciones abiertas. Las que alcanzan TP o SL se cierran según las reglas del modelo.',
  'Ejecuta diez rondas para observar una secuencia de movimientos, el balance combinado y cuántas posiciones siguen abiertas.',
  'Pulsa «Cerrar posiciones y evaluar» para cerrar las posiciones restantes al precio simulado actual y revisar el resultado final.',
  'Reinicia y compara escenarios modificando una sola variable a la vez: margen, apalancamiento, TP, SL o volatilidad.',
];
const OBSERVE = [
  'Una subida puede favorecer a LONG y perjudicar a SHORT; una caída puede producir el efecto contrario.',
  'Posiciones con diferentes márgenes y apalancamientos tienen exposiciones distintas, aunque compartan el mismo precio de referencia.',
  'El resultado agregado puede ser positivo aunque algunas posiciones pierdan, o negativo aunque algunas ganen.',
  'Un apalancamiento mayor aumenta la exposición para un mismo margen y puede amplificar ganancias y pérdidas.',
  'El TP y el SL modifican cuándo se cierran las posiciones en el modelo.',
  'El drawdown importa porque el recorrido del balance puede ser distinto del resultado final.',
];
const QUESTIONS = [
  'Si BTC/USDT sube, ¿qué efecto esperas en una posición LONG y en una SHORT?',
  '¿Cuál es la diferencia entre margen asignado y exposición nominal?',
  '¿Por qué el sistema calcula el riesgo estimado en lugar de pedirte que introduzcas manualmente ese resultado?',
  '¿Puede un portafolio multiposición tener posiciones ganadoras y perdedoras al mismo tiempo? ¿Qué debes revisar para evaluar el conjunto?',
  '¿Por qué un resultado positivo en una simulación aleatoria no demuestra que exista una ventaja estadística?',
  '¿Qué variables cambiarías para comparar dos escenarios de forma ordenada?',
];

function LabClass() {
  return (
    <details className="mpl-class">
      <summary>{tr('Clase: cómo funciona este laboratorio')}</summary>
      <p>{tr('En esta práctica aprenderás cómo se comporta un portafolio de varias posiciones cuando todas están expuestas a los movimientos de un mismo mercado. Cada operación puede tener dirección, margen, apalancamiento y reglas de salida diferentes; por eso, un mismo movimiento de BTC/USDT no produce el mismo resultado en todas las posiciones. El objetivo no es predecir el mercado ni prometer rentabilidad: es comprender la exposición, el resultado agregado, las salidas por TP o SL y el drawdown en un escenario simulado.')}</p>
      <h4>{tr('Conceptos fundamentales')}</h4>
      <dl className="mpl-concepts">{CONCEPTS.map(([t, d]) => <div key={t}><dt>{tr(t)}</dt><dd>{tr(d)}</dd></div>)}</dl>
      <h4>{tr('Cómo utilizar la interfaz')}</h4>
      <ol>{HOW_TO.map((t) => <li key={t}>{tr(t)}</li>)}</ol>
      <h4>{tr('¿Qué debes observar?')}</h4>
      <ul>{OBSERVE.map((t) => <li key={t}>{tr(t)}</li>)}</ul>
      <h4>{tr('Preguntas para comprobar tu aprendizaje')}</h4>
      <ol>{QUESTIONS.map((t) => <li key={t}>{tr(t)}</li>)}</ol>
      <p><b>{tr('Conclusión:')}</b>{' '}{tr('la gestión multiposición no consiste solamente en contar cuántas operaciones ganan, sino en entender cómo se combinan dirección, tamaño, apalancamiento y reglas de salida para producir un resultado global. La simulación permite practicar estas relaciones; no sustituye un plan de riesgo real ni representa una predicción.')}</p>
    </details>
  );
}

function readingNotes(s, check, capital) {
  const notes = [];
  if (!s.results.length) return notes;
  if (s.winners && s.losers) notes.push(tr('El resultado agregado es {net} aunque {w} posiciones ganan y {l} pierden: hay que evaluar el conjunto, no cada operación aislada.', { net: signedUsd(s.net), w: s.winners, l: s.losers }));
  if (s.open) notes.push(tr('La exposición nominal abierta es {exp}, {x} veces el capital operativo.', { exp: usd(s.openExposure), x: (s.openExposure / capital).toFixed(2) }));
  if (s.open) notes.push(tr('Si todas las posiciones abiertas tocaran su SL, la pérdida estimada sería {risk} ({p} del capital).', { risk: usd(s.openRisk), p: pct((s.openRisk / capital) * 100) }));
  if (s.maxDrawdown > 0) notes.push(tr('El drawdown máximo del recorrido fue {dd}: el balance llegó a caer aunque el resultado final pueda ser distinto.', { dd: pct(s.maxDrawdown) }));
  if (check.available > 0) notes.push(tr('Quedan {amount} de capital sin asignar como margen.', { amount: usd(check.available) }));
  return notes;
}

export function MultiPositionLab() {
  const [state, setState] = useState(() => initialState());
  const check = useMemo(() => validate(state), [state]);
  const s = useMemo(() => summarize(state), [state]);
  const capital = Number(state.capital) || 0;
  const started = state.rounds.length > 0;
  const anyOpen = s.open > 0;
  const maxAbs = Math.max(1, ...s.results.map((r) => Math.abs(r.result)));

  const setConfig = (key) => (e) => {
    const value = key === 'volatility' ? e.target.value : e.target.value === '' ? '' : Number(e.target.value);
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'count') return { ...initialState({ ...next, count: Math.min(MAX_POSITIONS, Math.max(1, Number(value) || 1)) }) };
      if (key === 'maxLeverage') next.positions = prev.positions.map((p) => (p.status === 'OPEN' ? { ...p, leverage: Math.min(Number(p.leverage) || 1, value) } : p));
      if (key === 'capital' && !started) next.peak = Number(value) || 0;
      return next;
    });
  };
  const setPosition = (id, key, value) => setState((prev) => ({ ...prev, positions: prev.positions.map((p) => (p.id === id ? { ...p, [key]: key === 'direction' ? value : value === '' ? '' : Number(value) } : p)) }));
  const move = (rounds) => setState((prev) => {
    let next = prev;
    for (let i = 0; i < rounds && next.positions.some((p) => p.status === 'OPEN'); i += 1) next = applyMove(next, randomMove(next.volatility));
    return next;
  });
  const reset = () => setState((prev) => ({ ...prev, price: START_PRICE, positions: createPositions(prev.count, prev.capital, prev.maxLeverage), rounds: [], peak: Number(prev.capital) || 0, maxDrawdown: 0 }));

  return (
    <section className="mpl">
      <header className="mpl-head">
        <div>
          <span className="section-kicker">{tr('QLC Financial Education · Módulo 6 · Operación profesional')}</span>
          <h2>{tr('Laboratorio de gestión multiposición')}</h2>
        </div>
        <SimBadge />
      </header>
      <LabClass />

      <ToolCard step="1" title={tr('Configuración general del escenario')} description={tr('Cambiar el número de posiciones reinicia el escenario con posiciones de ejemplo editables.')}>
        <div className="form-grid cols-4">
          <Field label={tr('Capital operativo (USD)')}><MoneyInput min="1" value={state.capital} onChange={setConfig('capital')} /></Field>
          <Field label={tr('Número de posiciones')}><Input type="number" min="1" max={MAX_POSITIONS} step="1" value={state.count} onChange={setConfig('count')} /></Field>
          <Field label={tr('Apalancamiento máximo')}><Select value={state.maxLeverage} onChange={setConfig('maxLeverage')} options={options.leverage} /></Field>
          <Field label={tr('Volatilidad simulada')}><Select value={state.volatility} onChange={setConfig('volatility')} options={VOLATILITY_OPTIONS} /></Field>
        </div>
        <div className={`mpl-capital ${check.excess > 0 ? 'is-over' : ''}`}>
          <span>{tr('Margen asignado: {a} de {c}', { a: usd(check.allocated), c: usd(capital) })}</span>
          <b>{check.excess > 0 ? tr('Exceso: {amount}', { amount: usd(check.excess) }) : tr('Disponible: {amount}', { amount: usd(check.available) })}</b>
        </div>
      </ToolCard>

      <ToolCard step="2" title={tr('Mercado simulado')} description={tr('Precio simulado con movimientos aleatorios. No es una cotización en vivo ni una predicción.')}>
        <div className="mpl-market">
          <div className="mpl-price">
            <span>BTC/USDT · {tr('precio simulado')}</span>
            <strong>{usd(state.price)}</strong>
            <small className={toneOf(s.priceChange)}>{signedPct(s.priceChange)} {tr('desde {start}', { start: usd(START_PRICE) })} · {tr('Ronda {n}', { n: state.rounds.length })}</small>
          </div>
          <div className="mpl-controls">
            <Button onClick={() => move(1)} disabled={!check.valid || !anyOpen}>{tr('Generar movimiento del mercado')}</Button>
            <Button variant="secondary" onClick={() => move(10)} disabled={!check.valid || !anyOpen}>{tr('Ejecutar 10 rondas')}</Button>
            <Button variant="secondary" onClick={() => setState(closeAll)} disabled={!anyOpen || !check.valid}>{tr('Cerrar posiciones y evaluar')}</Button>
            <Button variant="secondary" onClick={reset}>{tr('Reiniciar')}</Button>
          </div>
        </div>
        {check.errors.map((e) => <p key={e} className="down small">{tr(e)}</p>)}
        <MetricGrid cols={4}>
          <MetricCard label={tr('Resultado neto')} value={signedUsd(s.net)} tone={s.net > 0 ? 'good' : s.net < 0 ? 'bad' : ''} hint={tr('Realizado {r} · flotante {f}', { r: signedUsd(s.realized), f: signedUsd(s.floating) })} />
          <MetricCard label={tr('Balance simulado')} value={usd(s.balance)} hint={tr('Capital + resultado neto')} />
          <MetricCard label={tr('Ganadoras / perdedoras')} value={`${s.winners} / ${s.losers}`} hint={tr('{n} posiciones abiertas', { n: s.open })} />
          <MetricCard label={tr('Drawdown máximo')} value={pct(s.maxDrawdown)} tone={s.maxDrawdown > 10 ? 'bad' : s.maxDrawdown > 5 ? 'warn' : ''} hint={tr('Desde el máximo de balance simulado')} />
        </MetricGrid>
      </ToolCard>

      <ToolCard step="3" title={tr('Posiciones individuales')} description={tr('Edita las posiciones abiertas. Exposición, riesgo estimado y resultado se calculan solos.')}>
        <div className="mpl-scroll">
          <table className="table mpl-table">
            <thead>
              <tr>
                <th>ID</th><th>{tr('Entrada USD')}</th><th>{tr('Dirección')}</th><th>{tr('Margen USD')}</th><th>{tr('Apalancamiento')}</th>
                <th>TP %</th><th>SL %</th><th className="right">{tr('Exposición')}</th><th className="right">{tr('Riesgo estimado')}</th><th className="right">{tr('Resultado USD')}</th><th>{tr('Estado')}</th>
              </tr>
            </thead>
            <tbody>
              {state.positions.map((p) => {
                const open = p.status === 'OPEN';
                const result = s.results.find((r) => r.id === p.id).result;
                const field = (key, props = {}) => <input className="input" type="number" inputMode="decimal" min="0" step="any" aria-label={`${p.id} ${key}`} value={p[key]} onChange={(e) => setPosition(p.id, key, e.target.value)} disabled={!open} {...props} />;
                return (
                  <tr key={p.id} className={open ? '' : 'is-closed'}>
                    <td><b>{p.id}</b></td>
                    <td>{field('entry', { className: 'input mpl-wide' })}</td>
                    <td>
                      <select className="input" aria-label={`${p.id} dirección`} value={p.direction} onChange={(e) => setPosition(p.id, 'direction', e.target.value)} disabled={!open}>
                        <option value="LONG">LONG</option><option value="SHORT">SHORT</option>
                      </select>
                    </td>
                    <td>{field('margin', { className: 'input mpl-wide' })}</td>
                    <td>{field('leverage', { min: '1', max: String(state.maxLeverage), step: '1' })}</td>
                    <td>{field('tp')}</td>
                    <td>{field('sl')}</td>
                    <td className="right">{usd(exposureOf(p))}</td>
                    <td className="right">{usd(estimatedRisk(p))}<small className="block muted">{tr('{p} del margen', { p: pct(riskPctOfMargin(p)) })}</small></td>
                    <td className={`right ${toneOf(result)}`}>{signedUsd(result)}</td>
                    <td><span className={`status-chip tone-${STATUS[p.status][1]}`}>{tr(STATUS[p.status][0])}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ToolCard>

      <div className="tool-grid">
        <ToolCard step="4" title={tr('Lectura educativa')} description={tr('Interpretación automática del escenario simulado.')}>
          <ul className="mpl-notes">{readingNotes(s, check, capital || 1).map((n) => <li key={n}>{n}</li>)}</ul>
          <div className="mpl-dist" aria-label={tr('Distribución de resultados')}>
            {s.results.map((r) => (
              <div key={r.id} className="mpl-dist-row">
                <span>{r.id}</span>
                <span className="mpl-dist-track"><span className={r.result >= 0 ? 'is-up' : 'is-down'} style={{ width: `${(Math.abs(r.result) / maxAbs) * 50}%` }} /></span>
                <b className={toneOf(r.result)}>{signedUsd(r.result)}</b>
              </div>
            ))}
          </div>
        </ToolCard>
        <ToolCard step="5" title={tr('Registro de rondas')} description={tr('Cada movimiento simulado y las posiciones que se cerraron.')}>
          {state.rounds.length === 0 ? <p className="empty-inline">{tr('Genera un movimiento para iniciar el registro.')}</p> : (
            <div className="mpl-scroll mpl-log">
              <table className="table">
                <thead><tr><th>{tr('Ronda')}</th><th className="right">{tr('Movimiento')}</th><th className="right">{tr('Precio')}</th><th className="right">{tr('Balance')}</th><th>{tr('Cierres')}</th></tr></thead>
                <tbody>
                  {[...state.rounds].reverse().map((r) => (
                    <tr key={r.round}>
                      <td>{r.round}</td>
                      <td className={`right ${toneOf(r.move)}`}>{r.manual ? tr('Cierre manual') : signedPct(r.move)}</td>
                      <td className="right">{usd(r.price)}</td>
                      <td className="right">{usd(r.balance)}</td>
                      <td>{r.closed.length ? r.closed.join(', ') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ToolCard>
      </div>

      <RiskNote>{tr('Aviso educativo: los movimientos son aleatorios y no representan cotizaciones reales, pronósticos, una estrategia validada ni una garantía de rentabilidad. El riesgo estimado es una simplificación (exposición × SL %) y el modelo no incluye comisiones, deslizamiento, financiación, margen de mantenimiento ni reglas reales de liquidación. Las posiciones se cierran exactamente en el umbral de TP o SL.')}</RiskNote>
    </section>
  );
}

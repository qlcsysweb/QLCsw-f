export const START_PRICE = 100000;
export const VOLATILITY = { BAJA: 0.75, MEDIA: 1.5, ALTA: 3 };
export const MAX_POSITIONS = 10;

const TEMPLATES = [
  { direction: 'LONG', share: 0.15, leverage: 3, tp: 4, sl: 2 },
  { direction: 'SHORT', share: 0.15, leverage: 2, tp: 3, sl: 1.5 },
  { direction: 'LONG', share: 0.1, leverage: 5, tp: 6, sl: 3 },
  { direction: 'SHORT', share: 0.1, leverage: 3, tp: 5, sl: 2.5 },
  { direction: 'LONG', share: 0.2, leverage: 2, tp: 3, sl: 1.5 },
];

const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? 0 : Number(v));
const round2 = (v) => Math.round(v * 100) / 100;

export function createPositions(count, capital, maxLeverage) {
  const n = Math.min(MAX_POSITIONS, Math.max(1, Math.floor(num(count))));
  const shares = Array.from({ length: n }, (_, i) => TEMPLATES[i % TEMPLATES.length].share).reduce((a, s) => a + s, 0);
  const scale = Math.min(1, 0.7 / shares);
  return Array.from({ length: n }, (_, i) => {
    const t = TEMPLATES[i % TEMPLATES.length];
    return {
      id: `P${i + 1}`,
      entry: START_PRICE,
      direction: t.direction,
      margin: Math.max(1, Math.floor((num(capital) * t.share * scale) / 10) * 10),
      leverage: Math.min(t.leverage, Math.max(1, num(maxLeverage))),
      tp: t.tp,
      sl: t.sl,
      status: 'OPEN',
      exitPrice: null,
    };
  });
}

export const exposureOf = (p) => num(p.margin) * num(p.leverage);
export const estimatedRisk = (p) => (exposureOf(p) * num(p.sl)) / 100;
export const riskPctOfMargin = (p) => (num(p.margin) > 0 ? (estimatedRisk(p) / num(p.margin)) * 100 : 0);

export function favorableMove(p, price) {
  const entry = num(p.entry);
  if (entry <= 0) return 0;
  const move = ((price - entry) / entry) * 100;
  return p.direction === 'SHORT' ? -move : move;
}

export function resultOf(p, price) {
  const at = p.status === 'OPEN' ? price : p.exitPrice;
  return (exposureOf(p) * favorableMove(p, at)) / 100;
}

function thresholdPrice(p, kind) {
  const entry = num(p.entry);
  const up = (pctMove) => entry * (1 + pctMove / 100);
  const down = (pctMove) => entry * (1 - pctMove / 100);
  if (kind === 'TP') return p.direction === 'SHORT' ? down(num(p.tp)) : up(num(p.tp));
  return p.direction === 'SHORT' ? up(num(p.sl)) : down(num(p.sl));
}

export function validate(state) {
  const allocated = state.positions.reduce((a, p) => a + num(p.margin), 0);
  const capital = num(state.capital);
  const errors = [];
  if (capital <= 0) errors.push('El capital operativo debe ser mayor a 0.');
  if (allocated > capital) errors.push('La suma de márgenes supera el capital operativo.');
  if (state.positions.some((p) => p.status === 'OPEN' && (num(p.margin) <= 0 || num(p.entry) <= 0 || num(p.tp) <= 0 || num(p.sl) <= 0))) errors.push('Cada posición abierta necesita entrada, margen, TP y SL mayores a 0.');
  if (state.positions.some((p) => num(p.leverage) < 1 || num(p.leverage) > num(state.maxLeverage))) errors.push('El apalancamiento de cada posición debe estar entre 1x y el máximo global.');
  return { allocated, available: capital - allocated, excess: Math.max(0, allocated - capital), errors, valid: errors.length === 0 };
}

export function initialState({ capital = 10000, count = 5, maxLeverage = 5, volatility = 'MEDIA' } = {}) {
  return { capital, count, maxLeverage, volatility, price: START_PRICE, positions: createPositions(count, capital, maxLeverage), rounds: [], peak: num(capital), maxDrawdown: 0 };
}

export function summarize(state) {
  const capital = num(state.capital);
  const results = state.positions.map((p) => ({ id: p.id, status: p.status, result: resultOf(p, state.price) }));
  const realized = results.filter((r) => r.status !== 'OPEN').reduce((a, r) => a + r.result, 0);
  const floating = results.filter((r) => r.status === 'OPEN').reduce((a, r) => a + r.result, 0);
  const open = state.positions.filter((p) => p.status === 'OPEN');
  return {
    price: state.price,
    priceChange: ((state.price - START_PRICE) / START_PRICE) * 100,
    realized,
    floating,
    net: realized + floating,
    balance: capital + realized + floating,
    winners: results.filter((r) => r.result > 0.005).length,
    losers: results.filter((r) => r.result < -0.005).length,
    open: open.length,
    openExposure: open.reduce((a, p) => a + exposureOf(p), 0),
    openRisk: open.reduce((a, p) => a + estimatedRisk(p), 0),
    maxDrawdown: state.maxDrawdown,
    results,
  };
}

function track(state, entry) {
  const { balance, net } = summarize(state);
  const peak = Math.max(state.peak, balance);
  const drawdown = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
  return { ...state, peak, maxDrawdown: Math.max(state.maxDrawdown, drawdown), rounds: [...state.rounds, { ...entry, price: state.price, balance: round2(balance), net: round2(net), drawdown: round2(drawdown) }] };
}

export function applyMove(state, movePct) {
  const price = state.price * (1 + movePct / 100);
  const closed = [];
  const positions = state.positions.map((p) => {
    if (p.status !== 'OPEN') return p;
    const fav = favorableMove(p, price);
    if (fav >= num(p.tp)) {
      closed.push(`${p.id} TP`);
      return { ...p, status: 'TP', exitPrice: thresholdPrice(p, 'TP') };
    }
    if (-fav >= num(p.sl)) {
      closed.push(`${p.id} SL`);
      return { ...p, status: 'SL', exitPrice: thresholdPrice(p, 'SL') };
    }
    return p;
  });
  return track({ ...state, price, positions }, { round: state.rounds.length + 1, move: movePct, closed });
}

export const randomMove = (volatility, rng = Math.random) => round2((rng() * 2 - 1) * (VOLATILITY[volatility] ?? VOLATILITY.MEDIA));

export function closeAll(state) {
  if (!state.positions.some((p) => p.status === 'OPEN')) return state;
  const closed = state.positions.filter((p) => p.status === 'OPEN').map((p) => `${p.id} manual`);
  const positions = state.positions.map((p) => (p.status === 'OPEN' ? { ...p, status: 'MANUAL', exitPrice: state.price } : p));
  return track({ ...state, positions }, { round: state.rounds.length + 1, move: 0, closed, manual: true });
}

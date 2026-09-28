// Indicadores públicos de Bitget administrados en Admin → Resultados · Bitget
// (TrackRecord.roi30d / TrackRecord.winRate). Si el admin no configuró un
// valor, se muestra "—": nunca se presenta una cifra inventada.
export const EMPTY_METRIC = '—';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// ROI 30D → "+12.34%" / "-3.10%" / "0.00%"
export function formatRoi(value) {
  const n = toNumber(value);
  if (n === null) return EMPTY_METRIC;
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// Tasa de éxito → "78%" / "78.5%"
export function formatWinRate(value) {
  const n = toNumber(value);
  if (n === null) return EMPTY_METRIC;
  return `${Number(n.toFixed(2))}%`;
}

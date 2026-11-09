import { useMemo } from 'react';

const WIDTH = 1800;
const HEIGHT = 900;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildCandles({ seed, count, top, bottom }) {
  const rand = seeded(seed);
  const step = WIDTH / count;
  let price = 0.5;
  const raw = Array.from({ length: count }, () => {
    const open = price;
    price = Math.min(0.95, Math.max(0.05, price + (rand() - 0.47) * 0.09));
    const close = price;
    const high = Math.max(open, close) + rand() * 0.04;
    const low = Math.min(open, close) - rand() * 0.04;
    return { open, close, high, low };
  });
  const y = (v) => bottom - v * (bottom - top);
  return raw.map((c, i) => ({
    x: i * step + step / 2,
    width: step * 0.56,
    up: c.close >= c.open,
    bodyTop: y(Math.max(c.open, c.close)),
    bodyHeight: Math.max(2, Math.abs(y(c.open) - y(c.close))),
    wickTop: y(c.high),
    wickBottom: y(c.low),
    close: y(c.close),
  }));
}

const linePath = (candles) => candles.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.close.toFixed(1)}`).join(' ');

function CandleSeries({ candles, className }) {
  return (
    <g className={className}>
      {candles.map((c) => (
        <g key={c.x} className={c.up ? 'tb-up' : 'tb-down'}>
          <line x1={c.x} x2={c.x} y1={c.wickTop} y2={c.wickBottom} />
          <rect x={c.x - c.width / 2} y={c.bodyTop} width={c.width} height={c.bodyHeight} rx="1.5" />
        </g>
      ))}
    </g>
  );
}

export function TradingBackdrop() {
  const { front, back } = useMemo(() => ({
    front: buildCandles({ seed: 7919, count: 64, top: 300, bottom: 760 }),
    back: buildCandles({ seed: 104729, count: 96, top: 140, bottom: 560 }),
  }), []);

  return (
    <div className="trading-backdrop" aria-hidden="true">
      <svg className="tb-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="tb-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke="rgba(91,212,255,0.07)" strokeWidth="1" />
          </pattern>
          <linearGradient id="tb-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,168,255,0.22)" />
            <stop offset="100%" stopColor="rgba(0,168,255,0)" />
          </linearGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#tb-grid)" />
        <g className="tb-drift-slow">
          <CandleSeries candles={back} className="tb-series tb-back" />
        </g>
        <g className="tb-drift">
          <path className="tb-area" d={`${linePath(front)} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`} />
          <CandleSeries candles={front} className="tb-series tb-front" />
          <path className="tb-line" d={linePath(front)} pathLength="1" />
        </g>
      </svg>
      <div className="tb-glow" />
      <div className="tb-sweep" />
      <div className="tb-vignette" />
    </div>
  );
}

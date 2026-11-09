import './MarketBackdrop.css';

const WIDTH = 1600;
const HEIGHT = 900;
const CANDLES = 44;
const BOOK_ROWS = 22;
const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT', 'ADA/USDT', 'LINK/USDT', 'AVAX/USDT'];

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildCandles() {
  const rand = seeded(48271);
  const step = WIDTH / CANDLES;
  const top = 110;
  const bottom = 680;
  let price = 0;
  const raw = Array.from({ length: CANDLES }, () => {
    const open = price;
    price += (rand() - 0.44) * 0.16;
    const close = price;
    return { open, close, high: Math.max(open, close) + rand() * 0.05, low: Math.min(open, close) - rand() * 0.05 };
  });
  // Se escala a la altura disponible para que el movimiento siempre se aprecie.
  const lowest = Math.min(...raw.map((c) => c.low));
  const highest = Math.max(...raw.map((c) => c.high));
  const y = (v) => bottom - ((v - lowest) / (highest - lowest)) * (bottom - top);
  return raw.map(({ open, close, high, low }, i) => {
    return {
      x: i * step + step / 2,
      width: step * 0.56,
      up: close >= open,
      bodyTop: y(Math.max(open, close)),
      bodyHeight: Math.max(3, Math.abs(y(open) - y(close))),
      wickTop: y(high),
      wickBottom: y(low),
      close: y(close),
    };
  });
}

function buildBook(seed) {
  const rand = seeded(seed);
  return Array.from({ length: BOOK_ROWS }, () => 18 + rand() * 82);
}

const CANDLE_DATA = buildCandles();
const PRICE_LINE = CANDLE_DATA.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.close.toFixed(1)}`).join(' ');
const BIDS = buildBook(16807);
const ASKS = buildBook(69621);

function OrderBook({ side, rows }) {
  // Las filas van duplicadas para que el desplazamiento vuelva a empezar sin salto.
  return (
    <div className={`qlc-market-book is-${side}`}>
      <div className="qlc-market-book-track">
        {[...rows, ...rows].map((width, i) => (
          <span key={i} style={{ width: `${width}%`, '--row': i % BOOK_ROWS }} />
        ))}
      </div>
    </div>
  );
}

export default function MarketBackdrop() {
  return (
    <div className="qlc-market" aria-hidden="true">
      <div className="qlc-market-tape">
        <div className="qlc-market-tape-track">
          {[...PAIRS, ...PAIRS, ...PAIRS, ...PAIRS].map((pair, i) => (
            <span key={i} className={i % 3 === 1 ? 'is-down' : 'is-up'}>
              {pair} <b>{i % 3 === 1 ? '▼' : '▲'}</b>
            </span>
          ))}
        </div>
      </div>

      <svg className="qlc-market-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="qlc-market-grid" width="80" height="60" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V60" fill="none" stroke="rgba(150,190,220,0.07)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#qlc-market-grid)" />
        {CANDLE_DATA.map((c, i) => (
          <g key={c.x} className={`qlc-market-candle ${c.up ? 'is-up' : 'is-down'}`} style={{ animationDelay: `${i * 0.32}s` }}>
            <line x1={c.x} x2={c.x} y1={c.wickTop} y2={c.wickBottom} />
            <rect x={c.x - c.width / 2} y={c.bodyTop} width={c.width} height={c.bodyHeight} rx="2" />
          </g>
        ))}
        <path className="qlc-market-line" d={PRICE_LINE} pathLength="1" />
      </svg>

      <OrderBook side="bid" rows={BIDS} />
      <OrderBook side="ask" rows={ASKS} />

      <svg className="qlc-market-depth" viewBox="0 0 1600 220" preserveAspectRatio="none">
        <path className="is-bid" d="M0 20 L160 44 L300 62 L430 96 L560 128 L680 170 L790 220 L0 220 Z" />
        <path className="is-ask" d="M1600 34 L1450 52 L1300 86 L1160 104 L1020 146 L900 176 L810 220 L1600 220 Z" />
      </svg>
    </div>
  );
}

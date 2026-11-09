import { useLanguage } from '../../../i18n/LanguageContext';

/*
 * Gráficas de "El problema", reconstruidas a partir de las que muestra el
 * video de VisualEconomik (valores aproximados leídos de las gráficas). Se
 * dibujan en SVG para que sus textos se traduzcan al idioma seleccionado.
 */

// Rentabilidad anormal acumulada (CAR, %) por día del evento.
const DAYS = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280];
const INSTITUTIONS = [0.3, 1.3, 1.6, 1.9, 2.1, 2.1, 2.3, 2.5, 2.7, 3.0, 3.1, 3.3, 3.5, 3.7, 3.9, 4.1, 4.1, 3.8, 3.7, 3.6, 3.5, 3.5, 3.5, 3.5, 3.4, 3.3, 3.4, 3.5, 3.5, 3.4];
const INDIVIDUALS = [-0.3, -1.3, -1.6, -2.0, -2.1, -2.1, -2.3, -2.5, -2.7, -3.0, -3.1, -3.3, -3.5, -3.7, -3.9, -4.0, -4.1, -3.8, -3.7, -3.6, -3.4, -3.4, -3.5, -3.5, -3.4, -3.3, -3.3, -3.5, -3.5, -3.4];

// % de traders por periodo: superan / igualan / peor que el mercado.
const PERIODS = [
  { label: '1897-1914', beat: 21, match: 79, under: 0 },
  { label: '1915-1938', beat: 22, match: 78, under: 0 },
  { label: '1939-1962', beat: 43, match: 57, under: 0 },
  { label: '1962-1986', beat: 0, match: 51, under: 49 },
  { label: '1987-1996', beat: 0, match: 87, under: 13 },
  { label: '1997-2011', beat: 0, match: 73, under: 27 },
];

const C = { green: '#2fe39a', red: '#ff3d6e', orange: '#f39a2b', yellow: '#f2d02c', bar: '#e5534b', axis: 'rgba(255,255,255,0.55)', grid: 'rgba(255,255,255,0.08)', text: '#c8d3df' };

function CarChart({ t }) {
  const x0 = 54, x1 = 500, y0 = 18, y1 = 250;
  const sx = (d) => x0 + (d / 280) * (x1 - x0);
  const sy = (v) => y0 + ((5 - v) / 10) * (y1 - y0);
  const path = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${sx(DAYS[i]).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label={t('problemaCharts.c1Title')}>
      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? C.axis : C.grid} strokeWidth={v === 0 ? 1.4 : 1} />
          <text x={x0 - 8} y={sy(v) + 4} textAnchor="end" fontSize="11" fill={C.text}>
            {v === 0 ? '0' : `${v}%`}
          </text>
        </g>
      ))}
      <line x1={x0} x2={x0} y1={y0} y2={y1} stroke={C.axis} />
      {[0, 40, 80, 120, 160, 200, 240, 280].map((d) => (
        <text key={d} x={sx(d)} y={y1 + 16} textAnchor="middle" fontSize="11" fill={C.text}>
          {d}
        </text>
      ))}
      <text x={(x0 + x1) / 2} y={y1 + 36} textAnchor="middle" fontSize="12" fill={C.text}>
        {t('problemaCharts.c1XAxis')}
      </text>
      <text x={14} y={(y0 + y1) / 2} textAnchor="middle" fontSize="12" fill={C.text} transform={`rotate(-90 14 ${(y0 + y1) / 2})`}>
        CAR
      </text>
      <path d={path(INSTITUTIONS)} fill="none" stroke={C.green} strokeWidth="2.6" strokeLinejoin="round" />
      <path d={path(INDIVIDUALS)} fill="none" stroke={C.red} strokeWidth="2.6" strokeLinejoin="round" />
      <text x={sx(205)} y={sy(4.4)} fontSize="13" fontWeight="700" fill="#fff">
        {t('problemaCharts.c1Institutions')}
      </text>
      <text x={sx(205)} y={sy(-2.6)} fontSize="13" fontWeight="700" fill="#fff">
        {t('problemaCharts.c1Individuals')}
      </text>
    </svg>
  );
}

function BeatChart({ t }) {
  const x0 = 46, x1 = 370, y0 = 14, y1 = 240;
  const sy = (v) => y1 - (v / 100) * (y1 - y0);
  const slot = (x1 - x0) / PERIODS.length;
  const bw = slot * 0.56;
  const legend = [
    { color: C.orange, label: t('problemaCharts.c2Beat') },
    { color: C.yellow, label: t('problemaCharts.c2Match') },
    { color: C.bar, label: t('problemaCharts.c2Under') },
  ];
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label={t('problemaCharts.c2Title')}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={sy(v)} y2={sy(v)} stroke={C.grid} />
          <text x={x0 - 8} y={sy(v) + 4} textAnchor="end" fontSize="11" fill={C.text}>
            {v === 0 ? '0' : `${v}%`}
          </text>
        </g>
      ))}
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={C.axis} />
      <line x1={x0} x2={x0} y1={y0} y2={y1} stroke={C.axis} />
      {PERIODS.map((p, i) => {
        const x = x0 + slot * i + (slot - bw) / 2;
        // De abajo hacia arriba: peor que el mercado → igualan → superan.
        const parts = [
          { v: p.under, color: C.bar },
          { v: p.match, color: C.yellow },
          { v: p.beat, color: C.orange },
        ];
        let acc = 0;
        const cx = x + bw / 2;
        return (
          <g key={p.label}>
            {parts.map((part, j) => {
              if (!part.v) return null;
              const top = sy(acc + part.v);
              const h = sy(acc) - top;
              acc += part.v;
              return <rect key={j} x={x} y={top} width={bw} height={h} fill={part.color} />;
            })}
            <text x={cx} y={y1 + 14} textAnchor="end" fontSize="10.5" fill={C.text} transform={`rotate(-40 ${cx} ${y1 + 14})`}>
              {p.label}
            </text>
          </g>
        );
      })}
      {legend.map((l, i) => (
        <g key={l.label} transform={`translate(384 ${24 + i * 22})`}>
          <rect width="11" height="11" y="-9" fill={l.color} />
          <text x="17" fontSize="11" fill={C.text}>
            {l.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ProblemaCharts() {
  const { t } = useLanguage();
  return (
    <div className="problema-charts">
      <figure className="problema-chart">
        <figcaption>
          <strong>{t('problemaCharts.c1Title')}</strong>
          <span>{t('problemaCharts.c1Sub')}</span>
        </figcaption>
        <CarChart t={t} />
      </figure>
      <figure className="problema-chart">
        <figcaption>
          <strong>{t('problemaCharts.c2Title')}</strong>
          <span>{t('problemaCharts.c2Sub')}</span>
        </figcaption>
        <BeatChart t={t} />
      </figure>
      <p className="problema-charts-source">{t('problemaCharts.source')}</p>
    </div>
  );
}

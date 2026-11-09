import { money, pct } from '../../utils/format.js';
import { tr } from '../../i18n/tr.js';

export const READING_TONE = { EQUILIBRADA: 'good', MODERADA: 'warn', CONCENTRADA: 'bad', MUY_CONCENTRADA: 'bad' };

const READING_SUMMARY = {
  EQUILIBRADA: 'Tu portafolio está distribuido en varias categorías y ninguna domina la estructura.',
  MODERADA: 'Tu portafolio tiene cierta diversificación, pero hay puntos que conviene revisar.',
  CONCENTRADA: 'Una parte importante de tu portafolio depende de pocas categorías.',
  MUY_CONCENTRADA: 'Tu portafolio depende casi por completo de una o muy pocas categorías.',
};

function readingNotes(reading, shares = []) {
  const share = (key) => shares.find((s) => s.key === key)?.share ?? 0;
  const top = shares.reduce((a, s) => (s.share > (a?.share ?? -1) ? s : a), null);
  const highRisk = share('ALTO_RIESGO');
  const liquidity = share('LIQUIDEZ');
  const notes = [];
  if (top) notes.push(tr('La categoría principal es {label} con {pct} del total.', { label: tr(top.label), pct: pct(top.share) }));
  if (highRisk > 20) notes.push(tr('La exposición a alto riesgo ({pct}) supera el 20% del portafolio.', { pct: pct(highRisk) }));
  else if (highRisk > 0) notes.push(tr('La exposición a alto riesgo representa {pct} del portafolio.', { pct: pct(highRisk) }));
  else notes.push(tr('No hay productos clasificados como alto riesgo.'));
  if (liquidity < 5) notes.push(tr('La liquidez es baja ({pct}); revisa si cubre imprevistos.', { pct: pct(liquidity) }));
  else if (liquidity > 40) notes.push(tr('La liquidez es alta ({pct}); una parte podría no estar trabajando.', { pct: pct(liquidity) }));
  notes.push(tr('Utilizas {n} de 6 categorías.', { n: reading.categoriesUsed }));
  return notes;
}

const PARTS = [
  ['diversification', 'Diversificación por categorías', '30%'],
  ['concentration', 'Concentración de la categoría principal', '30%'],
  ['highRisk', 'Exposición a alto riesgo', '20%'],
  ['liquidity', 'Liquidez', '10%'],
  ['categories', 'Número de categorías', '10%'],
];

export function AllocationBars({ allocation, format = money }) {
  return (
    <div className="alloc-bars">
      {allocation.shares.map((s) => (
        <div key={s.key} className={`alloc-row ${s.amount > 0 ? '' : 'is-empty'}`}>
          <div className="alloc-row-head"><span>{tr(s.label)}</span><b>{pct(s.share)}</b></div>
          <div className="alloc-track"><span style={{ width: `${s.share}%` }} /></div>
          <small>{format(s.amount)}</small>
          {s.items?.length > 0 && (
            <ul className="alloc-items">
              {s.items.map((item, i) => <li key={`${item.name}-${i}`}><span>{tr(item.name)}</span><span>{format(item.amount)}</span></li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function ReadingCard({ reading, shares }) {
  if (!reading) return <div className="reading is-empty">{tr('Registra productos para obtener la lectura educativa.')}</div>;
  return (
    <div className={`reading tone-${READING_TONE[reading.key]}`}>
      <div className="reading-head">
        <span>{tr('Lectura educativa')}</span>
        <strong>{tr(reading.label)}</strong>
        <em>{reading.score} / 100</em>
      </div>
      <div className="reading-summary">
        <p>{tr(READING_SUMMARY[reading.key])}</p>
        <ul>{readingNotes(reading, shares).map((n) => <li key={n}>{n}</li>)}</ul>
      </div>
      <ul className="reading-parts">
        {PARTS.map(([key, label, weight]) => (
          <li key={key}>
            <span>{tr(label)} <small>({weight})</small></span>
            <span className="reading-meter"><span style={{ width: `${reading.parts[key]}%` }} /></span>
            <b>{tr(reading.parts[key])}</b>
          </li>
        ))}
      </ul>
      <p className="reading-note">
        {tr('“Equilibrada” no significa portafolio recomendado, seguro ni correcto. Significa únicamente que la estructura presenta una distribución relativamente diversificada y sin una concentración dominante según los parámetros educativos definidos por QLC.')}
      </p>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { tr } from '../../i18n/tr.js';

const PARTS = [
  ['SEGURO_GASTOS_MEDICOS', 'Gastos médicos mayores', 20],
  ['SEGURO_VIDA', 'Seguro de vida', 20],
  ['SEGURO_RETIRO', 'Seguro de retiro o renta vitalicia', 10],
  ['SEGURO_AUTO', 'Seguro de auto', 10],
  ['SEGURO_DESEMPLEO', 'Seguro de desempleo', 10],
  ['SEGURO_EDUCACION', 'Seguro educativo', 5],
];
const LEVELS = [
  [75, 'Protección excelente', 'good'],
  [50, 'Protección buena', 'good'],
  [25, 'Protección básica', 'warn'],
  [0, 'Protección insuficiente', 'bad'],
];

export function protectionReading(protection, monthsCovered) {
  const types = protection?.insuranceTypes || [];
  const months = Number(monthsCovered) || 0;
  const liquidity = Math.min(25, Math.round((months / 3) * 25));
  const parts = [
    ...PARTS.map(([type, label, weight]) => ({ key: type, label, weight, points: types.includes(type) ? weight : 0 })),
    { key: 'LIQUIDEZ', label: 'Fondo de emergencia (3 meses o más)', weight: 25, points: liquidity },
  ];
  const score = parts.reduce((acc, p) => acc + p.points, 0);
  const [, label, tone] = LEVELS.find(([min]) => score >= min);
  const missing = parts.filter((p) => p.points < p.weight);
  return { score, label, tone, parts, missing, hasInsurance: types.length > 0 };
}

export function ProtectionReadingCard({ protection, monthsCovered, onRegister }) {
  const { basePath } = useWorkspace();
  const r = protectionReading(protection, monthsCovered);
  return (
    <Card
      title={tr('Lectura educativa de protección patrimonial')}
      actions={onRegister
        ? <button type="button" className="btn-secondary" onClick={onRegister}>{tr('Registrar seguros')}</button>
        : <Link className="btn-secondary" to={`${basePath}/proteccion`}>{tr('Registrar seguros')}</Link>}
    >
      <div className="protection-reading">
        <div>
          <strong className={`reading-score tone-${r.tone}`}>{tr(r.label)}</strong>
          <span className="small muted">{r.score} / 100 · {tr('educativa')}</span>
        </div>
        <ul className="small">
          {r.missing.length === 0
            ? <li className="up">{tr('Tienes registradas las coberturas principales y un fondo de emergencia suficiente.')}</li>
            : r.missing.map((p) => <li key={p.key}>{p.key === 'LIQUIDEZ' ? tr('Tu liquidez cubre menos de 3 meses de gastos.') : tr('Sin registro: {label}.', { label: tr(p.label) })}</li>)}
        </ul>
      </div>
      <div className="protection-bars">
        {r.parts.map((p) => (
          <div key={p.key} className="protection-bar">
            <span>{tr(p.label)} <small className="muted">({p.weight}%)</small></span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(p.points / p.weight) * 100}%` }} /></div>
            <b>{p.points}</b>
          </div>
        ))}
      </div>
      <p className="small muted">{tr('Escala: 0–24 insuficiente · 25–49 básica · 50–74 buena · 75–100 excelente.')}</p>
      <p className="small muted">{tr('Lectura educativa con parámetros de QLC: no es una recomendación de seguros. Se calcula con las pólizas que registras en Protección patrimonial y con tus meses de liquidez.')}</p>
    </Card>
  );
}

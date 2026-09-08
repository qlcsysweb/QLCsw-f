import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STEPS = [
  { type: 'CONTRACT', num: '01', label: 'Contrato', hint: 'Sube tu contrato firmado', to: '/client/contract' },
  { type: 'FUNDS', num: '02', label: 'Fondos disponibles', hint: 'QLC confirmará este paso', to: null },
  { type: 'PAYMENT', num: '03', label: 'Pago', hint: 'Reporta tu pago', to: '/client/payments' },
  { type: 'API', num: '04', label: 'Conexión API', hint: 'QLC confirmará este paso', to: null },
  { type: 'ACTIVATION', num: '05', label: 'Activación', hint: 'QLC activará tu cuenta', to: null },
];

const STATUS_INFO = {
  CONFIRMED: { text: '✓ Completado', className: 'ok' },
  REJECTED: { text: '! Requiere atención', className: 'danger' },
  PENDING: { text: '○ Pendiente', className: 'warn' },
};

export default function ProcessPage() {
  const [process, setProcess] = useState(null);

  useEffect(() => {
    api.get('/client/process').then(({ data }) => setProcess(data.process));
  }, []);

  if (!process) return <div className="qlc-empty">Cargando…</div>;

  const conditionFor = (type) => process.conditions.find((c) => c.type === type);

  return (
    <div>
      <div className="qlc-kicker">TU PROCESO</div>
      <h1 style={{ marginTop: 0 }}>Estado del proceso</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>
        Este es el estado real de tu proceso de activación. Cada paso lo confirma el equipo
        administrativo de QLC a medida que se completa.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 24 }}>
        {STEPS.map((step) => {
          const condition = conditionFor(step.type);
          const status = condition?.status || 'PENDING';
          const info = STATUS_INFO[status] || STATUS_INFO.PENDING;
          return (
            <div
              key={step.type}
              className="qlc-card"
              style={{
                borderColor:
                  status === 'CONFIRMED'
                    ? 'var(--qlc-ok-border)'
                    : status === 'REJECTED'
                    ? 'var(--qlc-danger-border)'
                    : 'var(--qlc-line)',
              }}
            >
              <div className="qlc-kicker">{step.num}</div>
              <strong style={{ display: 'block', margin: '6px 0' }}>{step.label}</strong>
              <span className={`qlc-badge ${info.className}`}>{info.text}</span>
              {status !== 'CONFIRMED' && step.to && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', margin: '0 0 8px' }}>
                    Necesitas completar este paso.
                  </p>
                  <Link className="qlc-btn primary" to={step.to} style={{ width: '100%', display: 'block', textAlign: 'center' }}>
                    {step.hint}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {process.isActivated && (
        <div className="qlc-card" style={{ marginTop: 20, borderColor: 'var(--qlc-ok-border)' }}>
          ✓ Tu cuenta está activada desde el {new Date(process.activatedAt).toLocaleDateString()}.
        </div>
      )}
    </div>
  );
}

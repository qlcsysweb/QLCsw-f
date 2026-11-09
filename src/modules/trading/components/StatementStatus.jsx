import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/*
 * ESTADO DE CUENTA SIMPLIFICADO — solo cuatro estados visuales:
 *   ⚪ NO GENERADO · 🟡 PENDIENTE DE PAGO · 🟢 PAGADO · 🔴 VENCIDO / SIN PAGAR
 *
 * El backend es la fuente de verdad (status + expiresAt). Este componente
 * solo dibuja el tiempo restante a partir de `expiresAt`; nunca guarda nada
 * en localStorage, así que es el mismo tras cerrar sesión o cambiar de
 * dispositivo. Si el contador llega a cero antes del siguiente refresco,
 * se muestra VENCIDO / SIN PAGAR (el backend aplica el mismo criterio).
 */
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const STATEMENT_STATUS_META = {
  NO_GENERADO: { icon: '⚪', className: 'muted', key: 'notGenerated' },
  // "Generado" se ilumina en azul (className "info") — es la señal de que
  // hay un estado de cuenta nuevo disponible para el cliente. Al marcarse
  // PAGADO deja de usar este color, y NO_GENERADO/VENCIDO nunca lo usan.
  PENDIENTE_DE_PAGO: { icon: '🔵', className: 'info', key: 'pending' },
  PAGADO: { icon: '🟢', className: 'success', key: 'paid' },
  VENCIDO_SIN_PAGAR: { icon: '🔴', className: 'danger', key: 'overdue' },
};

export function useRemainingMs(expiresAt, serverOffsetMs = 0) {
  const compute = () => (expiresAt ? new Date(expiresAt).getTime() - (Date.now() + serverOffsetMs) : null);
  const [remaining, setRemaining] = useState(compute);
  useEffect(() => {
    setRemaining(compute());
    if (!expiresAt) return undefined;
    const id = setInterval(() => setRemaining(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, serverOffsetMs]);
  return remaining;
}

export function formatRemaining(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

// Estado efectivo en pantalla (PENDIENTE que ya llegó a cero → VENCIDO).
export function effectiveStatus(status, remainingMs) {
  if (status === 'PENDIENTE_DE_PAGO' && remainingMs !== null && remainingMs <= 0) return 'VENCIDO_SIN_PAGAR';
  return status || 'NO_GENERADO';
}

export function StatementBadge({ status, large = false }) {
  const { t } = useLanguage();
  const meta = STATEMENT_STATUS_META[status] || STATEMENT_STATUS_META.NO_GENERADO;
  return (
    <span className={`qlc-badge ${meta.className}${large ? ' qlc-badge-lg' : ''}`}>
      <span aria-hidden="true">{meta.icon}</span> {t(`status.statement.${meta.key}`)}
    </span>
  );
}

// Contador: verde con más de 12 h, rojo con 12 h o menos. Solo existe
// mientras el estado es PENDIENTE DE PAGO.
export function StatementCountdown({ remainingMs }) {
  const { t } = useLanguage();
  if (remainingMs === null || remainingMs <= 0) return null;
  const urgent = remainingMs <= TWELVE_HOURS_MS;
  return (
    <span className={`qlc-countdown ${urgent ? 'urgent' : 'safe'}`} role="timer" aria-live="off">
      <span aria-hidden="true">{urgent ? '🔴' : '🟢'}</span>
      <span className="qlc-countdown-label">{t('statementStatus.timeLeft')}</span>
      <strong>{formatRemaining(remainingMs)}</strong>
    </span>
  );
}

// Badge + contador juntos (uso típico en tarjetas).
// onExpire: se llama una vez cuando el contador llega a cero, para que la
// pantalla vuelva a pedir el estado real al backend (fuente de verdad).
export default function StatementStatus({ status, expiresAt, serverOffsetMs = 0, large = false, onExpire }) {
  const remainingMs = useRemainingMs(status === 'PENDIENTE_DE_PAGO' ? expiresAt : null, serverOffsetMs);
  const shown = effectiveStatus(status, remainingMs);
  const expiredLocally = status === 'PENDIENTE_DE_PAGO' && shown === 'VENCIDO_SIN_PAGAR';
  useEffect(() => {
    if (expiredLocally) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiredLocally]);
  return (
    <div className="qlc-statement-status">
      <StatementBadge status={shown} large={large} />
      {shown === 'PENDIENTE_DE_PAGO' && <StatementCountdown remainingMs={remainingMs} />}
    </div>
  );
}

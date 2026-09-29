import { useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDateTime } from '../../utils/cdmxTime';

// Mismo formato y misma frase que valida el backend
// (client/apiSubaccountController.capitalDeclaration) — el backend es la
// fuente de verdad; esto solo habilita el botón en pantalla.
export const formatCapital = (value) => String(Number(value));
export const capitalDeclaration = (requiredCapital) =>
  `CONFIRMO QUE EL SALDO DE MI CUENTA ES DE ${formatCapital(requiredCapital)} USDT`;
const normalizePhrase = (s) => String(s || '').trim().replace(/\s+/g, ' ').toUpperCase();

/*
 * CONFIRMACIÓN DEL CAPITAL OPERATIVO — el ADMIN fija el capital requerido de
 * la subcuenta; el cliente solo DECLARA que lo tiene disponible escribiendo
 * la frase exacta. QLC no consulta el exchange: es una declaración del
 * cliente, que el admin revisa después. Una vez enviada, se muestra el
 * estado ("Capital reportado") en vez de volver a pedir la frase.
 */
export default function CapitalConfirmation({ subaccountId, requiredCapital, reports, onReported }) {
  const { t, language } = useLanguage();
  const [confirmation, setConfirmation] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const statusMap = PAYMENT_REPORT_STATUS(t);

  const hasCapital = requiredCapital != null && Number(requiredCapital) > 0;
  const expected = hasCapital ? capitalDeclaration(requiredCapital) : '';
  const matches = hasCapital && normalizePhrase(confirmation) === normalizePhrase(expected);

  // Confirmación vigente para el capital ACTUAL (si el admin cambia el
  // capital, se pide una confirmación nueva con el monto nuevo).
  const current = hasCapital
    ? reports.find((r) => r.status !== 'RECHAZADO' && Number(r.amount) === Number(requiredCapital))
    : null;
  const lastRejected = !current && reports[0]?.status === 'RECHAZADO' ? reports[0] : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!matches) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/client/api-subaccounts/${subaccountId}/capital-distribution-reports`, {
        confirmation: confirmation.trim(),
        note: note.trim() || undefined,
      });
      setConfirmation('');
      setNote('');
      onReported?.();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="qlc-capital">
      <div className="qlc-capital-amount">
        <span className="qlc-label" style={{ marginTop: 0 }}>{t('clientApiConnection.requiredCapital')}</span>
        {hasCapital ? (
          <strong>{formatCapital(requiredCapital)} USDT</strong>
        ) : (
          <span className="qlc-capital-pending">{t('clientApiConnection.requiredCapitalPending')}</span>
        )}
      </div>

      {current ? (
        <div className="qlc-capital-done" role="status">
          <div className="qlc-capital-done-title">✓ {t('clientApiConnection.capitalReportedTitle')}</div>
          <p>{t('clientApiConnection.capitalReportedText')}</p>
          <dl>
            <div>
              <dt>{t('clientApiConnection.confirmationDate')}</dt>
              <dd>{formatCdmxDateTime(current.reportedAt)}</dd>
            </div>
            <div>
              <dt>{t('clientApiConnection.status')}</dt>
              <dd>
                <span className={`qlc-badge ${statusOf(statusMap, current.status).className}`}>{statusOf(statusMap, current.status).text}</span>
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <form onSubmit={submit}>
          {lastRejected && (
            <p className="qlc-field-error" style={{ marginTop: 8 }}>
              {t('clientApiConnection.capitalRejected')}
              {lastRejected.reviewNote ? ` — ${lastRejected.reviewNote}` : ''}
            </p>
          )}
          {hasCapital && (
            <>
              <p className="qlc-capital-help">{t('clientApiConnection.confirmInstructions')}</p>
              <p className="qlc-capital-phrase">“{expected}”</p>
            </>
          )}
          <label className="qlc-label" htmlFor="capital-confirmation">
            {t('clientApiConnection.confirmationLabel')}
          </label>
          <input
            id="capital-confirmation"
            className="qlc-input"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={!hasCapital || sending}
            placeholder={hasCapital ? expected : ''}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={confirmation !== '' && !matches}
          />
          {confirmation !== '' && !matches && <p className="qlc-capital-mismatch">{t('clientApiConnection.confirmationMismatch')}</p>}
          <label className="qlc-label" htmlFor="capital-note">
            {t('clientApiConnection.distributionNote')}
          </label>
          <input id="capital-note" className="qlc-input" value={note} onChange={(e) => setNote(e.target.value)} disabled={!hasCapital || sending} />
          {error && <p className="qlc-field-error">{error}</p>}
          <button
            className="qlc-btn primary"
            style={{ marginTop: 10, width: '100%' }}
            disabled={!matches || sending}
            title={!hasCapital ? t('clientApiConnection.requiredCapitalPending') : undefined}
          >
            {sending ? t('common.sending') : t('clientApiConnection.reportCapitalReady')}
          </button>
        </form>
      )}

      {reports.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--qlc-muted)', marginBottom: 6 }}>{t('clientApiConnection.distributionHistory')}</div>
          <ul className="qlc-plain-list">
            {reports.map((r) => {
              const st = statusOf(statusMap, r.status);
              return (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                  <span>
                    {formatCapital(r.amount)} USDT — {formatCdmxDateTime(r.reportedAt)}
                  </span>
                  <span className={`qlc-badge ${st.className}`}>{st.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

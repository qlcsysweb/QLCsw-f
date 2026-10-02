import { useRef, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDateTime } from '../../utils/cdmxTime';
import ConfirmModal from '../../components/ConfirmModal';

export const formatCapital = (value) => String(Number(value));
// Capital operativo mínimo de QLC: aplica si el ADMIN no asignó un monto
// propio a la subcuenta (igual que el backend).
export const DEFAULT_REQUIRED_CAPITAL = 100;

// Declaraciones FIJAS autorizadas — mismas que valida el backend
// (client/apiSubaccountController.CAPITAL_DECLARATIONS), que es la fuente de
// verdad; aquí solo habilitan el botón. Se muestran SIEMPRE las dos, sin
// traducir ni depender del idioma de la plataforma.
export const CAPITAL_DECLARATIONS = {
  ES: 'CONFIRMO QUE DISPONGO DEL SALDO REQUERIDO EN MI CUENTA',
  EN: 'I CONFIRM THAT I HAVE THE REQUIRED BALANCE IN MY ACCOUNT',
};
const normalizePhrase = (s) => String(s || '').trim().replace(/\s+/g, ' ').toUpperCase();
const isValidDeclaration = (s) => Object.values(CAPITAL_DECLARATIONS).includes(normalizePhrase(s));

/*
 * CONFIRMACIÓN DEL CAPITAL OPERATIVO — el ADMIN fija el capital requerido de
 * la subcuenta; el cliente solo DECLARA que lo tiene disponible escribiendo
 * la frase exacta. QLC no consulta el exchange: es una declaración del
 * cliente, que el admin revisa después. Una vez enviada, se muestra el
 * estado ("Capital reportado") en vez de volver a pedir la frase.
 */
// Solo los reportes ya revisados por QLC se pueden borrar del historial.
const REVIEWED = ['APROBADO', 'RECHAZADO'];

export default function CapitalConfirmation({ subaccountId, requiredCapital, reports, current: serverCurrent = null, onReported, onRemoved }) {
  const { t, language } = useLanguage();
  const [confirmation, setConfirmation] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);
  // Bloqueo síncrono contra doble submit (el estado `sending` de React se
  // aplica en el siguiente render; la ref corta el segundo clic/Enter al
  // instante). El backend igualmente garantiza un único registro.
  const submittingRef = useRef(false);
  // Registro devuelto por el POST: se muestra de inmediato, sin esperar al
  // siguiente refresco, para que nunca reaparezca el formulario vacío.
  const [justReported, setJustReported] = useState(null);
  const statusMap = PAYMENT_REPORT_STATUS(t);

  const hasCapital = requiredCapital != null && Number(requiredCapital) > 0;
  // El cliente puede escribir la frase aunque el capital siga pendiente; solo
  // el ENVÍO espera a que el ADMIN asigne el capital (el backend lo exige).
  const phraseOk = isValidDeclaration(confirmation);
  const matches = hasCapital && phraseOk;

  // REGISTRO VIGENTE — lo decide el backend (`current`): la confirmación en
  // revisión, o la APROBADA para el mismo capital requerido. Mientras exista,
  // se muestra en lugar del formulario: el cliente no puede generar otra
  // confirmación del mismo requerimiento. Solo tras un rechazo, o si el admin
  // fija un capital requerido distinto, vuelve el formulario (operación nueva).
  const current =
    serverCurrent || (justReported && !reports.some((r) => r.id === justReported.id && r.status === 'RECHAZADO') ? justReported : null);
  const lastRejected = !current && reports[0]?.status === 'RECHAZADO' ? reports[0] : null;
  const approved = current?.status === 'APROBADO';

  const submit = async (e) => {
    e.preventDefault();
    if (!matches || submittingRef.current) return;
    submittingRef.current = true;
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/client/api-subaccounts/${subaccountId}/capital-distribution-reports`, {
        confirmation: confirmation.trim(),
        note: note.trim() || undefined,
      });
      setJustReported(data.report || null);
      setConfirmation('');
      setNote('');
      onReported?.();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      submittingRef.current = false;
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
          <div className="qlc-capital-done-title">
            ✓ {approved ? t('clientApiConnection.capitalApprovedTitle') : t('clientApiConnection.capitalReportedTitle')}
          </div>
          <p>{approved ? t('clientApiConnection.capitalApprovedText') : t('clientApiConnection.capitalReportedText')}</p>
          <dl>
            <div>
              <dt>{t('clientApiConnection.requiredCapital')}</dt>
              <dd>{formatCapital(current.amount)} USDT</dd>
            </div>
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
          {/* Las frases se muestran siempre (también con el capital pendiente)
              para que el cliente sepa qué confirmará; el campo y el botón
              solo se habilitan cuando el ADMIN fija el capital. */}
          {!hasCapital && <p className="qlc-capital-help">{t('clientApiConnection.capitalPendingHelp')}</p>}
          <p className="qlc-capital-help">{t('clientApiConnection.confirmInstructions')}</p>
          <div className="qlc-capital-phrases">
            {Object.entries(CAPITAL_DECLARATIONS).map(([lang, phrase]) => (
              <p key={lang} className="qlc-capital-phrase-row" lang={lang.toLowerCase()}>
                <span className="qlc-capital-phrase-lang">{lang}:</span>
                <span className="qlc-capital-phrase-text">{phrase}</span>
              </p>
            ))}
          </div>
          <label className="qlc-label" htmlFor="capital-confirmation">
            {t('clientApiConnection.confirmationLabel')}
          </label>
          <input
            id="capital-confirmation"
            className="qlc-input"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={sending}
            placeholder={t('clientApiConnection.confirmationPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={confirmation !== '' && !phraseOk}
          />
          {confirmation !== '' && !phraseOk && <p className="qlc-capital-mismatch">{t('clientApiConnection.confirmationMismatch')}</p>}
          {phraseOk && !hasCapital && <p className="qlc-capital-help" role="status">✓ {t('clientApiConnection.phraseOkCapitalPending')}</p>}
          <label className="qlc-label" htmlFor="capital-note">
            {t('clientApiConnection.distributionNote')}
          </label>
          <input id="capital-note" className="qlc-input" value={note} onChange={(e) => setNote(e.target.value)} disabled={sending} />
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className={`qlc-badge ${st.className}`}>{st.text}</span>
                    {REVIEWED.includes(r.status) && (
                      <button
                        type="button"
                        className="qlc-btn ghost qlc-case-delete qlc-icon-only"
                        onClick={() => setRemoving(r)}
                        title={t('clientApiConnection.deleteDistributionReport')}
                        aria-label={t('clientApiConnection.deleteDistributionReport')}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
                        </svg>
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {removing && (
        <ConfirmModal
          title={t('clientApiConnection.deleteDistributionReportTitle')}
          message={t('clientApiConnection.deleteDistributionReportMessage')
            .replace('{amount}', formatCapital(removing.amount))
            .replace('{date}', formatCdmxDateTime(removing.reportedAt))}
          confirmLabel={t('clientApiConnection.deleteDistributionReport')}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await api.delete(`/client/api-subaccounts/${subaccountId}/capital-distribution-reports/${removing.id}`);
            onRemoved?.();
          }}
        />
      )}
    </div>
  );
}

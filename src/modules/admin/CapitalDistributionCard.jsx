import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { PAYMENT_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDateTime } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import ConfirmModal from '../../components/ConfirmModal';

const ACTIVE = ['PENDING', 'EN_REVISION'];

// Datos de UNA confirmación de capital (declaración del CLIENTE, nunca una
// verificación automática del exchange).
function CapitalRecord({ report, t, statusMap }) {
  const s = statusOf(statusMap, report.status, 'PENDING');
  return (
    <dl className="qlc-transfer-data">
      <dt>{t('adminClientDetail.requiredCapital')}</dt>
      <dd>{Number(report.amount)} USDT</dd>
      <dt>{t('adminClientDetail.clientConfirmation')}</dt>
      <dd>{report.declaration ? t('adminClientDetail.clientConfirmed') : '—'}</dd>
      {report.declaration && (
        <>
          <dt>{t('adminClientDetail.declaration')}</dt>
          <dd>“{report.declaration}”</dd>
        </>
      )}
      {report.confirmationLanguage && (
        <>
          <dt>{t('adminClientDetail.confirmationLanguage')}</dt>
          <dd>{report.confirmationLanguage}</dd>
        </>
      )}
      <dt>{t('adminClientDetail.confirmationDate')}</dt>
      <dd>{formatCdmxDateTime(report.reportedAt)}</dd>
      {report.note && (
        <>
          <dt>{t('adminClientDetail.note')}</dt>
          <dd>{report.note}</dd>
        </>
      )}
      <dt>{t('adminClientDetail.reviewStatus')}</dt>
      <dd>
        <span className={`qlc-badge ${s.className}`}>{s.text}</span>
        {report.reviewedAt && !ACTIVE.includes(report.status) && (
          <span style={{ color: 'var(--qlc-muted2)' }}> · {formatCdmxDateTime(report.reviewedAt)}</span>
        )}
        {report.reviewNote && !ACTIVE.includes(report.status) && <span style={{ color: 'var(--qlc-muted2)' }}> · {report.reviewNote}</span>}
      </dd>
    </dl>
  );
}

/*
 * DISTRIBUCIÓN DE CAPITAL (admin) — se muestra primero el REGISTRO ACTUAL
 * (la confirmación más reciente) y las anteriores quedan plegadas en
 * "Ver historial". Mientras el registro actual no esté finalizado, el admin
 * prepara su revisión como BORRADOR (Guardar borrador = UPDATE del mismo
 * registro, sin avisar al cliente) y la FINALIZA confirmando o rechazando;
 * siempre es el mismo registro, nunca uno nuevo.
 */
export default function CapitalDistributionCard({ reports, onChanged, onMessage }) {
  const { t, language } = useLanguage();
  const statusMap = PAYMENT_REPORT_STATUS(t);
  const [showHistory, setShowHistory] = useState(false);
  const [note, setNote] = useState('');
  const [noteDirty, setNoteDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const busyRef = useRef(false);

  const current = reports[0] || null;
  const history = reports.slice(1);
  const isActive = current && ACTIVE.includes(current.status);
  const isDraft = current?.status === 'EN_REVISION';

  // La nota se precarga con el borrador guardado; el sondeo no pisa lo que
  // el admin está escribiendo.
  useEffect(() => {
    if (!noteDirty) setNote(current?.reviewNote || '');
  }, [current?.id, current?.reviewNote, noteDirty]);
  useEffect(() => {
    setNoteDirty(false);
  }, [current?.id]);

  const run = async (fn, okMessage) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
      setNoteDirty(false);
      if (okMessage) onMessage?.(okMessage);
      onChanged?.();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const saveDraft = () =>
    run(() => api.put(`/admin/capital-distribution-reports/${current.id}/draft`, { reviewNote: note.trim() }), t('adminClientDetail.draftSaved'));
  const finalize = (status) =>
    run(
      () => api.patch(`/admin/capital-distribution-reports/${current.id}`, { status, reviewNote: note.trim() }),
      t('adminClientDetail.paymentReviewed')
    );

  return (
    <div className="qlc-card">
      <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        {t('adminClientDetail.distributionReports')}
        {isDraft && <span className="qlc-badge muted">{t('adminClientDetail.draftBadge')}</span>}
      </h3>
      {!current ? (
        <div className="qlc-empty">{t('adminClientDetail.noDistributionReports')}</div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: 'var(--qlc-muted)', marginBottom: 6 }}>{t('adminClientDetail.currentRecord')}</div>
          <div className="qlc-transfer-item">
            <CapitalRecord report={current} t={t} statusMap={statusMap} />
            {isActive && (
              <>
                <label className="qlc-label" htmlFor="capital-review-note">
                  {t('adminClientDetail.reviewNoteDraft')}
                </label>
                <textarea
                  id="capital-review-note"
                  className="qlc-textarea"
                  rows={2}
                  maxLength={500}
                  value={note}
                  disabled={busy}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setNoteDirty(true);
                  }}
                />
                <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>{t('adminClientDetail.reviewNoteHint')}</p>
                {error && <p className="qlc-field-error">{error}</p>}
                <div className="qlc-transfer-actions">
                  <button type="button" className="qlc-btn ghost" disabled={busy} onClick={saveDraft}>
                    {t('adminClientDetail.saveDraft')}
                  </button>
                  <button type="button" className="qlc-btn primary" disabled={busy} onClick={() => finalize('APROBADO')}>
                    {t('adminClientDetail.confirm')}
                  </button>
                  <button type="button" className="qlc-btn ghost" disabled={busy} onClick={() => finalize('RECHAZADO')}>
                    {t('adminClientDetail.reject')}
                  </button>
                  {isDraft && (
                    <button type="button" className="qlc-btn danger" disabled={busy} onClick={() => setConfirmDiscard(true)}>
                      {t('adminClientDetail.deleteDraft')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          {history.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button type="button" className="qlc-btn ghost" onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}>
                {showHistory ? t('adminClientDetail.hideHistory') : t('adminClientDetail.showHistory').replace('{count}', history.length)}
              </button>
              {showHistory && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: '10px 0 6px' }}>{t('adminClientDetail.historyTitle')}</div>
                  <ul className="qlc-plain-list qlc-transfer-list">
                    {history.map((r) => (
                      <li key={r.id} className="qlc-transfer-item">
                        <CapitalRecord report={r} t={t} statusMap={statusMap} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </>
      )}
      {confirmDiscard && current && (
        <ConfirmModal
          title={t('adminClientDetail.deleteDraftTitle')}
          message={t('adminClientDetail.deleteDraftMessage')}
          confirmLabel={t('adminClientDetail.deleteDraft')}
          onClose={() => setConfirmDiscard(false)}
          onConfirm={() => run(() => api.delete(`/admin/capital-distribution-reports/${current.id}/draft`), t('adminClientDetail.draftDeleted'))}
        />
      )}
    </div>
  );
}

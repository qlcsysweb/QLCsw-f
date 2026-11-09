import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { formatDateOnly } from '../../utils/cdmxTime';

/*
 * Detalle de un estado de cuenta para el CLIENTE — los mismos datos que el
 * admin captura al generarlo (periodo, capitales, rendimiento, volatilidad,
 * resultado neto, comisión, actividad y notas). USDT solo en importes; el %
 * y la volatilidad se muestran tal cual.
 */
const money = (v) => (v === null || v === undefined || v === '' ? null : `${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`);

export default function StatementDetails({ statement }) {
  const { t } = useLanguage();
  const [viewing, setViewing] = useState(null);
  const s = statement;
  const rows = [
    [t('adminClientDetail.periodStart'), formatDateOnly(s.periodStart)],
    [t('adminClientDetail.periodEnd'), formatDateOnly(s.periodEnd)],
    [t('adminClientDetail.startingBalance'), money(s.startingBalance)],
    [t('adminClientDetail.endingBalance'), money(s.endingBalance)],
    [t('adminClientDetail.resultAmount'), money(s.resultAmount)],
    [t('adminClientDetail.resultPercentage'), s.resultPercentage != null ? `${Number(s.resultPercentage)} %` : null],
    [t('adminClientDetail.volatility'), s.volatility || null],
    [t('adminClientDetail.netResult'), money(s.netResult)],
    [t('adminClientDetail.commission'), money(s.commission)],
    // QLC Affiliate Program — distribución de la rentabilidad generada
    // (calculada al emitir sobre el resultado registrado por QLC).
    ...(s.clientResultAmount != null
      ? [
          [`${t('statementStatus.distClient')} (${Number(s.clientSharePct)}%)`, money(s.clientResultAmount)],
          [`${t('statementStatus.distQlc')} (${Number(s.qlcSharePct)}%)`, money(s.qlcCommissionAmount)],
          [`${t('statementStatus.distAffiliate')} (${Number(s.affiliateSharePct)}%)`, money(s.affiliateCommissionAmount)],
        ]
      : []),
  ].filter(([, v]) => v !== null && v !== '');

  return (
    <div className="qlc-statement-details">
      <dl className="qlc-statement-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {s.activityNotes && (
        <div className="qlc-statement-note">
          <strong>{t('adminClientDetail.activityNotes')}</strong>
          <p>{s.activityNotes}</p>
        </div>
      )}
      {s.adminNotes && (
        <div className="qlc-statement-note">
          <strong>{t('adminClientDetail.adminNotes')}</strong>
          <p>{s.adminNotes}</p>
        </div>
      )}
      {s.attachments?.length > 0 && (
        <div className="qlc-statement-note">
          <strong>{t('statementStatus.attachmentsTitle')}</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {s.attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                className="qlc-link-btn"
                onClick={() => setViewing({ url: `/client/statements/${s.id}/attachments/${a.id}`, fileName: a.fileName })}
              >
                📎 {a.fileName}
              </button>
            ))}
          </div>
        </div>
      )}
      {viewing && <DocumentViewerModal url={viewing.url} fileName={viewing.fileName} onClose={() => setViewing(null)} />}
    </div>
  );
}

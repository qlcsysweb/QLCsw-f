import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { STATEMENT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate } from '../../utils/cdmxTime';
import { useLanguage } from '../../i18n/LanguageContext';
import CountdownTimer from '../../components/CountdownTimer';

// CORREGIR(2).xlsx CLIENTE 39 — el cliente debe poder consultar TODOS sus
// estados de cuenta (de cualquier subcuenta/API) en un solo lugar,
// organizados por Año → Subcuenta/API → Periodo, en vez de tener que entrar
// subcuenta por subcuenta para verlos.
export default function StatementsPage() {
  const { t } = useLanguage();
  const [statements, setStatements] = useState(null);

  useEffect(() => {
    api.get('/client/statements').then(({ data }) => setStatements(data.statements));
  }, []);

  const statementStatusMap = STATEMENT_STATUS(t);

  if (!statements) return <div className="qlc-empty">{t('common.loading')}</div>;

  const groupedByYear = statements.reduce((acc, s) => {
    const year = new Date(s.periodStart).getFullYear();
    acc[year] = acc[year] || {};
    const key = s.apiSubaccount?.isPrincipal
      ? t('clientSubaccounts.principalLabel')
      : s.apiSubaccount?.identifier || t('clientSubaccounts.unassignedIdentifier');
    (acc[year][key] = acc[year][key] || []).push(s);
    return acc;
  }, {});
  const years = Object.keys(groupedByYear).sort((a, b) => b - a);

  return (
    <div>
      <div className="qlc-kicker">{t('clientStatements.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientStatements.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientStatements.intro')}</p>

      {statements.length === 0 ? (
        <div className="qlc-empty">{t('clientSubaccountDetail.noStatements')}</div>
      ) : (
        years.map((year) => (
          <div key={year} className="qlc-card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>{year}</h3>
            {Object.keys(groupedByYear[year]).map((subLabel) => (
              <div key={subLabel} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--qlc-blue2)', marginBottom: 6 }}>{subLabel}</div>
                <ul className="qlc-plain-list">
                  {groupedByYear[year][subLabel].map((s) => {
                    const stStatus = statusOf(statementStatusMap, s.displayStatus, 'DISPONIBLE');
                    return (
                      <li key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--qlc-line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <span>
                            {formatCdmxDate(s.periodStart)} – {formatCdmxDate(s.periodEnd)} · {s.resultPercentage}%
                          </span>
                          <span className={`qlc-badge ${stStatus.className}`}>{stStatus.text}</span>
                        </div>
                        {!s.commissionPaid && s.commissionDueAt && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--qlc-muted2)' }}>{t('clientSubaccountDetail.timeToPay')}</span>
                            <CountdownTimer deadline={s.commissionDueAt} expiredLabel={t('clientSubaccountDetail.deadlineExpired')} />
                          </div>
                        )}
                        {s.pdfDriveFileId && (
                          <a style={{ fontSize: 12 }} href={`${API_BASE_URL}/client/statements/${s.id}/download`} target="_blank" rel="noreferrer">
                            {t('clientSubaccountDetail.viewPdf')}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

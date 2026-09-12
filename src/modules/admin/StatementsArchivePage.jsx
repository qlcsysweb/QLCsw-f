import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import CountdownTimer from '../../components/CountdownTimer';

/*
 * CORREGIR.xlsx ADMIN 08 — sección dedicada para que el admin visualice,
 * descargue e historice/archive TODOS los estados de cuenta generados (no
 * solo desde la ficha puntual de una subcuenta).
 */
export default function StatementsArchivePage() {
  const { t, language } = useLanguage();
  const [statements, setStatements] = useState(null);
  const [filter, setFilter] = useState('active');
  const [error, setError] = useState('');

  const load = () => {
    const params = filter === 'all' ? {} : { archived: filter === 'archived' ? 'true' : 'false' };
    api
      .get('/admin/statements', { params })
      .then(({ data }) => setStatements(data.statements))
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const toggleArchived = async (statement) => {
    await api.patch(`/admin/statements/${statement.id}/archive`, { archived: !statement.archived });
    load();
  };

  // CORREGIR(2).xlsx ADMIN 06 — organización por año (derivada de
  // periodStart, sin depender de un campo nuevo en la base de datos) para
  // poder navegar el archivo completo sin que sea una sola lista plana.
  const groupedByYear = (statements || []).reduce((acc, s) => {
    const year = new Date(s.periodStart).getFullYear();
    (acc[year] = acc[year] || []).push(s);
    return acc;
  }, {});
  const years = Object.keys(groupedByYear).sort((a, b) => b - a);

  if (error) return <div className="qlc-empty">{error}</div>;

  return (
    <div>
      <div className="qlc-kicker">{t('adminStatementsArchive.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminStatementsArchive.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('adminStatementsArchive.intro')}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['active', 'archived', 'all'].map((f) => (
          <button
            key={f}
            className={`qlc-btn ${filter === f ? 'primary' : 'ghost'}`}
            onClick={() => setFilter(f)}
          >
            {t(`adminStatementsArchive.filter_${f}`)}
          </button>
        ))}
      </div>

      {!statements ? (
        <div className="qlc-empty">{t('common.loading')}</div>
      ) : statements.length === 0 ? (
        <div className="qlc-empty">{t('adminStatementsArchive.none')}</div>
      ) : (
        <div className="qlc-table-wrap">
          <table className="qlc-table">
            <thead>
              <tr>
                <th>{t('adminStatementsArchive.client')}</th>
                <th>{t('adminStatementsArchive.subaccount')}</th>
                <th>{t('adminStatementsArchive.period')}</th>
                <th>{t('adminClientDetail.startingBalance')}</th>
                <th>{t('adminClientDetail.endingBalance')}</th>
                <th>{t('adminClientDetail.resultPercentage')}</th>
                <th>{t('adminClientDetail.netResult')}</th>
                <th>{t('adminClientDetail.commission')}</th>
                <th>{t('adminStatementsArchive.payment')}</th>
                <th></th>
              </tr>
            </thead>
            {years.map((year) => (
              <tbody key={year}>
                <tr>
                  <td colSpan={10} style={{ background: 'var(--qlc-line)', fontWeight: 700, fontSize: 12 }}>
                    {year}
                  </td>
                </tr>
                {groupedByYear[year].map((s) => {
                  const paymentVigente = s.displayStatus !== 'PENDIENTE_DE_PAGO';
                  return (
                    <tr key={s.id}>
                      <td>
                        {s.apiSubaccount?.client?.firstName} {s.apiSubaccount?.client?.lastName}
                      </td>
                      <td>{s.apiSubaccount?.identifier || `#${s.apiSubaccount?.slotIndex}`}</td>
                      <td>
                        {new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}
                      </td>
                      <td>{s.startingBalance}</td>
                      <td>{s.endingBalance}</td>
                      <td>{s.resultPercentage}%</td>
                      <td>{s.netResult ?? '—'}</td>
                      <td>{s.commission}</td>
                      <td>
                        <span className={`qlc-badge ${paymentVigente ? 'ok' : 'warn'}`}>
                          {paymentVigente ? t('adminStatementsArchive.paymentVigente') : t('adminStatementsArchive.paymentPendiente')}
                        </span>
                        {!paymentVigente && s.commissionDueAt && (
                          <div style={{ marginTop: 4 }}>
                            <CountdownTimer deadline={s.commissionDueAt} expiredLabel={t('clientSubaccountDetail.deadlineExpired')} />
                          </div>
                        )}
                      </td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.pdfDriveFileId && (
                          <a className="qlc-btn ghost" href={`${API_BASE_URL}/admin/statements/${s.id}/download`} target="_blank" rel="noreferrer">
                            {t('adminStatementsArchive.download')}
                          </a>
                        )}
                        <button className="qlc-btn ghost" onClick={() => toggleArchived(s)}>
                          {s.archived ? t('adminStatementsArchive.unarchive') : t('adminStatementsArchive.archive')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}

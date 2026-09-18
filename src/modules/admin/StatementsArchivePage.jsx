import { Fragment, useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import CountdownTimer from '../../components/CountdownTimer';
import { STATEMENT_STATUS, statusOf } from '../../utils/statusLabels';

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
  const statementStatusMap = STATEMENT_STATUS(t);

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

  // El PDF se sirve "inline" (ver statementController.downloadStatementFile),
  // así que abrirlo en una pestaña nueva ya deja disponible el botón de
  // imprimir del visor nativo del navegador. Intentamos además disparar el
  // diálogo de impresión automáticamente cuando el navegador lo permite;
  // si no (por ejemplo por ser un origen distinto), el usuario igual puede
  // imprimir manualmente desde esa pestaña.
  const printStatement = (statement) => {
    const win = window.open(`${API_BASE_URL}/admin/statements/${statement.id}/download`, '_blank');
    if (win) {
      win.onload = () => {
        try {
          win.print();
        } catch {
          // El usuario puede imprimir manualmente desde el visor del navegador.
        }
      };
    }
  };

  // CORREGIR(2).xlsx ADMIN 06 / AUDITORÍA QLC PARTE 2 — organización por
  // Año → Mes (derivada de periodStart, sin depender de un campo nuevo en
  // la base de datos) para poder navegar el archivo completo sin que sea
  // una sola lista plana.
  const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = (m) => (language === 'en' ? MONTH_NAMES_EN[m] : MONTH_NAMES_ES[m]);

  const groupedByYear = (statements || []).reduce((acc, s) => {
    const periodDate = new Date(s.periodStart);
    const year = periodDate.getFullYear();
    const month = periodDate.getMonth();
    acc[year] = acc[year] || {};
    (acc[year][month] = acc[year][month] || []).push(s);
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
                <th>{t('adminStatementsArchive.username')}</th>
                <th>{t('adminStatementsArchive.client')}</th>
                <th>{t('adminStatementsArchive.subaccount')}</th>
                <th>{t('adminStatementsArchive.period')}</th>
                <th>{t('adminStatementsArchive.generatedAt')}</th>
                <th>{t('adminStatementsArchive.dueAt')}</th>
                <th>{t('adminClientDetail.startingBalance')} (USDT)</th>
                <th>{t('adminClientDetail.endingBalance')} (USDT)</th>
                <th>{t('adminClientDetail.resultPercentage')} (%)</th>
                <th>{t('adminClientDetail.netResult')} (USDT)</th>
                <th>{t('adminClientDetail.commission')} (USDT)</th>
                <th>{t('adminStatementsArchive.payment')}</th>
                <th></th>
              </tr>
            </thead>
            {years.map((year) => {
              const months = Object.keys(groupedByYear[year]).sort((a, b) => b - a);
              return (
              <tbody key={year}>
                <tr>
                  <td colSpan={13} style={{ background: 'var(--qlc-line)', fontWeight: 700, fontSize: 12 }}>
                    {year}
                  </td>
                </tr>
                {months.map((month) => (
                  <Fragment key={`${year}-${month}`}>
                    <tr>
                      <td colSpan={13} style={{ fontWeight: 600, fontSize: 11, color: 'var(--qlc-blue2)', paddingTop: 10 }}>
                        {monthName(Number(month))}
                      </td>
                    </tr>
                    {groupedByYear[year][month].map((s) => {
                  const stStatus = statusOf(statementStatusMap, s.displayStatus, 'DISPONIBLE');
                  const pendingPayment = s.displayStatus === 'GENERADO';
                  return (
                    <tr key={s.id}>
                      <td>{s.apiSubaccount?.client?.username || '—'}</td>
                      <td>
                        {s.apiSubaccount?.client?.firstName} {s.apiSubaccount?.client?.lastName}
                      </td>
                      <td>
                        {s.apiSubaccount?.isPrincipal
                          ? t('clientSubaccounts.principalLabel')
                          : s.apiSubaccount?.identifier || `#${s.apiSubaccount?.slotIndex}`}
                      </td>
                      <td>
                        {new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}
                      </td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>{s.commissionDueAt ? new Date(s.commissionDueAt).toLocaleString() : '—'}</td>
                      <td>{s.startingBalance}</td>
                      <td>{s.endingBalance}</td>
                      <td>{s.resultPercentage}%</td>
                      <td>{s.netResult ?? '—'}</td>
                      <td>{s.commission}</td>
                      <td>
                        <span className={`qlc-badge ${stStatus.className}`}>{stStatus.text}</span>
                        {pendingPayment && s.commissionDueAt && (
                          <div style={{ marginTop: 4 }}>
                            <CountdownTimer deadline={s.commissionDueAt} expiredLabel={t('clientSubaccountDetail.deadlineExpired')} />
                          </div>
                        )}
                      </td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.pdfDriveFileId && (
                          <>
                            <a className="qlc-btn ghost" href={`${API_BASE_URL}/admin/statements/${s.id}/download`} target="_blank" rel="noreferrer">
                              {t('adminStatementsArchive.download')}
                            </a>
                            <button type="button" className="qlc-btn ghost" onClick={() => printStatement(s)}>
                              {t('adminStatementsArchive.print')}
                            </button>
                          </>
                        )}
                        <button className="qlc-btn ghost" onClick={() => toggleArchived(s)}>
                          {s.archived ? t('adminStatementsArchive.unarchive') : t('adminStatementsArchive.archive')}
                        </button>
                      </td>
                    </tr>
                  );
                    })}
                  </Fragment>
                ))}
              </tbody>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}

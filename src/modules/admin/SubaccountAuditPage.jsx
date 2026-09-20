import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

/*
 * GESTIÓN DINÁMICA DE SUBCUENTAS §8 — herramienta de solo lectura para que
 * el admin identifique, subcuenta por subcuenta, cuáles activas parecen no
 * usarse todavía (sin identificador, sin API configurada, sin estados de
 * cuenta/pagos/documentos ni actividad de conexión). Nunca elimina nada
 * automáticamente: la decisión y la acción siempre las toma el admin desde
 * la ficha del cliente correspondiente.
 */
export default function SubaccountAuditPage() {
  const { t } = useLanguage();
  const [subaccounts, setSubaccounts] = useState(null);
  const [onlyCandidates, setOnlyCandidates] = useState(true);

  useEffect(() => {
    api.get('/admin/subaccounts/audit').then(({ data }) => setSubaccounts(data.subaccounts));
  }, []);

  if (!subaccounts) return <div className="qlc-empty">{t('common.loading')}</div>;

  const rows = onlyCandidates ? subaccounts.filter((s) => s.candidateForRemoval) : subaccounts;
  const candidateCount = subaccounts.filter((s) => s.candidateForRemoval).length;

  return (
    <div>
      <div className="qlc-kicker">{t('adminSubaccountAudit.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminSubaccountAudit.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 720 }}>{t('adminSubaccountAudit.intro')}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyCandidates} onChange={(e) => setOnlyCandidates(e.target.checked)} />
          {t('adminSubaccountAudit.onlyCandidates')} ({candidateCount})
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="qlc-empty">{t('adminSubaccountAudit.none')}</div>
      ) : (
        <div className="qlc-table-wrap">
          <table className="qlc-table">
            <thead>
              <tr>
                <th>{t('adminSubaccountAudit.client')}</th>
                <th>{t('adminSubaccountAudit.email')}</th>
                <th>{t('adminClientDetail.identifier')}</th>
                <th>{t('adminSubaccountAudit.createdAt')}</th>
                <th>{t('adminClientDetail.status')}</th>
                <th>{t('adminSubaccountAudit.statements')}</th>
                <th>{t('adminSubaccountAudit.payments')}</th>
                <th>{t('adminSubaccountAudit.documents')}</th>
                <th>{t('adminSubaccountAudit.activity')}</th>
                <th>{t('adminSubaccountAudit.candidate')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.clientName}</td>
                  <td>{s.clientEmail}</td>
                  <td>{s.identifier || '—'}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>{s.status}</td>
                  <td>{s.hasStatements ? '✓' : '—'}</td>
                  <td>{s.hasPayments ? '✓' : '—'}</td>
                  <td>{s.hasDocuments ? '✓' : '—'}</td>
                  <td>{s.hasActivity ? '✓' : '—'}</td>
                  <td>
                    {s.candidateForRemoval ? (
                      <span className="qlc-badge warn">{t('adminSubaccountAudit.candidateYes')}</span>
                    ) : (
                      <span className="qlc-badge muted">{t('adminSubaccountAudit.candidateNo')}</span>
                    )}
                  </td>
                  <td>
                    <Link className="qlc-btn ghost" to={`/admin/clients/${s.clientId}`}>
                      {t('adminClientsList.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

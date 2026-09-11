import { useEffect, useMemo, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

/*
 * CORREGIR.xlsx ADMIN 11/12/13 — bandeja de entrada de contratos (para
 * identificar los firmados recibidos y revisarlos), organización tipo
 * Google Drive por Año → Mes, y vigencia (inicio/vencimiento + alerta a
 * los 10 días generada por el backend).
 */
export default function ContractsInboxPage() {
  const { t, language } = useLanguage();
  const [contracts, setContracts] = useState(null);
  const [error, setError] = useState('');
  const [vigenciaDraft, setVigenciaDraft] = useState({});

  const load = () =>
    api
      .get('/admin/contracts')
      .then(({ data }) => setContracts(data.contracts))
      .catch((err) => setError(translateBackendMessage(err.message, language)));

  useEffect(() => {
    load();
  }, []);

  const markReviewed = async (contract) => {
    await api.patch(`/admin/contracts/${contract.id}/review`, { reviewed: !contract.reviewedAt });
    load();
  };

  const saveVigencia = async (contract) => {
    const draft = vigenciaDraft[contract.id] || {};
    await api.patch(`/admin/contracts/${contract.id}/vigencia`, {
      startDate: draft.startDate || contract.startDate || null,
      expirationDate: draft.expirationDate || contract.expirationDate || null,
    });
    load();
  };

  const tree = useMemo(() => {
    if (!contracts) return {};
    const groups = {};
    contracts.forEach((c) => {
      const date = c.generatedAt || c.uploadedAt || c.createdAt;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { month: 'long' });
      groups[year] = groups[year] || {};
      groups[year][month] = groups[year][month] || [];
      groups[year][month].push(c);
    });
    return groups;
  }, [contracts, language]);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!contracts) return <div className="qlc-empty">{t('common.loading')}</div>;

  const pendingReview = contracts.filter((c) => c.status === 'RECEIVED_SIGNED' && !c.reviewedAt);

  return (
    <div>
      <div className="qlc-kicker">{t('adminContractsInbox.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminContractsInbox.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('adminContractsInbox.intro')}</p>

      <div className="qlc-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>
          {t('adminContractsInbox.pendingReview')} ({pendingReview.length})
        </h3>
        {pendingReview.length === 0 ? (
          <div className="qlc-empty">{t('adminContractsInbox.nonePending')}</div>
        ) : (
          <ul className="qlc-plain-list">
            {pendingReview.map((c) => (
              <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>
                    {c.apiSubaccount?.client?.firstName} {c.apiSubaccount?.client?.lastName}
                  </strong>{' '}
                  <span style={{ color: 'var(--qlc-muted2)' }}>
                    {c.apiSubaccount?.isPrincipal ? t('clientSubaccounts.principalLabel') : c.apiSubaccount?.identifier || `#${c.apiSubaccount?.slotIndex}`}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <a className="qlc-btn ghost" href={`${API_BASE_URL}/admin/contracts/${c.id}/download/signed`} target="_blank" rel="noreferrer">
                    {t('adminContractsInbox.viewSigned')}
                  </a>
                  <button className="qlc-btn primary" onClick={() => markReviewed(c)}>
                    {t('adminContractsInbox.markReviewed')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="qlc-card">
        <h3 style={{ marginTop: 0 }}>{t('adminContractsInbox.treeTitle')}</h3>
        {Object.keys(tree)
          .sort((a, b) => b - a)
          .map((year) => (
            <div key={year} style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: 15 }}>📁 {year}</strong>
              {Object.keys(tree[year]).map((month) => (
                <div key={month} style={{ marginLeft: 20, marginTop: 8 }}>
                  <div style={{ color: 'var(--qlc-muted)', fontSize: 13, marginBottom: 6 }}>📁 {month}</div>
                  <table className="qlc-table" style={{ marginLeft: 12 }}>
                    <thead>
                      <tr>
                        <th>{t('adminContractsInbox.client')}</th>
                        <th>{t('adminClientDetail.identifier')}</th>
                        <th>{t('adminContractsInbox.status')}</th>
                        <th>{t('adminContractsInbox.reviewed')}</th>
                        <th>{t('adminContractsInbox.startDate')}</th>
                        <th>{t('adminContractsInbox.expirationDate')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tree[year][month].map((c) => {
                        const draft = vigenciaDraft[c.id] || {};
                        return (
                          <tr key={c.id}>
                            <td>
                              {c.apiSubaccount?.client?.firstName} {c.apiSubaccount?.client?.lastName}
                            </td>
                            <td>
                              {c.apiSubaccount?.isPrincipal
                                ? t('clientSubaccounts.principalLabel')
                                : c.apiSubaccount?.identifier || `#${c.apiSubaccount?.slotIndex}`}
                            </td>
                            <td>{c.status}</td>
                            <td>{c.reviewedAt ? '✓' : '—'}</td>
                            <td>
                              <input
                                type="date"
                                className="qlc-input"
                                style={{ width: 140 }}
                                defaultValue={c.startDate ? c.startDate.slice(0, 10) : ''}
                                onChange={(e) =>
                                  setVigenciaDraft((v) => ({ ...v, [c.id]: { ...v[c.id], startDate: e.target.value } }))
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="qlc-input"
                                style={{ width: 140 }}
                                defaultValue={c.expirationDate ? c.expirationDate.slice(0, 10) : ''}
                                onChange={(e) =>
                                  setVigenciaDraft((v) => ({ ...v, [c.id]: { ...v[c.id], expirationDate: e.target.value } }))
                                }
                              />
                            </td>
                            <td>
                              <button className="qlc-btn ghost" onClick={() => saveVigencia(c)}>
                                {t('common.save')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

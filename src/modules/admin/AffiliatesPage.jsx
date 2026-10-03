import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';
import LoadingScreen from '../../components/LoadingScreen';

export const money = (n) => `${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

// Configuración del programa: activo/inactivo + comisión del afiliador
// DIRECTO (porcentaje o monto fijo). Vacío = QLC aún no la definió.
function ProgramConfigCard() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const savingRef = useRef(false);

  useEffect(() => {
    api.get('/admin/affiliates/config').then(({ data }) =>
      setForm({
        enabled: data.config.enabled,
        commissionType: data.config.commissionType,
        commissionValue: data.config.commissionValue ?? '',
      })
    );
  }, []);

  if (!form) return null;

  const save = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await api.put('/admin/affiliates/config', {
        enabled: form.enabled,
        commissionType: form.commissionType,
        commissionValue: form.commissionValue === '' ? null : form.commissionValue,
      });
      setMessage(t('adminAffiliates.configSaved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <form className="qlc-card" onSubmit={save}>
      <h3 style={{ marginTop: 0 }}>{t('adminAffiliates.configTitle')}</h3>
      <label className="qlc-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
        {t('adminAffiliates.programEnabled')}
      </label>
      <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '2px 0 10px' }}>{t('adminAffiliates.programHint')}</p>
      <label className="qlc-label">{t('adminAffiliates.commissionType')}</label>
      <select className="qlc-select" value={form.commissionType} onChange={(e) => setForm((f) => ({ ...f, commissionType: e.target.value }))}>
        <option value="PERCENTAGE">{t('adminAffiliates.typePercentage')}</option>
        <option value="FIXED_AMOUNT">{t('adminAffiliates.typeFixed')}</option>
      </select>
      <label className="qlc-label">
        {t('adminAffiliates.commissionValue')} ({form.commissionType === 'PERCENTAGE' ? '%' : 'USDT'})
      </label>
      <input
        className="qlc-input"
        type="number"
        min="0"
        step="0.01"
        max={form.commissionType === 'PERCENTAGE' ? 100 : undefined}
        value={form.commissionValue}
        placeholder={t('adminAffiliates.notDefined')}
        onChange={(e) => setForm((f) => ({ ...f, commissionValue: e.target.value }))}
      />
      <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>{t('adminAffiliates.commissionValueHint')}</p>
      {error && <p className="qlc-field-error">{error}</p>}
      {message && <p style={{ fontSize: 12, color: 'var(--qlc-ok)' }}>{message}</p>}
      <button className="qlc-btn primary" style={{ marginTop: 12 }} disabled={saving}>
        {saving ? t('common.saving') : t('adminAffiliates.saveConfig')}
      </button>
    </form>
  );
}

/*
 * ADMIN · AFILIADOS — totales reales del programa, buscador, filtros y la
 * lista de promotores (clientes con código o con referidos directos).
 */
export default function AffiliatesPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = () =>
    api
      .get('/admin/affiliates', { params: { search: search.trim() || undefined, status: status || undefined } })
      .then(({ data: d }) => setData(d));
  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);
  usePolling(load, 8000);

  if (!data) return <LoadingScreen />;

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">{t('adminAffiliates.kicker')}</div>
          <h1 style={{ margin: 0 }}>{t('adminAffiliates.title')}</h1>
        </div>
      </div>

      <div className="qlc-stat-grid" style={{ marginTop: 0 }}>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('adminAffiliates.statPromoters')}</span>
          <span className="qlc-stat-value">{data.stats.promoters}</span>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('adminAffiliates.statReferred')}</span>
          <span className="qlc-stat-value">{data.stats.referred}</span>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('adminAffiliates.statPending')}</span>
          <span className="qlc-stat-value" style={{ fontSize: 22 }}>{money(data.stats.pendingAmount)}</span>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('adminAffiliates.statPaid')}</span>
          <span className="qlc-stat-value" style={{ fontSize: 22 }}>{money(data.stats.paidAmount)}</span>
        </div>
      </div>

      <div className="qlc-aff-grid">
        <section className="qlc-card">
          <div className="qlc-aff-toolbar">
            <input className="qlc-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminAffiliates.search')} />
            <div className="qlc-aff-segment" role="group">
              {[
                ['', t('adminAffiliates.filterAll')],
                ['ACTIVE', t('adminAffiliates.filterActive')],
                ['INACTIVE', t('adminAffiliates.filterInactive')],
              ].map(([value, label]) => (
                <button key={value || 'all'} type="button" className={status === value ? 'is-active' : ''} onClick={() => setStatus(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {data.items.length ? (
            <div className="qlc-table-wrap">
              <table className="qlc-table">
                <thead>
                  <tr>
                    <th>{t('adminAffiliates.promoter')}</th>
                    <th>{t('adminAffiliates.code')}</th>
                    <th>{t('adminAffiliates.referrals')}</th>
                    <th>{t('adminAffiliates.pendingShort')}</th>
                    <th>{t('adminAffiliates.paidShort')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>
                          {p.firstName} {p.lastName}
                        </strong>
                        <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{p.email}</div>
                      </td>
                      <td>
                        {p.affiliateCode ? <code>{p.affiliateCode}</code> : <span style={{ color: 'var(--qlc-muted2)' }}>{t('adminAffiliates.noCode')}</span>}{' '}
                        <span className={`qlc-badge ${p.affiliateEnabled ? 'ok' : 'muted'}`}>
                          {p.affiliateEnabled ? t('affiliate.statusActive') : t('affiliate.statusInactive')}
                        </span>
                      </td>
                      <td>{p.referralsCount}</td>
                      <td>{money(p.pendingAmount)}</td>
                      <td>{money(p.paidAmount)}</td>
                      <td>
                        <Link className="qlc-btn ghost" to={`/admin/affiliates/${p.id}`}>
                          {t('adminAffiliates.view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="qlc-empty">{t('adminAffiliates.empty')}</div>
          )}
        </section>
        <ProgramConfigCard />
      </div>
    </div>
  );
}

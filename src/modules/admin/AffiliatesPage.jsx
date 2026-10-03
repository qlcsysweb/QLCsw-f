import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDate, formatCdmxDateTime } from '../../utils/cdmxTime';
import usePolling from '../../hooks/usePolling';
import LoadingScreen from '../../components/LoadingScreen';

export const money = (n) => `${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

// Configuración del programa: activo/inactivo y distribución de la
// RENTABILIDAD GENERADA (cliente / QLC / afiliador directo). Cada guardado
// crea una versión con su fecha de vigencia (no se pierde la anterior).
function ProgramConfigCard() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState(null);
  const [history, setHistory] = useState([]);
  // Solo el administrador general edita porcentajes/base (lo valida el backend).
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const savingRef = useRef(false);

  const load = () =>
    api.get('/admin/affiliates/config').then(({ data }) => {
      setForm({
        enabled: data.config.enabled,
        clientSharePct: String(data.config.clientSharePct),
        qlcSharePct: String(data.config.qlcSharePct),
        affiliateSharePct: String(data.config.affiliateSharePct),
        balanceStaleDays: String(data.config.balanceStaleDays ?? 31),
        effectiveFrom: '',
      });
      setHistory(data.history);
      setCanEdit(Boolean(data.canEdit));
    });
  useEffect(() => {
    load();
  }, []);

  if (!form) return null;
  const sum = Number(form.clientSharePct || 0) + Number(form.qlcSharePct || 0) + Number(form.affiliateSharePct || 0);
  const sumOk = Math.abs(sum - 100) < 0.001;

  const save = async (e) => {
    e.preventDefault();
    if (savingRef.current || !sumOk) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await api.put('/admin/affiliates/config', {
        enabled: form.enabled,
        clientSharePct: Number(form.clientSharePct),
        qlcSharePct: Number(form.qlcSharePct),
        affiliateSharePct: Number(form.affiliateSharePct),
        balanceStaleDays: Number(form.balanceStaleDays),
        // Vacío = vigente desde ahora; fecha futura = versión programada.
        effectiveFrom: form.effectiveFrom ? new Date(`${form.effectiveFrom}T00:00:00`).toISOString() : undefined,
      });
      setMessage(t('adminAffiliates.configSaved'));
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const field = (key, label) => (
    <div>
      <label className="qlc-label">{label}</label>
      <input
        className="qlc-input"
        type="number"
        min="0"
        max="100"
        step="0.01"
        required
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <form className="qlc-card" onSubmit={save}>
      <h3 style={{ marginTop: 0 }}>{t('adminAffiliates.configTitle')}</h3>
      {!canEdit && <p style={{ fontSize: 12, color: 'var(--qlc-warn)', marginTop: 0 }}>{t('adminAffiliates.generalAdminOnly')}</p>}
      <fieldset disabled={!canEdit} className="qlc-plain-fieldset">
      <label className="qlc-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
        {t('adminAffiliates.programEnabled')}
      </label>
      <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '2px 0 10px' }}>{t('adminAffiliates.programHint')}</p>
      <div className="qlc-aff-section-title" style={{ marginTop: 6 }}>{t('adminAffiliates.distributionTitle')}</div>
      <div className="qlc-aff-share-grid">
        {field('clientSharePct', t('adminAffiliates.clientShare'))}
        {field('qlcSharePct', t('adminAffiliates.qlcShare'))}
        {field('affiliateSharePct', t('adminAffiliates.affiliateShare'))}
      </div>
      <p style={{ fontSize: 11, color: sumOk ? 'var(--qlc-muted2)' : 'var(--qlc-danger)', margin: '4px 0 0' }}>
        {sumOk ? t('adminAffiliates.distributionHint') : `${t('adminAffiliates.sumError')} (${sum}%)`}
      </p>
      <div className="qlc-aff-share-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 8 }}>
        <div>
          <label className="qlc-label">{t('adminAffiliates.staleDays')}</label>
          <input
            className="qlc-input"
            type="number"
            min="1"
            max="365"
            step="1"
            required
            value={form.balanceStaleDays}
            onChange={(e) => setForm((f) => ({ ...f, balanceStaleDays: e.target.value }))}
          />
        </div>
        <div>
          <label className="qlc-label">{t('adminAffiliates.effectiveFrom')}</label>
          <input
            className="qlc-input"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={form.effectiveFrom}
            onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
          />
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '4px 0 0' }}>{t('adminAffiliates.versionHint')}</p>
      {error && <p className="qlc-field-error">{error}</p>}
      {message && <p style={{ fontSize: 12, color: 'var(--qlc-ok)' }}>{message}</p>}
      <button className="qlc-btn primary" style={{ marginTop: 12 }} disabled={saving || !sumOk}>
        {saving ? t('common.saving') : t('adminAffiliates.saveConfig')}
      </button>
      </fieldset>
      {history.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="qlc-aff-section-title">{t('adminAffiliates.historyTitle')}</div>
          <ul className="qlc-plain-list" style={{ fontSize: 12 }}>
            {history.map((h) => (
              <li key={h.id} className="qlc-history-item">
                <span>
                  {t('adminAffiliates.effectiveFrom')} {formatCdmxDateTime(h.effectiveFrom)}{' '}
                  {h.current && <span className="qlc-badge ok">{t('adminAffiliates.versionCurrent')}</span>}
                  {h.scheduled && <span className="qlc-badge warn">{t('adminAffiliates.versionScheduled')}</span>}
                </span>
                <span>
                  {h.clientSharePct} / {h.qlcSharePct} / {h.affiliateSharePct}
                  {h.balanceStaleDays ? ` · ${h.balanceStaleDays} d` : ''}
                  {!h.enabled ? ` · ${t('affiliate.statusInactive')}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

/*
 * AFFILIATE MANAGEMENT — totales reales del programa, buscador (código,
 * correo, ID o PCB), filtros y lista de afiliadores.
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
            <input className="qlc-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminAffiliates.searchHint')} />
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
                    <th>{t('adminAffiliates.uid')}</th>
                    <th>{t('adminAffiliates.referrals')}</th>
                    <th>{t('adminAffiliates.activeReferrals')}</th>
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
                        <div style={{ fontSize: 10, color: 'var(--qlc-muted2)' }}>
                          ID {p.id.slice(-8)} · {t('adminAffiliates.since')} {formatCdmxDate(p.affiliateEnabledAt || p.createdAt)}
                        </div>
                      </td>
                      <td>
                        {p.affiliateCode ? <code>{p.affiliateCode}</code> : <span style={{ color: 'var(--qlc-muted2)' }}>{t('adminAffiliates.noCode')}</span>}{' '}
                        <span className={`qlc-badge ${p.affiliateEnabled ? 'ok' : p.affiliateDisabledAt ? 'danger' : 'muted'}`}>
                          {p.affiliateEnabled ? t('affiliate.stateActive') : p.affiliateDisabledAt ? t('affiliate.stateSuspended') : t('affiliate.stateNoLink')}
                        </span>
                      </td>
                      <td>{p.affiliateBitgetUid ? <code>{p.affiliateBitgetUid}</code> : '—'}</td>
                      <td>{p.referralsCount}</td>
                      <td>{p.activeReferralsCount}</td>
                      <td>{money(p.pendingAmount)}</td>
                      <td>{money(p.paidAmount)}</td>
                      <td>
                        <Link className="qlc-btn ghost" to={`/admin/clients/${p.id}#qlc-affiliate-program`}>
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

import { useEffect, useState } from 'react';
import api from '../../services/api';
import { PROSPECT_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

function CopyEmailButton({ email, t }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles no rompemos la vista.
    }
  };

  return (
    <button type="button" className="qlc-btn ghost" onClick={copy}>
      {copied ? t('adminProspects.emailCopied') : t('adminProspects.copyEmail')}
    </button>
  );
}

function ProspectRow({ p, onUpdateStatus, onDelete, t, prospectStatusMap }) {
  const status = statusOf(prospectStatusMap, p.status, 'NUEVO');
  return (
    <tr>
      <td>
        {p.firstName} {p.lastName || ''}
      </td>
      <td>{p.email}</td>
      <td>
        <span className={`qlc-badge ${status.className}`}>{status.text}</span>
      </td>
      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
      <td>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CopyEmailButton email={p.email} t={t} />
          <select
            className="qlc-select"
            value={p.status}
            onChange={(e) => onUpdateStatus(p.id, e.target.value)}
          >
            <option value="NUEVO">{t('adminProspects.statusNew')}</option>
            <option value="CONTACTADO">{t('adminProspects.statusContacted')}</option>
            <option value="CONVERTIDO">{t('adminProspects.statusConverted')}</option>
            <option value="DESCARTADO">{t('adminProspects.statusDiscarded')}</option>
          </select>
          {p.status === 'DESCARTADO' && (
            <button type="button" className="qlc-btn ghost" onClick={() => onDelete(p)}>
              {t('adminProspects.delete')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function ProspectsPage() {
  const { t } = useLanguage();
  const [prospects, setProspects] = useState([]);
  const [counts, setCounts] = useState({ total: 0, registered: 0, unregistered: 0 });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const prospectStatusMap = PROSPECT_STATUS(t);

  const load = () =>
    api.get('/admin/prospects').then(({ data }) => {
      setProspects(data.prospects);
      setCounts(data.counts);
    });

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/prospects/${id}`, { status });
    load();
  };

  // CORREGIR.xlsx ADMIN 05 — borrado manual (además de la limpieza
  // automática a los 5 días de DESCARTADO).
  const deleteProspect = async (prospect) => {
    await api.delete(`/admin/prospects/${prospect.id}`);
    load();
  };

  const unregistered = prospects.filter((p) => !p.isRegistered);
  const registered = prospects.filter((p) => p.isRegistered);

  return (
    <div>
      <div className="qlc-kicker">{t('adminProspects.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('adminProspects.title')}</h1>
      <p style={{ color: 'var(--qlc-muted, #8a8f98)', marginTop: -8 }}>{t('adminProspects.intro')}</p>

      <div className="qlc-stat-grid" style={{ marginBottom: 24 }}>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('adminProspects.total')}</span>
          <strong className="qlc-stat-value">{counts.total}</strong>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('adminProspects.alreadyRegistered')}</span>
          <strong className="qlc-stat-value">{counts.registered}</strong>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('adminProspects.pendingRegistration')}</span>
          <strong className="qlc-stat-value">{counts.unregistered}</strong>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3>{t('adminProspects.pendingTitle')}</h3>
        <p style={{ color: 'var(--qlc-muted, #8a8f98)', marginTop: -4 }}>{t('adminProspects.pendingIntro')}</p>
        {unregistered.length === 0 ? (
          <div className="qlc-empty">{t('adminProspects.nonePending')}</div>
        ) : (
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('adminProspects.name')}</th>
                  <th>{t('adminProspects.email')}</th>
                  <th>{t('adminProspects.status')}</th>
                  <th>{t('adminProspects.requested')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unregistered.map((p) => (
                  <ProspectRow key={p.id} p={p} onUpdateStatus={updateStatus} onDelete={setConfirmDelete} t={t} prospectStatusMap={prospectStatusMap} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3>{t('adminProspects.registeredTitle')}</h3>
        <p style={{ color: 'var(--qlc-muted, #8a8f98)', marginTop: -4 }}>{t('adminProspects.registeredIntro')}</p>
        {registered.length === 0 ? (
          <div className="qlc-empty">{t('adminProspects.noneRegistered')}</div>
        ) : (
          <div className="qlc-table-wrap">
            <table className="qlc-table">
              <thead>
                <tr>
                  <th>{t('adminProspects.name')}</th>
                  <th>{t('adminProspects.email')}</th>
                  <th>{t('adminProspects.status')}</th>
                  <th>{t('adminProspects.requested')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registered.map((p) => (
                  <ProspectRow key={p.id} p={p} onUpdateStatus={updateStatus} onDelete={setConfirmDelete} t={t} prospectStatusMap={prospectStatusMap} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmDelete && (
        <ConfirmModal
          title={t('adminProspects.deleteTitle')}
          message={t('adminProspects.deleteMessage').replace(
            '{name}',
            `${confirmDelete.firstName} ${confirmDelete.lastName || ''}`
          )}
          confirmLabel={t('adminProspects.delete')}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => deleteProspect(confirmDelete)}
        />
      )}
    </div>
  );
}

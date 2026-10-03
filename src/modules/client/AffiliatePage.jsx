import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDate } from '../../utils/cdmxTime';
import usePolling from '../../hooks/usePolling';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import Modal from '../../components/Modal';
import LoadingScreen from '../../components/LoadingScreen';

const REF_BADGE = { ACTIVO: 'ok', EN_PROCESO: 'warn', INACTIVO: 'muted' };
const COMMISSION_BADGE = { PENDIENTE: 'warn', APROBADA: 'ok', PAGADA: 'ok', CANCELADA: 'muted' };
const money = (n) => `${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

/*
 * PANEL DE PROMOTOR (cliente). Solo información de AFILIACIÓN con datos
 * reales del backend: enlace, código, QR, referidos DIRECTOS y comisiones
 * generadas para este cliente. Nunca saldos, capital, API, movimientos ni
 * datos privados de los referidos.
 */
export default function AffiliatePage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const activatingRef = useRef(false);
  const [qr, setQr] = useState(null); // { link, qrDataUrl } | 'loading' | 'error'
  const [showHistory, setShowHistory] = useState(false);
  const { copy, isCopied } = useCopyToClipboard();

  const load = () =>
    api
      .get('/client/affiliate')
      .then(({ data: d }) => {
        setData(d);
        setError('');
      })
      .catch((err) => setError(translateBackendMessage(err.message, language)));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Un nuevo referido o una comisión aprobada aparecen sin F5 (solo lectura).
  usePolling(load, 8000);

  if (!data) return error ? <div className="qlc-card">{error}</div> : <LoadingScreen />;

  const { affiliate, program, stats, referrals, commissions } = data;
  // El enlace se construye con el origen REAL del frontend que está usando el
  // cliente (nunca un dominio fijo); el backend genera el QR del mismo enlace.
  const link = affiliate.code ? `${window.location.origin}/registro?ref=${encodeURIComponent(affiliate.code)}` : null;
  const active = affiliate.enabled && affiliate.code;

  const activate = async () => {
    if (activatingRef.current) return;
    activatingRef.current = true;
    setActivating(true);
    setError('');
    try {
      await api.post('/client/affiliate/activate');
      await load();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      activatingRef.current = false;
      setActivating(false);
    }
  };

  const openQr = async () => {
    setQr('loading');
    try {
      const { data: d } = await api.get('/client/affiliate/qr', { params: { origin: window.location.origin } });
      setQr(d);
    } catch {
      setQr('error');
    }
  };

  const totals = commissions.totals;

  return (
    <div>
      <div className="qlc-page-header">
        <div>
          <div className="qlc-kicker">{t('affiliate.kicker')}</div>
          <h1 style={{ margin: 0 }}>{t('affiliate.title')}</h1>
        </div>
      </div>
      {error && <div className="qlc-card" style={{ borderColor: 'var(--qlc-danger-border)', marginBottom: 16 }}>{error}</div>}

      {active ? (
        <section className="qlc-card qlc-aff-hero">
          <div className="qlc-aff-hero-head">
            <div className="qlc-kicker">{t('affiliate.kicker')}</div>
            <span className={`qlc-badge ${program.enabled ? 'ok' : 'muted'}`}>
              {program.enabled ? t('affiliate.statusActive') : t('affiliate.statusInactive')}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{t('affiliate.linkTitle')}</h2>
            <p style={{ margin: 0, color: 'var(--qlc-muted)', fontSize: 13 }}>{t('affiliate.linkHint')}</p>
            <div className="qlc-aff-link-row">
              <code className="qlc-aff-link" title={link}>{link}</code>
              <button type="button" className="qlc-btn primary" onClick={() => copy(link, 'aff-link')}>
                {isCopied('aff-link') ? t('affiliate.copied') : t('affiliate.copy')}
              </button>
            </div>
            {!program.enabled && <p style={{ fontSize: 12, color: 'var(--qlc-warn)', margin: '10px 0 0' }}>{t('affiliate.programInactive')}</p>}
            <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '12px 0 0' }}>{t('affiliate.directOnly')}</p>
          </div>
          <div className="qlc-aff-code-box">
            <div>
              <div className="qlc-aff-section-title">{t('affiliate.codeLabel')}</div>
              <div className="qlc-aff-code">{affiliate.code}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="qlc-btn ghost" onClick={openQr}>
                {t('affiliate.viewQr')}
              </button>
              <button type="button" className="qlc-btn ghost" onClick={() => copy(affiliate.code, 'aff-code')}>
                {isCopied('aff-code') ? t('affiliate.copied') : t('affiliate.copy')}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="qlc-card">
          <div className="qlc-kicker">{t('affiliate.kicker')}</div>
          {affiliate.disabledByAdmin ? (
            <p style={{ color: 'var(--qlc-muted)', margin: '8px 0 0' }}>{t('affiliate.disabledByAdmin')}</p>
          ) : !program.enabled ? (
            <p style={{ color: 'var(--qlc-muted)', margin: '8px 0 0' }}>{t('affiliate.programInactive')}</p>
          ) : (
            <>
              <h2 style={{ margin: '6px 0 4px', fontSize: 20 }}>{t('affiliate.notActiveTitle')}</h2>
              <p style={{ color: 'var(--qlc-muted)', margin: '0 0 14px', fontSize: 13 }}>{t('affiliate.notActiveText')}</p>
              {affiliate.canActivate && (
                <button type="button" className="qlc-btn primary" onClick={activate} disabled={activating}>
                  {activating ? t('affiliate.activating') : t('affiliate.activate')}
                </button>
              )}
            </>
          )}
        </section>
      )}

      <div className="qlc-stat-grid">
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('affiliate.statReferred')}</span>
          <span className="qlc-stat-value">{stats.referred}</span>
        </div>
        <div className="qlc-card qlc-stat-card">
          <span className="qlc-stat-label">{t('affiliate.statActive')}</span>
          <span className="qlc-stat-value">{stats.active}</span>
          <span className="qlc-stat-hint">{t('affiliate.statActiveHint')}</span>
        </div>
      </div>

      <div className="qlc-aff-grid">
        <section className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('affiliate.referralsTitle')}</h3>
          {referrals.length ? (
            <ul className="qlc-aff-list">
              {referrals.map((r) => (
                <li key={r.key}>
                  <strong>{r.name}</strong>
                  <div className="qlc-aff-meta">
                    <span>
                      {t('affiliate.registered')}: {formatCdmxDate(r.registeredAt)}
                    </span>
                    <span className={`qlc-badge ${REF_BADGE[r.status] || 'muted'}`}>{t(`affiliate.refStatus.${r.status}`)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="qlc-empty">{t('affiliate.referralsEmpty')}</div>
          )}
        </section>

        <section className="qlc-card">
          <h3 style={{ marginTop: 0 }}>{t('affiliate.commissionsTitle')}</h3>
          <div className="qlc-aff-totals">
            <div>
              <span className="qlc-stat-label">{t('affiliate.pending')}</span>
              <strong>{money(totals.PENDIENTE)}</strong>
            </div>
            <div>
              <span className="qlc-stat-label">{t('affiliate.approved')}</span>
              <strong>{money(totals.APROBADA)}</strong>
            </div>
            <div>
              <span className="qlc-stat-label">{t('affiliate.paid')}</span>
              <strong>{money(totals.PAGADA)}</strong>
            </div>
          </div>
          <button type="button" className="qlc-btn ghost" onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}>
            {showHistory ? t('affiliate.hideHistory') : t('affiliate.viewHistory')}
          </button>
          {showHistory &&
            (commissions.history.length ? (
              <ul className="qlc-plain-list" style={{ marginTop: 12 }}>
                {commissions.history.map((c) => (
                  <li key={c.id} className="qlc-history-item" style={{ flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ minWidth: 0 }}>
                      <strong>{c.concept}</strong>
                      <br />
                      <span style={{ fontSize: 12, color: 'var(--qlc-muted)' }}>
                        {c.referredName} · {formatCdmxDate(c.occurredAt)}
                      </span>
                    </span>
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <strong>{money(c.amount)}</strong>
                      <span className={`qlc-badge ${COMMISSION_BADGE[c.status]}`}>{t(`affiliate.commissionStatus.${c.status}`)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="qlc-empty" style={{ marginTop: 12 }}>{t('affiliate.historyEmpty')}</div>
            ))}
        </section>
      </div>

      {qr && (
        <Modal title={t('affiliate.qrTitle')} onClose={() => setQr(null)} width={420}>
          <div className="qlc-aff-qr">
            {qr === 'loading' && <p role="status">…</p>}
            {qr === 'error' && <p className="qlc-field-error">{t('affiliate.qrError')}</p>}
            {qr?.qrDataUrl && (
              <>
                <img src={qr.qrDataUrl} alt={qr.link} />
                <code className="qlc-aff-link" style={{ width: '100%' }} title={qr.link}>{qr.link}</code>
                <button type="button" className="qlc-btn primary" onClick={() => copy(qr.link, 'aff-qr-link')}>
                  {isCopied('aff-qr-link') ? t('affiliate.copied') : t('affiliate.copy')}
                </button>
                <p style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: 0 }}>{t('affiliate.qrHint')}</p>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

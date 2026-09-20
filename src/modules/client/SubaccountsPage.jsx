import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';

const REQUEST_STATUS_CLASS = { PENDING: 'warn', APPROVED: 'ok', REJECTED: 'danger' };

// GESTIÓN DINÁMICA DE SUBCUENTAS — el cliente ya no ve 20 subcuentas
// pre-creadas: solo su cuenta PRINCIPAL y las que realmente fueron
// aprobadas por un admin. Para cualquier subcuenta adicional, o para dejar
// de usar una, el cliente solicita y el admin decide — nunca crea ni
// desactiva directamente. Una subcuenta desactivada NUNCA se elimina: solo
// deja de aparecer aquí hasta que un admin la reactive.
export default function SubaccountsPage() {
  const { t, language } = useLanguage();
  const [subaccounts, setSubaccounts] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [maxSubaccounts, setMaxSubaccounts] = useState(20);
  const [requests, setRequests] = useState([]);

  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newReason, setNewReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');

  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  const [showHistory, setShowHistory] = useState(false);

  const apiStatusMap = API_CONNECTION_STATUS(t);

  const load = () => {
    api.get('/client/api-subaccounts').then(({ data }) => {
      setSubaccounts(data.subaccounts);
      setActiveCount(data.activeCount);
      setMaxSubaccounts(data.maxSubaccounts);
      setRequests(data.requests || []);
    });
  };
  useEffect(load, []);
  // Actualización sin refresh manual: si un admin aprueba/rechaza una
  // solicitud, o activa/desactiva una subcuenta, aparece solo sin que el
  // cliente tenga que recargar.
  usePolling(load, 8000);

  const pendingCreateRequest = requests.find((r) => r.type === 'CREATE' && r.status === 'PENDING');
  const pendingDeactivateBySubaccountId = new Set(
    requests.filter((r) => r.type === 'DEACTIVATE' && r.status === 'PENDING').map((r) => r.apiSubaccountId)
  );
  const reachedMax = activeCount >= maxSubaccounts;

  const submitNewRequest = async () => {
    setRequesting(true);
    setRequestError('');
    try {
      await api.post('/client/api-subaccounts/requests', { reason: newReason || undefined });
      setShowNewRequest(false);
      setNewReason('');
      load();
    } catch (err) {
      setRequestError(translateBackendMessage(err.message, language));
    } finally {
      setRequesting(false);
    }
  };

  const submitDeactivateRequest = async () => {
    setDeactivating(true);
    setDeactivateError('');
    try {
      await api.post(`/client/api-subaccounts/${deactivateTarget.id}/requests/deactivate`, { reason: deactivateReason || undefined });
      setDeactivateTarget(null);
      setDeactivateReason('');
      load();
    } catch (err) {
      setDeactivateError(translateBackendMessage(err.message, language));
    } finally {
      setDeactivating(false);
    }
  };

  if (!subaccounts) return <div className="qlc-empty">{t('common.loading')}</div>;

  return (
    <div>
      <div className="qlc-kicker">{t('clientSubaccounts.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientSubaccounts.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientSubaccounts.intro')}</p>

      <div
        className="qlc-card"
        style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
      >
        <div>
          <strong style={{ fontSize: 15 }}>
            {t('clientSubaccounts.activeCountLabel')}: {activeCount} {t('clientSubaccounts.of')} {maxSubaccounts}
          </strong>
          {pendingCreateRequest && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--qlc-warn)' }}>
              {t('clientSubaccounts.pendingCreateNotice')}
            </p>
          )}
        </div>
        <button
          className="qlc-btn primary"
          disabled={reachedMax || Boolean(pendingCreateRequest)}
          title={reachedMax ? t('clientSubaccounts.maxReached') : ''}
          onClick={() => setShowNewRequest(true)}
        >
          + {t('clientSubaccounts.requestAdditional')}
        </button>
      </div>

      {subaccounts.length === 0 ? (
        <div className="qlc-empty">{t('clientSubaccounts.none')}</div>
      ) : (
        <div className="qlc-detail-grid">
          {subaccounts.map((s) => {
            const status = statusOf(apiStatusMap, s.status, 'PENDIENTE');
            const model = s.clientModel?.model ? getLocalizedModel(s.clientModel.model, language) : null;
            const pendingDeactivate = pendingDeactivateBySubaccountId.has(s.id);
            return (
              <div key={s.id} className="qlc-card" style={s.isPrincipal ? { borderColor: 'var(--qlc-gold)' } : undefined}>
                <Link to={`/client/api-subaccounts/${s.id}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>
                      {s.isPrincipal ? t('clientSubaccounts.principalLabel') : `${t('clientSubaccounts.subaccountLabel')} #${s.slotIndex}`}
                    </h3>
                    <span className={`qlc-badge ${status.className}`}>{status.text}</span>
                  </div>
                  <p style={{ color: 'var(--qlc-muted)', fontSize: 12, marginTop: 4, marginBottom: 4 }}>
                    {t('clientSubaccounts.operatorUser')}: {s.identifier || t('clientSubaccounts.unassignedIdentifier')}
                  </p>
                  <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginBottom: 4 }}>
                    {t('clientSubaccounts.model')}: {model ? model.name : t('clientSubaccounts.noModel')}
                  </p>
                  <p style={{ color: 'var(--qlc-muted2)', fontSize: 12, marginBottom: 0 }}>
                    {s.process?.isActivated ? t('clientSubaccounts.activated') : t('clientSubaccounts.inProcess')}
                  </p>
                </Link>
                {!s.isPrincipal && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--qlc-line)' }}>
                    {pendingDeactivate ? (
                      <span className="qlc-badge warn">{t('clientSubaccounts.pendingDeactivateNotice')}</span>
                    ) : (
                      <button
                        type="button"
                        className="qlc-btn ghost"
                        style={{ fontSize: 12 }}
                        onClick={() => setDeactivateTarget(s)}
                      >
                        {t('clientSubaccounts.requestDeactivation')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {requests.length > 0 && (
        <div className="qlc-card" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="qlc-btn ghost"
            onClick={() => setShowHistory((v) => !v)}
            style={{ marginBottom: showHistory ? 12 : 0 }}
          >
            {showHistory ? '▾' : '▸'} {t('clientSubaccounts.requestHistoryTitle')} ({requests.length})
          </button>
          {showHistory && (
            <ul className="qlc-plain-list">
              {requests.map((r) => (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>
                    {r.type === 'CREATE' ? t('clientSubaccounts.requestTypeCreate') : t('clientSubaccounts.requestTypeDeactivate')}
                    {r.apiSubaccount && ` — ${r.apiSubaccount.identifier || `#${r.apiSubaccount.slotIndex}`}`}
                    <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{new Date(r.requestedAt).toLocaleString()}</div>
                    {r.reviewNote && <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>{r.reviewNote}</div>}
                  </span>
                  <span className={`qlc-badge ${REQUEST_STATUS_CLASS[r.status] || 'muted'}`}>
                    {t(`clientSubaccounts.requestStatus${r.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showNewRequest && (
        <Modal
          title={t('clientSubaccounts.requestAdditional')}
          onClose={() => {
            setShowNewRequest(false);
            setRequestError('');
          }}
          width={440}
        >
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13, marginTop: 0 }}>
            {t('clientSubaccounts.activeCountLabel')}: {activeCount} {t('clientSubaccounts.of')} {maxSubaccounts}
          </p>
          <label className="qlc-label">{t('clientSubaccounts.reasonLabelOptional')}</label>
          <textarea
            className="qlc-textarea"
            rows={3}
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder={t('clientSubaccounts.reasonPlaceholder')}
          />
          {requestError && <div className="qlc-field-error">{requestError}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn ghost" onClick={() => setShowNewRequest(false)} disabled={requesting}>
              {t('modals.cancel')}
            </button>
            <button className="qlc-btn primary" onClick={submitNewRequest} disabled={requesting}>
              {requesting ? t('common.sending') : t('clientSubaccounts.sendRequest')}
            </button>
          </div>
        </Modal>
      )}

      {deactivateTarget && (
        <Modal
          title={t('clientSubaccounts.requestDeactivation')}
          subtitle={deactivateTarget.identifier || `#${deactivateTarget.slotIndex}`}
          onClose={() => {
            setDeactivateTarget(null);
            setDeactivateReason('');
            setDeactivateError('');
          }}
          width={440}
        >
          <p style={{ color: 'var(--qlc-muted)', fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
            {t('clientSubaccounts.deactivateRequestNotice')}
          </p>
          <label className="qlc-label">{t('clientSubaccounts.reasonLabelOptional')}</label>
          <textarea
            className="qlc-textarea"
            rows={3}
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
            placeholder={t('clientSubaccounts.reasonPlaceholder')}
          />
          {deactivateError && <div className="qlc-field-error">{deactivateError}</div>}
          <div className="qlc-form-actions">
            <button className="qlc-btn ghost" onClick={() => setDeactivateTarget(null)} disabled={deactivating}>
              {t('modals.cancel')}
            </button>
            <button className="qlc-btn danger" onClick={submitDeactivateRequest} disabled={deactivating}>
              {deactivating ? t('common.sending') : t('clientSubaccounts.sendRequest')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

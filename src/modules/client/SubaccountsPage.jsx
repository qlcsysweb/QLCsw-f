import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedModel } from '../../i18n/bilingualContent';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';

// CORRECCIÓN 11 — el cliente puede tener hasta 20 subcuentas/API, cada una
// con su propio modelo, contrato, proceso, pagos y estados de cuenta. Esta
// página es el punto de entrada: cada subcuenta lleva a su propio detalle.
//
// CORRECCIÓN (subcuentas ocultas) — de esas 20, el cliente solo ve la
// PRINCIPAL y las que un admin ya reveló; el resto queda oculto para no
// abrumar con subcuentas que todavía no usa. Si quiere una más, la solicita
// aquí y el equipo QLC la habilita manualmente.
export default function SubaccountsPage() {
  const { t, language } = useLanguage();
  const [subaccounts, setSubaccounts] = useState(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [requestPending, setRequestPending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestOk, setRequestOk] = useState('');

  const apiStatusMap = API_CONNECTION_STATUS(t);

  const load = () => {
    api.get('/client/api-subaccounts').then(({ data }) => {
      setSubaccounts(data.subaccounts);
      setHiddenCount(data.hiddenCount || 0);
      setRequestPending(Boolean(data.requestPending));
    });
  };
  useEffect(load, []);
  // Actualización sin refresh manual: si un admin revela una subcuenta
  // oculta, aparece sola en esta lista sin que el cliente tenga que recargar.
  usePolling(load, 8000);

  const requestAdditional = async () => {
    setRequesting(true);
    setRequestError('');
    setRequestOk('');
    try {
      await api.post('/client/api-subaccounts/request-additional');
      setRequestOk(t('clientSubaccounts.requestSentOk'));
      load();
    } catch (err) {
      setRequestError(translateBackendMessage(err.message, language));
    } finally {
      setRequesting(false);
    }
  };

  if (!subaccounts) return <div className="qlc-empty">{t('common.loading')}</div>;

  return (
    <div>
      <div className="qlc-kicker">{t('clientSubaccounts.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientSubaccounts.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientSubaccounts.intro')}</p>

      {hiddenCount > 0 && (
        <div className="qlc-card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--qlc-muted)' }}>
            {requestPending ? t('clientSubaccounts.requestPending') : t('clientSubaccounts.requestIntro')}
          </p>
          <button className="qlc-btn ghost" disabled={requesting || requestPending} onClick={requestAdditional}>
            {requesting ? t('common.sending') : t('clientSubaccounts.requestAdditional')}
          </button>
        </div>
      )}
      {requestError && <p style={{ color: 'var(--qlc-danger)', fontSize: 13 }}>{requestError}</p>}
      {requestOk && <p style={{ color: 'var(--qlc-ok)', fontSize: 13 }}>{requestOk}</p>}

      {subaccounts.length === 0 ? (
        <div className="qlc-empty">{t('clientSubaccounts.none')}</div>
      ) : (
        <div className="qlc-detail-grid">
          {subaccounts.map((s) => {
            const status = statusOf(apiStatusMap, s.status, 'PENDIENTE');
            const model = s.clientModel?.model ? getLocalizedModel(s.clientModel.model, language) : null;
            return (
              <Link
                key={s.id}
                to={`/client/api-subaccounts/${s.id}`}
                className="qlc-card"
                style={{ display: 'block', ...(s.isPrincipal ? { borderColor: 'var(--qlc-gold)' } : {}) }}
              >
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
                <p style={{ color: 'var(--qlc-muted2)', fontSize: 12 }}>
                  {s.process?.isActivated ? t('clientSubaccounts.activated') : t('clientSubaccounts.inProcess')}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

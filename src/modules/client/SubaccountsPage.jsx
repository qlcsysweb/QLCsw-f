import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { API_CONNECTION_STATUS, statusOf } from '../../utils/statusLabels';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocalizedModel } from '../../i18n/bilingualContent';

// CORRECCIÓN 11 — el cliente puede tener hasta 20 subcuentas/API, cada una
// con su propio modelo, contrato, proceso, pagos y estados de cuenta. Esta
// página es el punto de entrada: cada subcuenta lleva a su propio detalle.
export default function SubaccountsPage() {
  const { t, language } = useLanguage();
  const [subaccounts, setSubaccounts] = useState(null);

  const apiStatusMap = API_CONNECTION_STATUS(t);

  useEffect(() => {
    api.get('/client/api-subaccounts').then(({ data }) => setSubaccounts(data.subaccounts));
  }, []);

  if (!subaccounts) return <div className="qlc-empty">{t('common.loading')}</div>;

  return (
    <div>
      <div className="qlc-kicker">{t('clientSubaccounts.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientSubaccounts.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientSubaccounts.intro')}</p>

      {subaccounts.length === 0 ? (
        <div className="qlc-empty">{t('clientSubaccounts.none')}</div>
      ) : (
        <div className="qlc-detail-grid">
          {subaccounts.map((s) => {
            const status = statusOf(apiStatusMap, s.status, 'PENDIENTE');
            const model = s.clientModel?.model ? getLocalizedModel(s.clientModel.model, language) : null;
            return (
              <Link key={s.id} to={`/client/api-subaccounts/${s.id}`} className="qlc-card" style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{s.identifier || t('clientSubaccounts.unassignedIdentifier')}</h3>
                  <span className={`qlc-badge ${status.className}`}>{status.text}</span>
                </div>
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

import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { BitgetSteps, BitgetTransferData, BitgetAdvantages, BitgetConfirmNotice } from './BitgetTransferInfo';
import './BitgetTransfer.css';

/*
 * MODAL INFORMATIVO — TRANSFERENCIA INTERNA BITGET. Aparece una vez por
 * visita, justo después del aviso antiestafa (ver PublicHomePage). Es 100%
 * JSX/HTML/CSS (texto real y seleccionable, sin imágenes). Solo informa: la
 * confirmación real de la transferencia se hace dentro de la subcuenta.
 *
 * El UID viene del backend (configuración de pagos de QLC); si no hay uno
 * configurado se muestra "UID pendiente de configuración".
 */
export default function BitgetTransferModal({ onClose }) {
  const { t } = useLanguage();
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const buttonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/payment-info')
      .then(({ data }) => {
        if (!cancelled) setUid(data.bitgetReceiveUid || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    buttonRef.current?.focus({ preventScroll: true });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="qlc-bt-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="qlc-bt-modal-title">
      <div className="qlc-bt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qlc-bt-head">
          <span className="qlc-bt-icon" aria-hidden="true">⇄</span>
          <div className="qlc-bt-head-text">
            <div className="qlc-bt-head-row">
              <h2 id="qlc-bt-modal-title">{t('clientPayments.bitgetTitle')}</h2>
              <span className="qlc-bt-badge">{t('clientPayments.noFee')}</span>
            </div>
            <p className="qlc-bt-sub">{t('clientPayments.modalSubtitle')}</p>
          </div>
        </div>

        <BitgetSteps />
        <BitgetTransferData uid={uid} loading={loading} />
        <BitgetAdvantages />
        <BitgetConfirmNotice />

        <div className="qlc-bt-modal-actions">
          <button ref={buttonRef} type="button" className="qlc-btn primary" onClick={onClose}>
            {t('clientPayments.modalUnderstood')}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { BitgetSteps, BitgetTransferData, BitgetAdvantages } from './BitgetTransferInfo';
import './BitgetTransfer.css';

/*
 * MODAL INFORMATIVO — TRANSFERENCIA INTERNA BITGET. Aparece una vez por
 * visita, justo después del aviso antiestafa (ver PublicHomePage). Es 100%
 * JSX/HTML/CSS (texto real y seleccionable, sin imágenes). Solo informa: la
 * confirmación real de la transferencia se hace dentro de la subcuenta.
 *
 * Diseño ANCHO (no largo): en laptop/desktop los 3 pasos van en una fila,
 * "Datos de transferencia" y "Ventajas" en dos columnas y el pie combina la
 * nota de confirmación con el botón. Pensado para caber completo incluso en
 * 1024×600; el scroll interno queda solo como respaldo.
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
        <header className="qlc-bt-modal-head">
          <span className="qlc-bt-icon" aria-hidden="true">⇄</span>
          <div className="qlc-bt-head-text">
            <h2 id="qlc-bt-modal-title">{t('clientPayments.bitgetTitle')}</h2>
            <p className="qlc-bt-sub">{t('clientPayments.modalSubtitle')}</p>
          </div>
          <span className="qlc-bt-badge">{t('clientPayments.noFee')}</span>
        </header>

        <BitgetSteps layout="row" />

        <div className="qlc-bt-modal-grid">
          <BitgetTransferData uid={uid} loading={loading} />
          <BitgetAdvantages />
        </div>

        <footer className="qlc-bt-modal-foot">
          <div className="qlc-bt-confirm qlc-bt-confirm--inline">
            <span className="qlc-bt-confirm-icon" aria-hidden="true">i</span>
            <div>
              <div className="qlc-bt-confirm-title">{t('clientPayments.confirmTitle')}</div>
              <p>{t('clientPayments.confirmText')}</p>
            </div>
          </div>
          <button ref={buttonRef} type="button" className="qlc-btn primary qlc-bt-modal-ok" onClick={onClose}>
            {t('clientPayments.modalUnderstood')}
          </button>
        </footer>
      </div>
    </div>
  );
}

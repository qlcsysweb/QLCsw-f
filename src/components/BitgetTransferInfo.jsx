import { useLanguage } from '../i18n/LanguageContext';
import useCopyToClipboard from '../hooks/useCopyToClipboard';
import './BitgetTransfer.css';

/*
 * Bloque informativo de TRANSFERENCIA INTERNA BITGET, compartido por la
 * sección de pagos de la subcuenta y por el modal informativo de ingreso:
 * 3 pasos, datos de transferencia (plataforma, tipo, UID de recepción +
 * Copiar) y ventajas. Todo es texto HTML real (nada de imágenes).
 *
 * `uid`: el UID de recepción configurado por QLC tal como lo entrega el
 * backend. Si no hay uno configurado se muestra "pendiente" — nunca se
 * inventa un valor.
 */
// layout="row": los 3 pasos en una fila (modal ancho en laptop/desktop).
export function BitgetSteps({ layout = 'column' }) {
  const { t } = useLanguage();
  const steps = [
    [t('clientPayments.step1Title'), t('clientPayments.step1Text')],
    [t('clientPayments.step2Title'), t('clientPayments.step2Text')],
    [t('clientPayments.step3Title'), t('clientPayments.step3Text')],
  ];
  return (
    <ol className={`qlc-bt-steps${layout === 'row' ? ' qlc-bt-steps--row' : ''}`}>
      {steps.map(([title, text], i) => (
        <li key={title} className="qlc-bt-step">
          <span className="qlc-bt-step-num" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function BitgetTransferData({ uid, loading = false }) {
  const { t } = useLanguage();
  const { copy, isCopied } = useCopyToClipboard();
  return (
    <div className="qlc-bt-data">
      <div className="qlc-bt-data-title">{t('clientPayments.dataTitle')}</div>
      <dl>
        <div>
          <dt>{t('clientPayments.platform')}</dt>
          <dd>Bitget</dd>
        </div>
        <div>
          <dt>{t('clientPayments.type')}</dt>
          <dd>{t('clientPayments.typeValue')}</dd>
        </div>
      </dl>
      <div className="qlc-bt-uid">
        <span className="qlc-bt-uid-label">{t('clientPayments.receiveUid')}</span>
        <div className="qlc-bt-uid-row">
          {uid ? (
            <>
              <code className="qlc-bt-uid-value">{uid}</code>
              <button type="button" className="qlc-btn ghost qlc-bt-copy" onClick={() => copy(uid, 'bitget-uid')} aria-live="polite">
                {isCopied('bitget-uid') ? `✓ ${t('common.copied')}` : t('clientPayments.copy')}
              </button>
            </>
          ) : (
            <span className="qlc-bt-uid-pending">{loading ? t('common.loading') : t('clientPayments.uidPendingShort')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function BitgetAdvantages() {
  const { t } = useLanguage();
  return (
    <div className="qlc-bt-adv">
      <div className="qlc-bt-adv-title">
        <span aria-hidden="true">✓</span> {t('clientPayments.advantagesTitle')}
      </div>
      <ul>
        <li>{t('clientPayments.adv1')}</li>
        <li>{t('clientPayments.adv2')}</li>
        <li>{t('clientPayments.adv3')}</li>
        <li>{t('clientPayments.adv4')}</li>
      </ul>
    </div>
  );
}

export function BitgetConfirmNotice() {
  const { t } = useLanguage();
  return (
    <div className="qlc-bt-confirm">
      <div className="qlc-bt-confirm-title">{t('clientPayments.confirmTitle')}</div>
      <p>{t('clientPayments.confirmText')}</p>
    </div>
  );
}

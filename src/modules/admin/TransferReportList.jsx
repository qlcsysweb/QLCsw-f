import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { TRANSFER_REPORT_STATUS, statusOf } from '../../utils/statusLabels';
import { formatCdmxDate, formatCdmxDateTime } from '../../utils/cdmxTime';
import ConfirmModal from '../../components/ConfirmModal';

/*
 * TRANSFERENCIA INTERNA BITGET — reportes que envía el cliente (número de
 * orden + fecha/hora), integrados en el flujo de pagos/garantía existente.
 * Estados visibles simples: PENDIENTE / CONFIRMADO / RECHAZADO.
 *  - Pago de un estado de cuenta → "Confirmar" lo deja PAGADO (backend).
 *  - Pago de garantía → conserva sus pasos obligatorios (Transferencia
 *    recibida → Garantía reportada → Confirmar pago), un botón a la vez.
 */
function nextAction(report, t) {
  if (report.status === 'APROBADO' || report.status === 'RECHAZADO') return null;
  if (report.statementId) return { label: t('adminPayments.confirm'), run: () => api.patch(`/admin/payment-reports/${report.id}`, { status: 'APROBADO' }) };
  if (!report.transferReceivedAt) return { label: t('adminPayments.markTransferReceived'), run: () => api.patch(`/admin/payment-reports/${report.id}/transfer-received`) };
  if (!report.guaranteeReportedAt) return { label: t('adminPayments.guaranteeReported'), run: () => api.patch(`/admin/payment-reports/${report.id}/guarantee-reported`) };
  return { label: t('adminPayments.approvePayment'), run: () => api.patch(`/admin/payment-reports/${report.id}`, { status: 'APROBADO' }) };
}

export default function TransferReportList({ reports, receiveUid, showClient = false, onChanged }) {
  const { t, language } = useLanguage();
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [error, setError] = useState('');
  const statusMap = TRANSFER_REPORT_STATUS(t);

  const run = async (report, fn) => {
    setBusyId(report.id);
    setError('');
    try {
      await fn();
      onChanged?.();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      setBusyId(null);
    }
  };

  if (!reports.length) return <div className="qlc-empty">{t('adminPayments.noReports')}</div>;

  return (
    <>
      {error && <p className="qlc-field-error">{error}</p>}
      <ul className="qlc-plain-list qlc-transfer-list">
        {reports.map((r) => {
          const st = statusOf(statusMap, r.status);
          const action = nextAction(r, t);
          const clientName = r.apiSubaccount?.client ? `${r.apiSubaccount.client.firstName} ${r.apiSubaccount.client.lastName}` : '';
          const subLabel = r.apiSubaccount?.identifier || (r.apiSubaccount?.isPrincipal ? 'PRINCIPAL' : '—');
          return (
            <li key={r.id} className="qlc-transfer-item">
              <div className="qlc-transfer-head">
                <strong>{r.statementId ? t('adminPayments.conceptStatement') : t('adminPayments.conceptGuarantee')}</strong>
                <span className={`qlc-badge ${st.className}`}>{st.text}</span>
              </div>
              <dl className="qlc-transfer-data">
                {showClient && (
                  <>
                    <dt>{t('adminPayments.client')}</dt>
                    <dd>
                      {r.apiSubaccount?.clientId ? <Link to={`/admin/clients/${r.apiSubaccount.clientId}`}>{clientName}</Link> : clientName}
                    </dd>
                    <dt>{t('adminPayments.subaccount')}</dt>
                    <dd>
                      {r.apiSubaccount?.clientId ? (
                        <Link to={`/admin/clients/${r.apiSubaccount.clientId}/api-subaccounts/${r.apiSubaccountId}`}>{subLabel}</Link>
                      ) : (
                        subLabel
                      )}
                    </dd>
                  </>
                )}
                {receiveUid && r.bitgetOrderNumber && (
                  <>
                    <dt>{t('adminPayments.receiveUid')}</dt>
                    <dd><code>{receiveUid}</code></dd>
                  </>
                )}
                {r.bitgetOrderNumber ? (
                  <>
                    <dt>{t('adminPayments.orderNumber')}</dt>
                    <dd><code>{r.bitgetOrderNumber}</code></dd>
                    <dt>{t('adminPayments.transactionAt')}</dt>
                    <dd>{r.transactionAt ? formatCdmxDateTime(r.transactionAt) : '—'}</dd>
                  </>
                ) : (
                  <>
                    <dt>{t('adminPayments.legacyAmount')}</dt>
                    <dd>
                      {r.amount != null ? `${r.amount} ${r.currency}` : '—'} · {formatCdmxDate(r.reportedAt)}
                      {r.reference && <> · <code>{r.reference}</code></>}
                      {r.proofDriveFileId && (
                        <>
                          {' · '}
                          <a href={`${API_BASE_URL}/admin/payment-reports/${r.id}/proof`} target="_blank" rel="noreferrer">
                            {t('adminPayments.viewProofImage')}
                          </a>
                        </>
                      )}
                    </dd>
                  </>
                )}
                {r.transferReceivedAt && !r.statementId && (
                  <>
                    <dt>{t('adminPayments.transferReceivedOn')}</dt>
                    <dd>{formatCdmxDate(r.transferReceivedAt)}</dd>
                  </>
                )}
                {r.guaranteeReportedAt && !r.statementId && (
                  <>
                    <dt>{t('adminPayments.guaranteeReportedOn')}</dt>
                    <dd>{formatCdmxDate(r.guaranteeReportedAt)}</dd>
                  </>
                )}
              </dl>
              {action && (
                <div className="qlc-transfer-actions">
                  <button className="qlc-btn primary" disabled={busyId === r.id} onClick={() => run(r, action.run)}>
                    {action.label}
                  </button>
                  <button className="qlc-btn ghost" disabled={busyId === r.id} onClick={() => setRejecting(r)}>
                    {t('adminPayments.reject')}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {rejecting && (
        <ConfirmModal
          title={t('adminPayments.rejectTitle')}
          message={t('adminPayments.rejectMessage')
            .replace('{name}', rejecting.apiSubaccount?.client ? `${rejecting.apiSubaccount.client.firstName} ${rejecting.apiSubaccount.client.lastName}` : '')
            .replace('{order}', rejecting.bitgetOrderNumber || '—')}
          confirmLabel={t('adminPayments.reject')}
          onClose={() => setRejecting(null)}
          onConfirm={async () => {
            await api.patch(`/admin/payment-reports/${rejecting.id}`, { status: 'RECHAZADO' });
            onChanged?.();
          }}
        />
      )}
    </>
  );
}

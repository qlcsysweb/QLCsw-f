import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDateTime } from '../../utils/cdmxTime';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import Modal from '../../components/Modal';

const money = (n) => `${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

/*
 * PASO OBLIGATORIO ANTES DEL ESTADO DE CUENTA (cliente con promotor afiliador):
 * 1) ir al perfil del promotor y pagarle su comisión a su UID de Bitget;
 * 2) cargar aquí el comprobante (captura o PDF) y el monto pagado.
 * Solo entonces se desbloquea el formulario. Al generar el estado de cuenta,
 * el afiliador recibe su comisión ya PAGADA al mismo tiempo que el cliente.
 * Si el periodo no tuvo rentabilidad, no hay comisión: se puede continuar
 * sin pago (el sistema lo vuelve a validar al generar).
 */
export default function AffiliatePrepaymentStep({ subaccountId, info, noProfit, onNoProfitChange, onChanged, suggestedAmount }) {
  const { t, language } = useLanguage();
  const { copy, isCopied } = useCopyToClipboard();
  const [form, setForm] = useState({ amount: '', reference: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const busyRef = useRef(false);
  const inputRef = useRef(null);
  const { referrer, prepayment } = info;

  const run = async (fn) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
      onChanged?.();
      return true;
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t('affiliatePrepay.proofRequired'));
      return;
    }
    const fd = new FormData();
    fd.append('amount', form.amount);
    if (form.reference) fd.append('reference', form.reference);
    fd.append('file', file);
    const ok = await run(() => api.post(`/admin/api-subaccounts/${subaccountId}/affiliate-prepayment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
    if (ok) {
      setForm({ amount: '', reference: '' });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`qlc-aff-prepay${prepayment ? ' is-done' : ''}`}>
      <div className="qlc-aff-section-title">{t('affiliatePrepay.title')}</div>
      <dl className="qlc-aff-dl" style={{ marginBottom: 10 }}>
        <dt>{t('affiliatePrepay.promoter')}</dt>
        <dd>
          <Link to={`/admin/clients/${referrer.id}#qlc-affiliate-program`}>
            {referrer.name} {referrer.affiliateCode ? `(${referrer.affiliateCode})` : ''} → {t('affiliatePrepay.goToProfile')}
          </Link>
        </dd>
        <dt>{t('affiliatePrepay.uid')}</dt>
        <dd className="qlc-copy-row">
          {referrer.bitgetUid ? (
            <>
              <code>{referrer.bitgetUid}</code>
              <button type="button" className="qlc-btn ghost qlc-copy-btn" onClick={() => copy(referrer.bitgetUid, 'prepay-uid')}>
                {isCopied('prepay-uid') ? t('common.copied') : t('common.copy')}
              </button>
            </>
          ) : (
            <span style={{ color: 'var(--qlc-danger)' }}>{t('affiliatePrepay.noUid')}</span>
          )}
        </dd>
      </dl>

      {prepayment ? (
        <div>
          <p style={{ margin: '0 0 6px', color: 'var(--qlc-ok)', fontSize: 13 }}>
            ✓ {t('affiliatePrepay.paid')}: <strong>{money(prepayment.amount)}</strong> · {formatCdmxDateTime(prepayment.paidAt)}
            {prepayment.reference ? ` · ${prepayment.reference}` : ''}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="qlc-btn ghost" onClick={() => setViewing(true)}>
              {t('affiliatePrepay.viewProof')}
            </button>
            <button type="button" className="qlc-btn ghost" onClick={() => { setVoidReason(''); setVoiding(true); }}>
              {t('affiliatePrepay.void')}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--qlc-muted2)', margin: '6px 0 0' }}>{t('affiliatePrepay.unlockedHint')}</p>
        </div>
      ) : (
        <>
          <ol style={{ fontSize: 12, color: 'var(--qlc-muted)', margin: '0 0 10px', paddingLeft: 18 }}>
            <li>{t('affiliatePrepay.step1')}</li>
            <li>{t('affiliatePrepay.step2')}</li>
            <li>{t('affiliatePrepay.step3')}</li>
          </ol>
          <form onSubmit={submit}>
            <div className="qlc-aff-share-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div>
                <label className="qlc-label">{t('affiliatePrepay.amount')}</label>
                <input
                  className="qlc-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder={suggestedAmount > 0 ? String(suggestedAmount) : ''}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="qlc-label">{t('affiliatePrepay.reference')}</label>
                <input className="qlc-input" maxLength={200} value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
              </div>
            </div>
            <label className="qlc-label">{t('affiliatePrepay.proof')}</label>
            <input
              ref={inputRef}
              className="qlc-input"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {error && <p className="qlc-field-error">{error}</p>}
            <button type="submit" className="qlc-btn primary" style={{ marginTop: 8 }} disabled={busy || !referrer.bitgetUid}>
              {busy ? t('common.saving') : t('affiliatePrepay.register')}
            </button>
          </form>
          <label className="qlc-label" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, textTransform: 'none', letterSpacing: 0 }}>
            <input type="checkbox" checked={noProfit} onChange={(e) => onNoProfitChange(e.target.checked)} />
            <span>{t('affiliatePrepay.noProfit')}</span>
          </label>
        </>
      )}

      {viewing && prepayment && (
        <DocumentViewerModal url={`/admin/affiliate-payments/${prepayment.id}/proof`} fileName={prepayment.proofFileName || 'comprobante'} onClose={() => setViewing(false)} />
      )}
      {voiding && prepayment && (
        <Modal title={t('affiliatePrepay.voidTitle')} onClose={() => setVoiding(false)} width={440}>
          <label className="qlc-label">{t('affiliatePrepay.voidReason')}</label>
          <textarea className="qlc-textarea" rows={2} minLength={5} maxLength={300} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          {error && <p className="qlc-field-error">{error}</p>}
          <div className="qlc-form-actions">
            <button type="button" className="qlc-btn ghost" onClick={() => setVoiding(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="qlc-btn danger"
              disabled={busy || voidReason.trim().length < 5}
              onClick={async () => {
                const ok = await run(() => api.patch(`/admin/affiliate-prepayments/${prepayment.id}/void`, { reason: voidReason.trim() }));
                if (ok) setVoiding(false);
              }}
            >
              {t('affiliatePrepay.void')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

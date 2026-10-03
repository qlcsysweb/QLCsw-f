import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import { formatCdmxDate } from '../../utils/cdmxTime';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';
import Modal from '../../components/Modal';

// Corrección EXCEPCIONAL de atribución: solo ADMIN, motivo obligatorio y
// auditoría del valor anterior/nuevo en el backend.
function CorrectAttributionModal({ clientId, onClose, onDone }) {
  const { t, language } = useLanguage();
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/affiliates/${clientId}/referrer`, { affiliateCode: code.trim() || null, reason: reason.trim() });
      onDone();
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal title={t('adminAffiliates.correctTitle')} onClose={onClose} width={480}>
      <form onSubmit={submit}>
        <p style={{ fontSize: 13, color: 'var(--qlc-muted)', marginTop: 0 }}>{t('adminAffiliates.correctHint')}</p>
        <label className="qlc-label">{t('adminAffiliates.newAffiliateCode')}</label>
        <input className="qlc-input" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        <label className="qlc-label">{t('adminAffiliates.reason')}</label>
        <textarea className="qlc-textarea" rows={3} minLength={10} maxLength={500} required value={reason} onChange={(e) => setReason(e.target.value)} />
        {error && <p className="qlc-field-error">{error}</p>}
        <div className="qlc-form-actions">
          <button type="button" className="qlc-btn ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="qlc-btn danger" disabled={saving || reason.trim().length < 10}>
            {saving ? t('common.saving') : t('adminAffiliates.correctAttribution')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/*
 * ATRIBUCIÓN de un cliente (ficha admin): si A afilió a B, en la ficha de B
 * se ve el nombre de A, su liga y sus PCB. `affiliate` es la respuesta de
 * GET /admin/affiliates/:clientId (datos reales del backend).
 */
export default function AffiliateAttributionCard({ affiliate, onChanged, showManageLink = false }) {
  const { t } = useLanguage();
  const [correcting, setCorrecting] = useState(false);
  const { copy, isCopied } = useCopyToClipboard();
  const ref = affiliate.referredBy;
  const pcbs = (ref?.apiSubaccounts || []).map((s) => s.identifier || (s.isPrincipal ? t('affiliate.principal') : null)).filter(Boolean);

  return (
    <section className="qlc-card">
      <h3 style={{ marginTop: 0 }}>{t('adminAffiliates.attributionTitle')}</h3>
      <dl className="qlc-aff-dl">
        <dt>{t('adminAffiliates.referredVia')}</dt>
        <dd>
          {ref ? (
            <Link to={`/admin/affiliates/${ref.id}`}>
              {ref.firstName} {ref.lastName}
              {ref.affiliateCode ? ` (${ref.affiliateCode})` : ''}
            </Link>
          ) : (
            t('adminAffiliates.noReferrer')
          )}
          {ref && affiliate.referredAt && (
            <div style={{ fontSize: 11, color: 'var(--qlc-muted2)' }}>
              {formatCdmxDate(affiliate.referredAt)}
              {affiliate.referralSource ? ` · ${t(`adminAffiliates.source.${affiliate.referralSource}`)}` : ''}
              {affiliate.referralCodeUsed ? ` · ${t('adminAffiliates.codeUsed')}: ${affiliate.referralCodeUsed}` : ''}
            </div>
          )}
        </dd>
        {ref?.link && (
          <>
            <dt>{t('adminAffiliates.affiliateLink')}</dt>
            <dd className="qlc-copy-row">
              <code style={{ wordBreak: 'break-all' }}>{ref.link}</code>
              <button type="button" className="qlc-btn ghost qlc-copy-btn" onClick={() => copy(ref.link, 'ref-link')}>
                {isCopied('ref-link') ? t('common.copied') : t('common.copy')}
              </button>
            </dd>
          </>
        )}
        {ref && (
          <>
            <dt>{t('adminAffiliates.affiliatePcbs')}</dt>
            <dd>{pcbs.length ? pcbs.map((p) => <code key={p} style={{ marginRight: 6 }}>{p}</code>) : '—'}</dd>
          </>
        )}
        <dt>{t('adminAffiliates.ownProgram')}</dt>
        <dd>
          {affiliate.affiliateCode ? <code>{affiliate.affiliateCode}</code> : t('adminAffiliates.noCode')}{' '}
          <span className={`qlc-badge ${affiliate.affiliateEnabled ? 'ok' : affiliate.affiliateDisabledAt ? 'danger' : 'muted'}`}>
            {affiliate.affiliateEnabled ? t('affiliate.stateActive') : affiliate.affiliateDisabledAt ? t('affiliate.stateSuspended') : t('affiliate.stateNoLink')}
          </span>
          {' · '}
          {affiliate.referrals.length} {t('adminAffiliates.referrals').toLowerCase()}
        </dd>
      </dl>
      <div className="qlc-form-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
        {showManageLink && (
          <Link className="qlc-btn ghost" to={`/admin/affiliates/${affiliate.id}`}>
            {t('adminAffiliates.manage')}
          </Link>
        )}
        <button type="button" className="qlc-btn ghost" onClick={() => setCorrecting(true)}>
          {t('adminAffiliates.correctAttribution')}
        </button>
      </div>
      {correcting && (
        <CorrectAttributionModal
          clientId={affiliate.id}
          onClose={() => setCorrecting(false)}
          onDone={() => {
            setCorrecting(false);
            onChanged?.();
          }}
        />
      )}
    </section>
  );
}

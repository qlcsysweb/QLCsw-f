import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProcessPage() {
  const { t } = useLanguage();
  const [process, setProcess] = useState(null);

  const STEPS = [
    { type: 'CONTRACT', num: '01', label: t('clientProcess.step1Label'), hint: t('clientProcess.step1Hint'), to: '/client/contract' },
    { type: 'FUNDS', num: '02', label: t('clientProcess.step2Label'), hint: t('clientProcess.step2Hint'), to: null },
    { type: 'PAYMENT', num: '03', label: t('clientProcess.step3Label'), hint: t('clientProcess.step3Hint'), to: '/client/payments' },
    { type: 'API', num: '04', label: t('clientProcess.step4Label'), hint: t('clientProcess.step4Hint'), to: null },
    { type: 'ACTIVATION', num: '05', label: t('clientProcess.step5Label'), hint: t('clientProcess.step5Hint'), to: null },
  ];

  const STATUS_INFO = {
    CONFIRMED: { text: `✓ ${t('clientProcess.completed')}`, className: 'ok' },
    REJECTED: { text: `! ${t('clientProcess.needsAttention')}`, className: 'danger' },
    PENDING: { text: `○ ${t('clientProcess.pending')}`, className: 'warn' },
  };

  useEffect(() => {
    api.get('/client/process').then(({ data }) => setProcess(data.process));
  }, []);

  if (!process) return <div className="qlc-empty">{t('common.loading')}</div>;

  const conditionFor = (type) => process.conditions.find((c) => c.type === type);

  return (
    <div>
      <div className="qlc-kicker">{t('clientProcess.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientProcess.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', maxWidth: 640 }}>{t('clientProcess.intro')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 24 }}>
        {STEPS.map((step) => {
          const condition = conditionFor(step.type);
          const status = condition?.status || 'PENDING';
          const info = STATUS_INFO[status] || STATUS_INFO.PENDING;
          return (
            <div
              key={step.type}
              className="qlc-card"
              style={{
                borderColor:
                  status === 'CONFIRMED'
                    ? 'var(--qlc-ok-border)'
                    : status === 'REJECTED'
                    ? 'var(--qlc-danger-border)'
                    : 'var(--qlc-line)',
              }}
            >
              <div className="qlc-kicker">{step.num}</div>
              <strong style={{ display: 'block', margin: '6px 0' }}>{step.label}</strong>
              <span className={`qlc-badge ${info.className}`}>{info.text}</span>
              {status !== 'CONFIRMED' && step.to && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 12, color: 'var(--qlc-muted2)', margin: '0 0 8px' }}>
                    {t('clientProcess.needToComplete')}
                  </p>
                  <Link className="qlc-btn primary" to={step.to} style={{ width: '100%', display: 'block', textAlign: 'center' }}>
                    {step.hint}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {process.isActivated && (
        <div className="qlc-card" style={{ marginTop: 20, borderColor: 'var(--qlc-ok-border)' }}>
          ✓ {t('clientProcess.activatedSince')} {new Date(process.activatedAt).toLocaleDateString()}.
        </div>
      )}
    </div>
  );
}

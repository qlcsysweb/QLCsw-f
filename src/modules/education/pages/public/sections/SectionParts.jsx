import { useState } from 'react';
import { AnimatedHeading } from '../../../components/public/AnimatedHeading.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { useI18n } from '../../../i18n/I18nContext.jsx';

export function SectionHead({ section, as = 'h2', compact }) {
  return (
    <header className={`ps-head ${compact ? 'is-compact' : ''}`}>
      {section.eyebrow && <div className="ps-eyebrow reveal" style={{ '--r': 0 }}><span className="dot" />{section.eyebrow}</div>}
      <AnimatedHeading as={as} text={section.title} highlight={section.highlight} className="ps-title" delay={60} />
      {section.description && <p className="ps-lead reveal" style={{ '--r': 2 }}>{section.description}</p>}
    </header>
  );
}

export function CtaButton({ label, target, go, variant = 'primary' }) {
  if (!label) return null;
  return (
    <button type="button" className={`pbtn pbtn-${variant}`} onClick={() => go(target)}>
      {label}
      {variant === 'primary' && <span className="pbtn-arrow" aria-hidden="true">→</span>}
    </button>
  );
}

export function SectionCtas({ section, go }) {
  if (!section.primaryCtaLabel && !section.secondaryCtaLabel) return null;
  return (
    <div className="ps-ctas reveal" style={{ '--r': 4 }}>
      <CtaButton label={section.primaryCtaLabel} target={section.primaryCtaTarget} go={go} />
      <CtaButton label={section.secondaryCtaLabel} target={section.secondaryCtaTarget} go={go} variant="ghost" />
    </div>
  );
}

export function MoreInfo({ label, title, children }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ps-more" onClick={() => setOpen(true)}>{label || t('public.more')}</button>
      <Modal open={open} title={title} onClose={() => setOpen(false)}>{children}</Modal>
    </>
  );
}

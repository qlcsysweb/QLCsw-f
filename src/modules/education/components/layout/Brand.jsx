import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

export const BRAND_NAME = 'QLC';
export const BRAND_TAGLINE = 'Institutional Investment Academy';
export const BRAND_FULL = `${BRAND_NAME} · ${BRAND_TAGLINE}`;

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand">
      <BrandLogo className="brand-mark" alt={BRAND_NAME} width="43" height="43" />
      <span>{BRAND_TAGLINE}</span>
    </Link>
  );
}

export function Disclaimer() {
  const { t } = useI18n();
  return <div className="footer-note">{BRAND_FULL} · {t('common.disclaimer')}</div>;
}

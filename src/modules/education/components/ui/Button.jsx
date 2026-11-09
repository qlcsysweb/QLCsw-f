import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { tr } from '../../i18n/tr.js';

export function Button({ variant = 'primary', loading, children, className = '', ...rest }) {
  const { t } = useI18n();
  return (
    <button className={`btn-${variant} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? t('common.processing') : tr(children)}
    </button>
  );
}

export function LinkButton({ to, variant = 'primary', children, className = '' }) {
  return (
    <Link to={to} className={`btn-${variant} ${className}`}>
      {tr(children)}
    </Link>
  );
}

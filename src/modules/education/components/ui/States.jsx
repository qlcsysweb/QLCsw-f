import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { tr } from '../../i18n/tr.js';

export function Loading({ text }) {
  const { t } = useI18n();
  return (
    <div className="state state-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{tr(text) || t('app.states.loading')}</span>
    </div>
  );
}

export function Empty({ title, text, action }) {
  const { t } = useI18n();
  return (
    <div className="state state-empty">
      <div className="state-icon" aria-hidden="true">◇</div>
      <h3>{tr(title) || t('app.states.emptyTitle')}</h3>
      {text && <p>{tr(text)}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useI18n();
  const status = error?.status;
  if (status === 401) {
    return (
      <div className="state state-error">
        <h3>{t('app.states.expiredTitle')}</h3>
        <p>{t('app.states.expiredText')}</p>
        <Link className="btn-primary" to="/login">{t('app.states.login')}</Link>
      </div>
    );
  }
  if (status === 403) {
    return (
      <div className="state state-forbidden">
        <div className="state-icon" aria-hidden="true">🔒</div>
        <h3>{t('app.states.forbidden')}</h3>
        <p>{tr(error.message)}</p>
      </div>
    );
  }
  return (
    <div className="state state-error" role="alert">
      <h3>{t('app.states.errorTitle')}</h3>
      <p>{tr(error?.message) || t('app.states.unexpected')}</p>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>{t('app.states.retry')}</button>}
    </div>
  );
}

export function AsyncView({ loading, error, data, onRetry, isEmpty, empty, children }) {
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (data === null || data === undefined) return null;
  if (isEmpty?.(data)) return empty || <Empty />;
  return children(data);
}

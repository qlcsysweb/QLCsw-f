import { useI18n } from '../../i18n/I18nContext.jsx';
import { tr } from '../../i18n/tr.js';

export function DataTable({ columns, rows, rowKey = 'id', empty, footer }) {
  const { t } = useI18n();
  return (
    <div className="table-wrap">
      <table className="table responsive">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'right' : ''}>{tr(c.label)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="empty-row"><td colSpan={columns.length}>{tr(empty) || t('app.noRecords')}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={r[rowKey] ?? i}>
              {columns.map((c) => (
                <td key={c.key} data-label={tr(c.label)} className={`${c.align === 'right' ? 'right' : ''} ${c.className?.(r) || ''}`}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

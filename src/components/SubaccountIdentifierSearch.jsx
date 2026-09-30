import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

/*
 * BUSCADOR POR IDENTIFICADOR INTERNO (admin) — al escribir el identificador
 * (ej. "PCB-1-A-1", completo o una parte) aparece la subcuenta y el cliente
 * al que está ligada, con acceso directo a su ficha.
 */
export default function SubaccountIdentifierSearch() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .get('/admin/api-subaccounts/search', { params: { q } })
        .then(({ data }) => {
          if (!cancelled) setResults(data.results);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="qlc-card qlc-ident-search">
      <label className="qlc-label" htmlFor="identifier-search" style={{ marginTop: 0 }}>
        {t('adminIdentifierSearch.label')}
      </label>
      <input
        id="identifier-search"
        className="qlc-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('adminIdentifierSearch.placeholder')}
        autoComplete="off"
        spellCheck={false}
      />
      {results !== null &&
        (results.length === 0 ? (
          <p className="qlc-ident-search-empty">{t('adminIdentifierSearch.none')}</p>
        ) : (
          <ul className="qlc-plain-list qlc-ident-search-results">
            {results.map((r) => (
              <li key={r.id}>
                <Link to={`/admin/clients/${r.client.id}/api-subaccounts/${r.id}`}>
                  <strong>{r.identifier}</strong>
                </Link>
                <span>
                  {' '}
                  — {r.client.firstName} {r.client.lastName}
                  {r.client.username ? ` (${r.client.username})` : ''} ·{' '}
                  {r.isPrincipal ? 'PRINCIPAL' : `${t('adminIdentifierSearch.subaccount')} #${r.slotIndex}`}
                  {r.deactivatedAt ? ` · ${t('adminIdentifierSearch.inactive')}` : ''}
                </span>
                <Link className="qlc-btn ghost" to={`/admin/clients/${r.client.id}`}>
                  {t('adminIdentifierSearch.openClient')}
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

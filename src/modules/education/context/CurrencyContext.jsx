import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CURRENCIES, getCurrency, setCurrency as applyCurrency } from '../utils/format.js';
import { tr } from '../i18n/tr.js';

const CurrencyContext = createContext({ currency: 'MXN', setCurrency: () => {} });

export function CurrencyProvider({ children }) {
  const [currency, setState] = useState(getCurrency);
  const setCurrency = useCallback((code) => {
    applyCurrency(code);
    setState(getCurrency());
  }, []);
  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencySelect() {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="currency-select">
      <span>{tr('Moneda')}</span>
      <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label={tr('Moneda en la que se muestran tus cifras')}>
        {CURRENCIES.map(([code, name]) => <option key={code} value={code}>{code} · {tr(name)}</option>)}
      </select>
    </label>
  );
}

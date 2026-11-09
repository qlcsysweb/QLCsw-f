let locale = 'es-MX';
const LOCALES = { en: 'en-US', es: 'es-MX', pt: 'pt-BR' };

export const setFormatLocale = (lang) => {
  locale = LOCALES[lang] || LOCALES.es;
};

export const CURRENCIES = [
  ['MXN', 'Peso mexicano'],
  ['USD', 'Dólar estadounidense'],
  ['EUR', 'Euro'],
  ['GBP', 'Libra esterlina'],
  ['CAD', 'Dólar canadiense'],
  ['CHF', 'Franco suizo'],
  ['JPY', 'Yen japonés'],
  ['COP', 'Peso colombiano'],
  ['CLP', 'Peso chileno'],
  ['ARS', 'Peso argentino'],
  ['PEN', 'Sol peruano'],
  ['BRL', 'Real brasileño'],
];
const CURRENCY_KEY = 'edu_currency';
const SHARED_SYMBOL = ['USD', 'CAD', 'COP', 'CLP', 'ARS'];
const isCurrency = (code) => CURRENCIES.some(([c]) => c === code);

function storedCurrency() {
  try {
    const code = typeof window === 'undefined' ? null : window.localStorage.getItem(CURRENCY_KEY);
    return isCurrency(code) ? code : 'MXN';
  } catch {
    return 'MXN';
  }
}

let currency = storedCurrency();
const formatters = new Map();
const formatterFor = (code) => {
  const key = `${locale}|${code}`;
  if (!formatters.has(key)) formatters.set(key, new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay: SHARED_SYMBOL.includes(code) ? 'code' : 'narrowSymbol' }));
  return formatters.get(key);
};

export const getCurrency = () => currency;
export const setCurrency = (code) => {
  if (!isCurrency(code)) return;
  currency = code;
  try {
    window.localStorage.setItem(CURRENCY_KEY, code);
  } catch {
    return;
  }
};

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const invalid = (n) => n === null || n === undefined || Number.isNaN(Number(n));

export const money = (n) => (invalid(n) ? '—' : formatterFor(currency).format(Number(n)));
export const priceMoney = (n) => (invalid(n) ? '—' : mxn.format(Number(n)));

export const signedMoney = (n) => {
  if (n === null || n === undefined) return '—';
  const v = Number(n);
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatterFor(currency).format(Math.abs(v))}`;
};

export const pct = (n, { signed = false } = {}) => {
  if (n === null || n === undefined) return 'N/D';
  const v = Number(n);
  return `${signed && v > 0 ? '+' : ''}${v.toFixed(2)}%`;
};

export const tone = (n) => (n === null || n === undefined || Number(n) === 0 ? '' : Number(n) > 0 ? 'up' : 'down');

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const monthOf = (m, month) => (m >= 1 && m <= 12 ? capitalize(new Date(2000, m - 1, 1).toLocaleDateString(locale, { month })) : '');
export const monthName = (m) => monthOf(m, 'long');
export const periodLabel = (p) => (p ? `${monthName(p.month)} ${p.year}` : '');
export const shortMonth = (m) => monthOf(m, 'long').slice(0, 3);
export const count = (n) => Number(n || 0).toLocaleString(locale);

export const date = (d) => (d ? new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const dateTime = (d) =>
  d ? new Date(d).toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const utcDateTime = (d) =>
  d ? `${new Date(d).toLocaleString(locale, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} UTC` : '—';
export const utcDateInput = (d) => new Date(d).toISOString().slice(0, 10);
export const utcTimeInput = (d) => new Date(d).toISOString().slice(11, 16);
export const fromUtcInputs = (date, time) => new Date(`${date}T${time}:00Z`).toISOString();
export const APPOINTMENT_DURATIONS = [20, 40, 60];

export const toDateInput = (d) => {
  const x = d ? new Date(d) : new Date();
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const usdNum = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdFmt = { format: (n) => `${usdNum.format(n)} USD` };
export const usd = (n) => (n === null || n === undefined ? '—' : usdFmt.format(Number(n)));
export const signedUsd = (n) => {
  if (n === null || n === undefined) return '—';
  const v = Number(n);
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${usdFmt.format(Math.abs(v))}`;
};

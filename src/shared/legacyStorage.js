const EDUCATION_KEYS = ['token', 'lang', 'lang_pending', 'currency', 'public_offers', 'login_notice', '2fa_challenge', 'intro_seen'];
const EDUCATION_PREFIXES = ['period_', 'lang_synced_'];
const TRADING_KEYS = { qlc_auth_token: 'trad_auth_token' };
const TRADING_COOKIES = { qlc_language: 'trad_language', qlc_language_prompt_date: 'trad_language_prompt_date' };

function moveKey(storage, from, to) {
  const value = storage.getItem(from);
  if (value === null) return;
  if (storage.getItem(to) === null) storage.setItem(to, value);
  storage.removeItem(from);
}

export function migrateEducationStorage() {
  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      EDUCATION_KEYS.forEach((key) => moveKey(storage, `qlc_${key}`, `edu_${key}`));
      Object.keys(storage)
        .filter((key) => EDUCATION_PREFIXES.some((prefix) => key.startsWith(`qlc_${prefix}`)))
        .forEach((key) => moveKey(storage, key, key.replace(/^qlc_/, 'edu_')));
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function migrateTradingStorage(cookiePath) {
  try {
    Object.entries(TRADING_KEYS).forEach(([from, to]) => moveKey(window.localStorage, from, to));
    for (const storage of [window.sessionStorage]) {
      moveKey(storage, 'qlc_bitget_modal_pending', 'trad_bitget_modal_pending');
      moveKey(storage, 'qlc_account_notice', 'trad_account_notice');
    }
    Object.entries(TRADING_COOKIES).forEach(([from, to]) => {
      const match = document.cookie.match(new RegExp(`(?:^|; )${from}=([^;]*)`));
      if (!match) return;
      document.cookie = `${to}=${match[1]}; Max-Age=${365 * 24 * 60 * 60}; Path=${cookiePath}; SameSite=Lax`;
      document.cookie = `${from}=; Max-Age=0; Path=/; SameSite=Lax`;
    });
  } catch {
    return undefined;
  }
  return undefined;
}

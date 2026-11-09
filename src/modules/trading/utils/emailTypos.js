// Detección de errores comunes al escribir el dominio del correo
// ("marioendo12@gmai.com" → "marioendo12@gmail.com"). Solo SUGIERE la
// corrección; la confirmación real del correo es el código de verificación.
const KNOWN = {
  'gmail.com': ['gmai.com', 'gmial.com', 'gmal.com', 'gamil.com', 'gnail.com', 'gmaill.com', 'gmail.co', 'gmail.con', 'gmail.cm', 'gmail.om', 'gmail.comm', 'gmeil.com', 'gmali.com', 'gmil.com', 'gmaul.com', 'gemail.com'],
  'hotmail.com': ['hotmai.com', 'hotmial.com', 'hotmal.com', 'hotmil.com', 'hotamil.com', 'homail.com', 'hotmaill.com', 'hotmail.co', 'hotmail.con', 'hormail.com', 'htmail.com'],
  'outlook.com': ['outlok.com', 'outllok.com', 'outloo.com', 'outlook.co', 'outlook.con', 'otlook.com', 'outlookk.com'],
  'yahoo.com': ['yaho.com', 'yahooo.com', 'yhoo.com', 'yahoo.co', 'yahoo.con', 'yaoo.com'],
  'icloud.com': ['iclod.com', 'icloud.co', 'icloud.con', 'iclould.com', 'icoud.com'],
  'live.com': ['live.co', 'live.con', 'liv.com'],
};
const TYPO_TO_DOMAIN = Object.fromEntries(Object.entries(KNOWN).flatMap(([domain, typos]) => typos.map((typo) => [typo, domain])));

export function suggestEmailFix(email) {
  const value = String(email || '').trim();
  const at = value.lastIndexOf('@');
  if (at < 1) return null;
  const domain = value.slice(at + 1).toLowerCase();
  const fix = TYPO_TO_DOMAIN[domain];
  return fix ? `${value.slice(0, at)}@${fix}` : null;
}

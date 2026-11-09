// El identificador interno de la subcuenta (ej. PCB-1-A-1) es un control
// interno de QLC y nunca se muestra al cliente (el backend ya no lo envía).
// Al cliente se le nombra de forma neutra: PRINCIPAL o "Subcuenta #N".
export function clientSubaccountLabel(subaccount, t) {
  if (!subaccount) return '';
  if (subaccount.isPrincipal) return t('clientSubaccounts.principalLabel');
  return subaccount.slotIndex != null ? t('clientSubaccounts.numberedLabel').replace('{n}', subaccount.slotIndex) : '';
}

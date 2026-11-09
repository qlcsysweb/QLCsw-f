import { useState } from 'react';

// Copiar al portapapeles con respaldo para contextos sin API de Clipboard
// (HTTP, ciertos WebViews) — mismo patrón ya usado en BitgetTransferSection.
export default function useCopyToClipboard(resetMs = 2000) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copy = async (value, key = value) => {
    if (!value) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(area);
    }
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), resetMs);
    }
  };

  return { copy, isCopied: (key) => copiedKey === key };
}

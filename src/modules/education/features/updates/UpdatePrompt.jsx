import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandLogo } from '../../components/layout/BrandLogo.jsx';
import { BRAND_FULL } from '../../components/layout/Brand.jsx';
import { tr } from '../../i18n/tr.js';

const CURRENT_VERSION = typeof __APP_VERSION__ === 'undefined' ? null : __APP_VERSION__;
const CHECK_EVERY_MS = 5 * 60 * 1000;
const FIRST_CHECK_MS = 8000;
const SNOOZE_MS = 30 * 60 * 1000;
const VERSION_PARAM = 'v';
const VOLATILE_KEYS = ['edu_public_offers'];

async function fetchLatestVersion() {
  const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.version || null;
}

async function clearBrowserCaches() {
  const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : [];
  await Promise.all(registrations.map((r) => r.unregister()));
  const keys = 'caches' in window ? await caches.keys() : [];
  await Promise.all(keys.map((k) => caches.delete(k)));
  VOLATILE_KEYS.forEach((k) => localStorage.removeItem(k));
}

function reloadFresh(version) {
  const url = new URL(window.location.href);
  url.searchParams.set(VERSION_PARAM, version || Date.now().toString(36));
  window.location.replace(url.toString());
}

function useNewVersion() {
  const [state, setState] = useState({ version: null, reason: null });
  const snoozedUntil = useRef(0);

  const check = useCallback(async () => {
    if (Date.now() < snoozedUntil.current) return;
    const latest = await fetchLatestVersion().catch(() => null);
    if (CURRENT_VERSION && latest && latest !== CURRENT_VERSION) setState({ version: latest, reason: 'NEW_VERSION' });
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has(VERSION_PARAM)) {
      url.searchParams.delete(VERSION_PARAM);
      window.history.replaceState(window.history.state, '', url.toString());
    }
    const first = setTimeout(check, FIRST_CHECK_MS);
    const interval = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const onChunkError = (e) => {
      e.preventDefault();
      setState({ version: null, reason: 'LOAD_ERROR' });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('vite:preloadError', onChunkError);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('vite:preloadError', onChunkError);
    };
  }, [check]);

  const snooze = useCallback(() => {
    snoozedUntil.current = Date.now() + SNOOZE_MS;
    setState({ version: null, reason: null });
  }, []);

  return { ...state, snooze };
}

export function UpdatePrompt() {
  const { version, reason, snooze } = useNewVersion();
  const [busy, setBusy] = useState(false);
  if (!reason) return null;

  const update = () => {
    setBusy(true);
    clearBrowserCaches().catch(() => null).finally(() => reloadFresh(version));
  };

  return (
    <div className="update-toast" role="dialog" aria-live="polite" aria-labelledby="update-title" aria-describedby="update-text">
      <div className="update-halo" aria-hidden="true"><span /></div>
      <div className="update-ring" aria-hidden="true"><span /></div>
      <div className="update-inner">
        <BrandLogo className="update-logo" width="40" height="40" />
        <div className="update-copy">
          <b id="update-title">{reason === 'LOAD_ERROR' ? tr('Hay una versión más reciente') : tr('Nueva versión disponible')}</b>
          <span id="update-text">Borra la caché y recarga para ver la última versión de {BRAND_FULL}.</span>
        </div>
        <div className="update-actions">
          <button type="button" className="update-primary" onClick={update} disabled={busy}>{busy ? tr('Actualizando…') : tr('Actualizar')}</button>
          <button type="button" className="update-close" onClick={snooze} aria-label={tr('Recordarme más tarde')}>×</button>
        </div>
      </div>
    </div>
  );
}

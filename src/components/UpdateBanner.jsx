import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/*
 * AVISO DE NUEVA VERSIÓN — una pestaña que se dejó abierta sigue ejecutando el
 * código con el que se cargó, aunque ya se haya publicado una versión nueva
 * (así se mezclaban pantallas viejas con el servidor nuevo). Cada build publica
 * /version.json con su identificador; aquí se consulta cada minuto y al volver
 * a la pestaña, y si cambió se ofrece actualizar con un clic.
 * En desarrollo no existe /version.json y el aviso nunca aparece.
 *
 * "Actualizar" borra la caché de la versión anterior (Cache Storage, service
 * workers y la copia HTTP de la página) antes de recargar, para que se vea la
 * versión nueva completa. La sesión y el idioma se conservan.
 */
const CHECK_EVERY_MS = 60 * 1000;
// eslint-disable-next-line no-undef
const RUNNING_BUILD = typeof __QLC_BUILD_ID__ !== 'undefined' ? __QLC_BUILD_ID__ : null;

// Borra todo lo que el navegador guardó de la versión anterior y recarga.
async function clearOldVersionAndReload() {
  try {
    if (window.caches) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Cache Storage no disponible (navegación privada, etc.).
  }
  try {
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    // Sin service workers registrados.
  }
  try {
    // Reemplaza en la caché HTTP la página vieja por la nueva (la ruta actual y
    // la raíz), así la recarga ya no puede servir el index.html anterior.
    const paths = new Set([window.location.pathname + window.location.search, '/', '/index.html']);
    await Promise.all([...paths].map((p) => fetch(p, { cache: 'reload', credentials: 'same-origin' })));
  } catch {
    // Sin conexión: la recarga lo intentará de nuevo.
  }
  window.location.reload();
}

export default function UpdateBanner() {
  const { t } = useLanguage();
  const [outdated, setOutdated] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Si una pantalla intenta cargar un archivo de la versión anterior que ya no
  // existe en el servidor (se publicó una nueva), se ofrece actualizar en vez
  // de dejar la pantalla rota.
  useEffect(() => {
    const onPreloadError = (event) => {
      event.preventDefault();
      setOutdated(true);
    };
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);

  useEffect(() => {
    if (!RUNNING_BUILD || import.meta.env.DEV) return undefined;
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (!stopped && buildId && buildId !== RUNNING_BUILD) setOutdated(true);
      } catch {
        // Sin conexión o archivo no disponible: se reintenta en el siguiente ciclo.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []);

  if (!outdated) return null;
  return (
    <div className="qlc-update-banner" role="status">
      <span>{t('updateBanner.text')}</span>
      <button
        type="button"
        className="qlc-btn primary"
        disabled={updating}
        onClick={() => {
          setUpdating(true);
          clearOldVersionAndReload();
        }}
      >
        {updating ? t('updateBanner.updating') : t('updateBanner.reload')}
      </button>
    </div>
  );
}

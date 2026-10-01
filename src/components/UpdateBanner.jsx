import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/*
 * AVISO DE NUEVA VERSIÓN — una pestaña que se dejó abierta sigue ejecutando el
 * código con el que se cargó, aunque ya se haya publicado una versión nueva
 * (así se mezclaban pantallas viejas con el servidor nuevo). Cada build publica
 * /version.json con su identificador; aquí se consulta cada minuto y al volver
 * a la pestaña, y si cambió se ofrece actualizar con un clic.
 * En desarrollo no existe /version.json y el aviso nunca aparece.
 */
const CHECK_EVERY_MS = 60 * 1000;
// eslint-disable-next-line no-undef
const RUNNING_BUILD = typeof __QLC_BUILD_ID__ !== 'undefined' ? __QLC_BUILD_ID__ : null;

export default function UpdateBanner() {
  const { t } = useLanguage();
  const [outdated, setOutdated] = useState(false);

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
      <button type="button" className="qlc-btn primary" onClick={() => window.location.reload()}>
        {t('updateBanner.reload')}
      </button>
    </div>
  );
}

import { useEffect, useRef } from 'react';

// Actualización sin refresh manual (ni recarga automática de la página):
// vuelve a ejecutar `fn` cada `intervalMs` en segundo plano, y también en
// cuanto la pestaña recupera el foco/visibilidad, para que cambios hechos
// por otro rol (admin/cliente/visitante público) aparezcan solos. Mismo
// patrón que ya se usaba de forma manual (setInterval) en el chat de
// soporte y en varias páginas de administración — esto solo lo centraliza.
// No reemplaza la carga inicial: se usa junto a un useEffect(load, [...]).
export default function usePolling(fn, intervalMs = 8000) {
  const savedFn = useRef(fn);
  savedFn.current = fn;

  useEffect(() => {
    if (!intervalMs) return undefined;
    const tick = () => savedFn.current();
    const interval = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs]);
}

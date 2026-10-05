import { useLayoutEffect } from 'react';

// SIN SCROLL: si el panel de un modal no cabe en el alto de la pantalla
// (laptops chicas, celulares), se reduce proporcionalmente (zoom) hasta caber
// completo. Se re-ajusta al cambiar el tamaño de la ventana o el contenido.
export default function useFitToViewport(panelRef) {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;
    let frame = 0;
    const fit = () => {
      panel.style.zoom = '1';
      const overlay = panel.parentElement;
      const cs = getComputedStyle(overlay);
      const availH = overlay.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      // Al reducir, el texto ocupa menos renglones; se afina en varias pasadas
      // para usar el mayor tamaño posible que todavía quepa.
      let scale = Math.min(1, availH / panel.offsetHeight);
      for (let i = 0; i < 4 && scale < 1; i += 1) {
        panel.style.zoom = String(scale);
        const h = panel.getBoundingClientRect().height;
        const next = Math.min(1, scale * (availH / h));
        if (Math.abs(next - scale) < 0.005) break;
        scale = next;
      }
      panel.style.zoom = scale < 1 ? String(Math.floor(scale * 1000) / 1000) : '';
      if (panel.getBoundingClientRect().height > availH + 1) panel.style.zoom = String(Math.floor(scale * 0.98 * 1000) / 1000);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener('resize', schedule);
    // Re-ajusta si cambia el contenido (logo cargado, fuentes, idioma).
    const ro = new ResizeObserver(schedule);
    Array.from(panel.children).forEach((c) => ro.observe(c));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, [panelRef]);
}

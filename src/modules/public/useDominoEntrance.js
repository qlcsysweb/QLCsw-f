import { useLayoutEffect } from 'react';

// Piezas que entran completas, como una sola ficha (tarjetas, nodos, filas).
const CARD_SELECTOR = [
  '.hero-mini .mini',
  '.feature-item',
  '.flow-node',
  '.pillar',
  '.model-card',
  '.security-card',
  '.status',
  'details',
  'tr',
  '.qlc-section-media-item',
].join(',');

// Piezas de texto/controles sueltos: llegan una por una dentro de sus
// paneles (el panel ya está en su lugar y el contenido se va acomodando).
const LEAF_SELECTOR = [
  '.eyebrow',
  '.kicker',
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  '.hero-logo',
  '.actions > *',
  '.trust > span',
  '.range',
  '.btn',
  '.registro-panel label',
  '.registro-panel input',
  '.registro-panel textarea',
  '.footer-grid > div > div',
  '.disclaimer',
].join(',');

// Duración total aproximada de la cascada: el intervalo entre fichas es el
// mismo para toda la sección (uniforme) y se ajusta al número de piezas para
// que ninguna sección tarde demasiado en terminar de acomodarse.
const TARGET_TOTAL_MS = 1100;
const MIN_STEP_MS = 22;
const MAX_STEP_MS = 70;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/*
 * Entrada "dominó" de la sección visible: al mostrarse, sus elementos
 * aparecen en orden de lectura, uno tras otro, con un intervalo constante.
 * Solo se animan las piezas que aún no entraron (si el FAQ o los modelos
 * llegan después de la carga inicial, se suman a la cascada sin repetir la
 * animación de lo que ya estaba acomodado).
 */
export default function useDominoEntrance(containerRef, deps) {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || prefersReducedMotion()) return;

    const cards = [...root.querySelectorAll(CARD_SELECTOR)];
    const insideCard = (el) => cards.some((card) => card !== el && card.contains(el));
    const pieces = [...root.querySelectorAll(`${CARD_SELECTOR},${LEAF_SELECTOR}`)].filter(
      (el) => !el.classList.contains('qlc-domino') && !insideCard(el) && !el.closest('[data-no-domino]')
    );
    if (pieces.length === 0) return;

    const step = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, TARGET_TOTAL_MS / pieces.length));
    pieces.forEach((el, i) => {
      el.style.setProperty('--qlc-d', `${Math.round(i * step)}ms`);
      el.classList.add('qlc-domino');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

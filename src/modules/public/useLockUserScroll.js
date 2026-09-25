import { useEffect } from 'react';

const SCROLL_KEYS = new Set([' ', 'Spacebar', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);

// ¿El evento ocurre dentro de algo que tiene su propio scroll (modal, textarea,
// lista)? En ese caso se deja pasar: solo se bloquea el scroll de la PÁGINA.
function insideInnerScroller(target) {
  for (let el = target; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    if (!(el instanceof HTMLElement)) continue;
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return true;
  }
  return false;
}

// En la página pública el usuario no se desplaza con rueda/dedo/teclado ni con
// barra de scroll: se mueve únicamente con los botones del navbar (que usan
// scrollIntoView programático, no afectado por este bloqueo).
export default function useLockUserScroll() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('qlc-no-user-scroll');

    const block = (e) => {
      if (insideInnerScroller(e.target)) return;
      e.preventDefault();
    };
    const blockKeys = (e) => {
      if (!SCROLL_KEYS.has(e.key)) return;
      const tag = e.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag) || e.target?.isContentEditable) return;
      if (insideInnerScroller(e.target)) return;
      e.preventDefault();
    };

    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', blockKeys);
    return () => {
      html.classList.remove('qlc-no-user-scroll');
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', blockKeys);
    };
  }, []);
}

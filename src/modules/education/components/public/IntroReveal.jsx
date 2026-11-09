import { useEffect, useState } from 'react';
import { BrandLogo } from '../layout/BrandLogo.jsx';

const SEEN_KEY = 'edu_intro_seen';
const DURATION = 760;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function IntroReveal() {
  const [phase, setPhase] = useState(() => (alreadySeen() || prefersReducedMotion() ? 'done' : 'playing'));

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      return undefined;
    }
    const leave = setTimeout(() => setPhase('leaving'), DURATION);
    const done = setTimeout(() => setPhase('done'), DURATION + 420);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, [phase]);

  if (phase === 'done') return null;
  return (
    <div className={`intro ${phase === 'leaving' ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="intro-mark">
        <BrandLogo width="148" height="128" />
        <span className="intro-sweep" />
      </div>
      <span className="intro-line" />
    </div>
  );
}

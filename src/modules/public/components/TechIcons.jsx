// Íconos de las etapas de la tecnología QLC (SVG en línea, color heredado).
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const StrategyIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
);

// Cerebro con circuito (etapa 02).
export const AnalysisIcon = () => (
  <svg {...base}>
    <path d="M9.5 4.5a3 3 0 0 0-5 2.2 3 3 0 0 0-1 5.3 3.2 3.2 0 0 0 2.4 4.9A3 3 0 0 0 9.5 19.5z" />
    <path d="M9.5 4.5v15" />
    <path d="M13 7h3.5l1.5-2" />
    <path d="M13 12h5.5" />
    <path d="M13 17h3.5l1.5 2" />
    <circle cx="19" cy="4.5" r="1" />
    <circle cx="19.5" cy="12" r="1" />
    <circle cx="19" cy="19.5" r="1" />
  </svg>
);

export const AlgorithmsIcon = () => (
  <svg {...base}>
    <rect x="3.5" y="11" width="5.5" height="5.5" rx="1" />
    <rect x="9" y="11" width="5.5" height="5.5" rx="1" />
    <rect x="3.5" y="16.5" width="5.5" height="4" rx="1" />
    <rect x="13" y="3.5" width="6" height="6" rx="1" />
  </svg>
);

export const ApiIcon = () => (
  <svg {...base}>
    <path d="M4 8h15" />
    <path d="M15.5 4.5 19 8l-3.5 3.5" />
    <path d="M20 16H5" />
    <path d="M8.5 12.5 5 16l3.5 3.5" />
  </svg>
);

export const MicroIcon = () => (
  <svg {...base}>
    <path d="M6 19v-4" />
    <path d="M11 19v-8" />
    <path d="M16 19V7" />
    <path d="M21 19V4" />
  </svg>
);

export const ShieldIcon = () => (
  <svg {...base}>
    <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z" />
  </svg>
);

export const BoltIcon = () => (
  <svg {...base}>
    <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z" />
  </svg>
);

export const LockIcon = () => (
  <svg {...base}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
  </svg>
);

export const ServerIcon = () => (
  <svg {...base}>
    <rect x="4" y="3.5" width="16" height="5" rx="1.2" />
    <rect x="4" y="9.5" width="16" height="5" rx="1.2" />
    <rect x="4" y="15.5" width="16" height="5" rx="1.2" />
    <path d="M7.5 6h.01M7.5 12h.01M7.5 18h.01" />
  </svg>
);

export const ChartIcon = () => (
  <svg {...base}>
    <path d="M3.5 20.5h17" />
    <path d="m4.5 16 4.5-5 4 3 6-7" />
  </svg>
);

export const DevicesIcon = () => (
  <svg {...base}>
    <rect x="2.5" y="5" width="14" height="10" rx="1.5" />
    <path d="M1.5 18.5h16" />
    <rect x="18" y="9" width="4.5" height="10" rx="1" />
  </svg>
);

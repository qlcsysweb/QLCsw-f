// Animación de carga con tema de trading (barras de volumen pulsando) en vez
// de un texto "Cargando…" — se usa en todas las pantallas que antes
// mostraban solo esa palabra mientras llega la primera respuesta del API.
export function LoadingBars({ size = 'md' }) {
  return (
    <div className={`qlc-loading-bars qlc-loading-bars-${size}`} role="status" aria-label="Cargando">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export default function LoadingScreen({ compact = false }) {
  return (
    <div className={`qlc-loading-screen${compact ? ' qlc-loading-screen-compact' : ''}`}>
      <LoadingBars size="lg" />
    </div>
  );
}

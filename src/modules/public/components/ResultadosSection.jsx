import SectionMedia from './SectionMedia';

export default function ResultadosSection({ trackRecord, text, media = () => [] }) {
  const platformName = trackRecord?.platformName || 'Bitget';
  const ranking = trackRecord?.ranking || '#XXX';
  const profileLink = trackRecord?.profileLink;

  return (
    <section className="section" id="resultados">
      <div className="container section-intro">
        <div className="connection-copy">
          <h3 style={{ color: 'white' }}>{trackRecord?.title || 'Una referencia externa y verificable.'}</h3>
          <br />
          <p>
            {text(
              'resultados',
              'lead_1',
              `No te pedimos que confíes ciegamente en nosotros. Te damos acceso a una referencia externa para que puedas verificar nuestro track record directamente en ${platformName}.`
            )}
          </p>
          <br />
          <p>
            {text(
              'resultados',
              'lead_2',
              'Este perfil de trading está conectado mediante API a nuestra infraestructura tecnológica.'
            )}
          </p>
          <br />
          <p>{trackRecord?.description || 'De esta manera, el rendimiento que puedes verificar corresponde a una fuente pública e independiente de QLC.'}</p>

          {profileLink ? (
            <a href={profileLink} target="_blank" rel="noreferrer" className="btn primary" style={{ marginTop: 25, display: 'inline-block' }}>
              Comprobar perfil en {platformName} →
            </a>
          ) : (
            <span className="btn secondary" style={{ marginTop: 25, display: 'inline-block', opacity: 0.6, cursor: 'default' }}>
              Enlace de perfil próximamente
            </span>
          )}
        </div>

        <div className="hero-card" style={{ padding: 25 }}>
          <div className="hero-mini" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="mini">
              <b>{platformName}</b>
              <span>ELITE TRADER</span>
            </div>
            <div className="mini">
              <b>{ranking}</b>
              <span>CLASIFICACIÓN ACTUAL</span>
            </div>
            <div className="mini">
              <b>TRACK RECORD</b>
              <span>DATOS PÚBLICOS</span>
            </div>
            <div className="mini">
              <b>API</b>
              <span>EJECUCIÓN ALGORÍTMICA QLC</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <SectionMedia items={media('resultados')} />
      </div>
    </section>
  );
}

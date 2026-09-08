import SectionMedia from './SectionMedia';

export default function ModelosSection({ models, text, media = () => [] }) {
  return (
    <section className="section alt" id="modelos">
      <div className="container">
        <div className="kicker">MODELOS DE PARTICIPACIÓN</div>
        <h2>
          Tres formas.
          <br />
          <span className="gradient">Una misma infraestructura.</span>
        </h2>
        <p className="sub">QLC contempla diferentes modalidades para distintos perfiles de participación.</p>

        <div className="models">
          {models.map((m) => (
            <div className={`model-card${m.key === 'PERFORMANCE' ? ' featured' : ''}`} key={m.id}>
              <div className="model-no">
                {String(m.displayOrder).padStart(2, '0')} · {m.key}
              </div>
              <h3>{m.tagline || m.name}</h3>
              <p>{m.description}</p>
              {m.conditions && (
                <p>
                  <strong>{m.conditions}</strong>
                </p>
              )}
              {m.objective && (
                <p>
                  Objetivo: <strong>{m.objective}</strong>
                  {m.period ? ` (${m.period})` : ''}
                </p>
              )}
              <div className="model-tag">{m.name}</div>
            </div>
          ))}
        </div>

        <p className="note">
          {text(
            'modelos',
            'note',
            'Las referencias de rendimiento son objetivos o parámetros del modelo y no constituyen una garantía de resultados futuros.'
          )}
        </p>

        <SectionMedia items={media('modelos')} />
      </div>
    </section>
  );
}

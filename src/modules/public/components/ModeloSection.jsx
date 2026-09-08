import SectionMedia from './SectionMedia';

const FEATURES = [
  { icon: '01', title: 'Trading cuantitativo', text: 'Una metodología sistemática aplicada a la ejecución de la estrategia.' },
  { icon: '02', title: 'Algoritmos', text: 'Reglas programadas para transformar la estrategia en decisiones operativas.' },
  { icon: '03', title: 'Ejecución automatizada', text: 'La operación se ejecuta directamente en la cuenta conectada.' },
  { icon: '04', title: 'API', text: 'Conexión autorizada entre la cuenta del cliente y la infraestructura QLC.' },
  { icon: '05', title: 'Microposiciones', text: 'Una arquitectura diseñada para operar con posiciones de tamaño reducido.' },
];

export default function ModeloSection({ text, media = () => [] }) {
  return (
    <section className="section alt" id="modelo">
      <div className="container">
        <div className="section-intro">
          <div>
            <div className="kicker">{text('modelo', 'kicker', 'EL CONCEPTO')}</div>
            <h2>
              {text('modelo', 'h2_line1', 'Copytrading institucional.')}
              <br />
              <span className="gradient">{text('modelo', 'h2_line2', 'Sin salir de tu cuenta.')}</span>
            </h2>
          </div>
          <div className="clean-card">
            <p>
              {text(
                'modelo',
                'intro',
                'La estrategia de QLC se ejecuta directamente sobre la cuenta del cliente mediante una conexión API. El capital permanece en su propia cuenta de exchange.'
              )}
            </p>
          </div>
        </div>

        <div className="feature-list">
          {FEATURES.map((f) => (
            <div className="feature-item" key={f.icon}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>

        <SectionMedia items={media('modelo')} />
      </div>
    </section>
  );
}

import SectionMedia from './SectionMedia';

export default function MicroposicionesSection({ text, media = () => [] }) {
  return (
    <section className="section" id="microposiciones">
      <div className="container">
        <div className="kicker">MICROPOSICIONES</div>
        <h2>
          Una nueva escala para
          <br />
          <span className="gradient">el Copytrading Institucional.</span>
        </h2>
        <div className="micro-hero">
          <div>
            <div className="kicker">DISEÑADO PARA INVERSORES INDIVIDUALES</div>
            <h3>
              El tamaño cambia.
              <br />
              La infraestructura no.
            </h3>
            <p>
              {text(
                'microposiciones',
                'lead',
                'QLC adapta una arquitectura de copytrading institucional a cuentas individuales mediante una metodología basada en microposiciones y ejecución sistemática.'
              )}
            </p>
          </div>
          <div className="range">{text('microposiciones', 'range', '20–400 USDT')}</div>
        </div>

        <SectionMedia items={media('microposiciones')} />
      </div>
    </section>
  );
}

import SectionMedia from './SectionMedia';

const PILLARS = [
  { icon: '◈', title: 'ESTRATEGIA', text: 'QLC desarrolla y ejecuta una estrategia de trading cuantitativo.' },
  { icon: '◌', title: 'ALGORITMOS', text: 'La lógica operativa se convierte en reglas sistemáticas de ejecución.' },
  { icon: '↔', title: 'API', text: 'La infraestructura se comunica directamente con la cuenta autorizada.' },
  { icon: '▦', title: 'MICROPOSICIONES', text: 'La ejecución está diseñada para trabajar con posiciones de tamaño reducido.' },
];

export default function TecnologiaSection({ text, media = () => [] }) {
  return (
    <section className="section alt" id="tecnologia">
      <div className="container">
        <div className="kicker">{text('tecnologia', 'kicker', 'INFRAESTRUCTURA')}</div>
        <h2>
          {text('tecnologia', 'h2_line1', 'Una arquitectura.')}
          <br />
          <span className="gradient">{text('tecnologia', 'h2_line2', 'Una experiencia sencilla.')}</span>
        </h2>
        <p className="sub">
          {text(
            'tecnologia',
            'sub',
            'La complejidad tecnológica pertenece a QLC. Para el cliente, el producto se resume en una conexión, una estrategia y una ejecución directa en su cuenta.'
          )}
        </p>

        <div className="pillars">
          {PILLARS.map((p) => (
            <div className="pillar" key={p.title}>
              <div className="icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>

        <SectionMedia items={media('tecnologia')} />
      </div>
    </section>
  );
}

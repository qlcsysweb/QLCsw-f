import SectionMedia from './SectionMedia';

const CARDS = [
  { title: 'CAPITAL EN TU CUENTA', text: 'El capital permanece en la cuenta del cliente en el exchange.' },
  { title: 'CONEXIÓN API', text: 'La operación se realiza mediante una conexión autorizada con permisos limitados.' },
  { title: 'SIN CUSTODIA', text: 'QLC no necesita recibir ni trasladar los fondos del cliente para ejecutar la estrategia.' },
];

export default function SeguridadSection({ text, media = () => [] }) {
  return (
    <section className="section" id="seguridad">
      <div className="container">
        <div className="kicker">{text('seguridad', 'kicker', 'CONTROL')}</div>
        <h2>
          {text('seguridad', 'h2_line1', 'Tu cuenta.')}
          <br />
          <span className="gradient">{text('seguridad', 'h2_line2', 'Tu capital. Tu control.')}</span>
        </h2>
        <div className="security-grid">
          {CARDS.map((c) => (
            <div className="security-card" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
          ))}
        </div>

        <SectionMedia items={media('seguridad')} />
      </div>
    </section>
  );
}

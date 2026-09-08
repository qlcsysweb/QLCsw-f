import SectionMedia from './SectionMedia';

const FLOW = [
  { label: '01 · Cliente', text: 'Abre su cuenta en el exchange.' },
  { label: '02 · API', text: 'Autoriza la conexión con QLC.' },
  { label: '03 · QLC', text: 'Ejecuta la estrategia cuantitativa.' },
  { label: '04 · Operación', text: 'Las posiciones se ejecutan en su cuenta.' },
  { label: '05 · Resultado', text: 'El resultado permanece en la cuenta.' },
];

export default function ComoFuncionaSection({ text, media = () => [] }) {
  return (
    <section className="section" id="como-funciona">
      <div className="container">
        <div className="kicker">{text('como_funciona', 'kicker', 'CÓMO FUNCIONA')}</div>
        <h2>
          {text('como_funciona', 'h2_line1', 'Tu cuenta.')}
          <br />
          <span className="gradient">{text('como_funciona', 'h2_line2', 'Nuestra infraestructura.')}</span>
        </h2>
        <p className="sub">
          {text(
            'como_funciona',
            'sub',
            'El flujo es directo: el cliente mantiene su cuenta en el exchange, autoriza una conexión API y QLC ejecuta la estrategia directamente sobre ella.'
          )}
        </p>

        <div className="connection">
          <div className="connection-copy">
            <div className="kicker">CONEXIÓN DIRECTA</div>
            <h3>{text('como_funciona', 'connection_title', 'El capital permanece donde pertenece.')}</h3>
            <p>
              {text(
                'como_funciona',
                'connection_text',
                'QLC no necesita recibir ni trasladar el capital del cliente para ejecutar la estrategia. La conexión API permite la operación sobre la cuenta autorizada, con permisos limitados y sin autorización para retirar fondos.'
              )}
            </p>
            <div className="statusbar">
              <span className="status ok">CUENTA DEL CLIENTE</span>
              <span className="status ok">API AUTORIZADA</span>
              <span className="status ok">SIN RETIROS</span>
            </div>
          </div>
          <div className="flow-line">
            {FLOW.map((f) => (
              <div className="flow-node" key={f.label}>
                <b>{f.label}</b>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <SectionMedia items={media('como_funciona')} />
      </div>
    </section>
  );
}

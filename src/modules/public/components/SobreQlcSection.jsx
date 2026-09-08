import SectionMedia from './SectionMedia';

export default function SobreQlcSection({ text, media = () => [] }) {
  return (
    <section id="sobre-qlc" className="section alt">
      <div className="container">
        <div className="kicker">Nuestra Naturaleza</div>
        <h2>Sobre QLC</h2>

        <div className="clean-card" style={{ marginTop: 35 }}>
          <h3 style={{ fontSize: 18, marginBottom: 25, color: '#fff', fontWeight: 600 }}>
            {text(
              'sobre_qlc',
              'intro',
              'QLC es una empresa enfocada en infraestructura tecnológica para la ejecución de estrategias algorítmicas y cuantitativas aplicadas a mercados de activos digitales.'
            )}
          </h3>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 25 }}>
            <strong style={{ color: 'var(--qlc-blue2)', display: 'block', fontSize: 20, marginBottom: 15 }}>
              Somos una infraestructura tecnológica para la ejecución de estrategias de trading.
            </strong>

            <p style={{ color: 'var(--qlc-muted)', fontSize: 15, marginBottom: 15, lineHeight: 1.6 }}>
              {text(
                'sobre_qlc',
                'body_1',
                'QLC desarrolla y opera infraestructura tecnológica especializada para conectar, coordinar y ejecutar estrategias de trading sobre cuentas individuales de sus usuarios.'
              )}
            </p>

            <p style={{ color: 'var(--qlc-muted)', fontSize: 15, marginBottom: 15, lineHeight: 1.6 }}>
              {text(
                'sobre_qlc',
                'body_2',
                'Nuestra función se centra en proporcionar la tecnología, los sistemas y la infraestructura necesarios para una ejecución estructurada y coordinada.'
              )}
            </p>

            <p style={{ color: '#c7ccd2', fontSize: 15, lineHeight: 1.6, fontWeight: 600 }}>
              {text(
                'sobre_qlc',
                'body_3',
                'QLC no es un banco, no es una institución financiera y no custodia directamente los fondos de sus usuarios. Los fondos permanecen en la cuenta del propio cliente en el exchange correspondiente, bajo su titularidad y control.'
              )}
            </p>
          </div>
        </div>

        <SectionMedia items={media('sobre_qlc')} />
      </div>
    </section>
  );
}

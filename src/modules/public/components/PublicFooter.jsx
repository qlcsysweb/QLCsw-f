import SectionMedia from './SectionMedia';

export default function PublicFooter({ text, media = () => [] }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>QUANTUM LIQUIDITY CAPITAL</h4>
          <div>Institutional Trading Infrastructure</div>
          <div style={{ marginTop: 14, color: '#aab4bd' }}>
            {text('footer', 'tagline', 'Trading institucional. Accesible desde 20 USDT.')}
          </div>
        </div>
        <div>
          <h4>Navegación</h4>
          <div>
            <a href="#modelo">Modelo</a> · <a href="#como-funciona">Cómo funciona</a> ·{' '}
            <a href="#tecnologia">Tecnología</a>
          </div>
          <div>
            <a href="#modelos">Modelos</a> · <a href="#resultados">Resultados</a> ·{' '}
            <a href="#seguridad">Seguridad</a> · <a href="#sobre-qlc">SOBRE QLC</a>
          </div>
        </div>
        <div>
          <h4>Accesos</h4>
          <div>Clientes · Administradores · Registro</div>
          <div style={{ marginTop: 8 }}>QLC.NET</div>
        </div>
      </div>
      <div className="container">
        <SectionMedia items={media('footer')} />
      </div>
      <div className="container disclaimer">
        {text(
          'footer',
          'disclaimer',
          'Los activos digitales y el trading apalancado implican riesgos significativos. Los resultados históricos no garantizan resultados futuros. La información presentada es de carácter informativo y está sujeta a los términos y condiciones aplicables.'
        )}
      </div>
    </footer>
  );
}

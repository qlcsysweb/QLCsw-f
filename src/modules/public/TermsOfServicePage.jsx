import PublicNav from './components/PublicNav';
import PublicFooter from './components/PublicFooter';
import usePublicData from './usePublicData';

// Página de Términos y Condiciones — requerida junto con la Política de
// Privacidad en la pantalla de consentimiento OAuth de Google. Borrador base;
// revísala con un abogado antes de darla por definitiva y completa los datos
// marcados como [PENDIENTE].
export default function TermsOfServicePage() {
  const { text, media } = usePublicData();

  return (
    <div className="qlc-public">
      <PublicNav />
      <main>
        <section className="section">
          <div className="container legal-content">
            <div className="kicker">LEGAL</div>
            <h2>Términos y Condiciones</h2>
            <p className="sub">Última actualización: [PENDIENTE — fecha de publicación].</p>

            <p>
              Estos Términos y Condiciones regulan el uso de la plataforma de{' '}
              <strong>Quantum Liquidity Capital (&quot;QLC&quot;)</strong> disponible en{' '}
              <strong>qlc.net</strong> (el &quot;Servicio&quot;). Al registrarte o usar el
              Servicio aceptas estos términos.
            </p>

            <h3>1. Descripción del servicio</h3>
            <p>
              QLC ofrece un panel para la gestión y seguimiento de operaciones de
              copytrading institucional, incluyendo visualización de estados de
              cuenta, subcuentas, documentos y reporte de pagos.
            </p>

            <h3>2. Elegibilidad</h3>
            <p>
              Para usar el Servicio debes ser mayor de edad y tener capacidad legal
              para contratar, y completar el proceso de verificación de identidad
              (KYC) que QLC solicite.
            </p>

            <h3>3. Tu cuenta</h3>
            <p>
              Eres responsable de mantener la confidencialidad de tus credenciales de
              acceso y de la veracidad de los datos que proporciones. Debes notificar
              a QLC de inmediato ante cualquier uso no autorizado de tu cuenta.
            </p>

            <h3>4. Riesgos</h3>
            <p>
              {text(
                'footer',
                'disclaimer',
                'Los activos digitales y el trading apalancado implican riesgos significativos. Los resultados históricos no garantizan resultados futuros. La información presentada es de carácter informativo y está sujeta a los términos y condiciones aplicables.'
              )}
            </p>

            <h3>5. Pagos y comisiones</h3>
            <p>
              Los pagos se gestionan mediante reporte de transferencia en USDT por
              parte del cliente y confirmación manual por parte de QLC, dentro de los
              plazos indicados en tu panel. QLC nunca solicita datos bancarios
              completos ni contraseñas de billeteras.
            </p>

            <h3>6. Comunicaciones</h3>
            <p>
              Al usar el Servicio aceptas recibir notificaciones operativas (estados
              de cuenta, pagos, soporte) por correo electrónico y dentro de tu panel
              de QLC.
            </p>

            <h3>7. Propiedad intelectual</h3>
            <p>
              La marca, el contenido y la tecnología del Servicio son propiedad de
              QLC. No está permitido copiar, redistribuir o usar estos elementos sin
              autorización previa.
            </p>

            <h3>8. Conducta prohibida</h3>
            <p>
              No está permitido usar el Servicio con fines fraudulentos, suplantar la
              identidad de terceros, ni intentar vulnerar su seguridad.
            </p>

            <h3>9. Suspensión o cierre de cuenta</h3>
            <p>
              QLC puede suspender o cerrar una cuenta ante incumplimiento de estos
              términos, sospecha de fraude o por requerimiento legal.
            </p>

            <h3>10. Limitación de responsabilidad</h3>
            <p>
              QLC no garantiza resultados de inversión. El uso del Servicio es bajo tu
              propio riesgo, en los términos descritos en la sección de Riesgos.
            </p>

            <h3>11. Modificaciones</h3>
            <p>
              Podemos actualizar estos términos ocasionalmente. Publicaremos cualquier
              cambio en esta misma página con su fecha de actualización.
            </p>

            <h3>12. Ley aplicable</h3>
            <p>[PENDIENTE — jurisdicción y ley aplicable].</p>

            <h3>13. Contacto</h3>
            <p>[PENDIENTE — correo de contacto de soporte/legal de QLC].</p>
          </div>
        </section>
      </main>
      <PublicFooter text={text} media={media} />
    </div>
  );
}

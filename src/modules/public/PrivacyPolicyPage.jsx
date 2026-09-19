import PublicNav from './components/PublicNav';
import PublicFooter from './components/PublicFooter';
import usePublicData from './usePublicData';

// Página de Política de Privacidad — requerida por Google (pantalla de
// consentimiento OAuth, sección "Dominio de la app") para poder publicar la
// aplicación que envía correo (Gmail API) y almacena documentos (Drive API).
// Es un borrador base con la estructura habitual de una política de
// privacidad; revísala con un abogado antes de darla por definitiva y
// completa los datos marcados como [PENDIENTE].
export default function PrivacyPolicyPage() {
  const { text, media } = usePublicData();

  return (
    <div className="qlc-public">
      <PublicNav />
      <main>
        <section className="section">
          <div className="container legal-content">
            <div className="kicker">LEGAL</div>
            <h2>Política de Privacidad</h2>
            <p className="sub">Última actualización: [PENDIENTE — fecha de publicación].</p>

            <p>
              Esta Política de Privacidad describe cómo <strong>Quantum Liquidity Capital
              (&quot;QLC&quot;)</strong> recopila, usa, almacena y protege los datos personales
              de quienes se registran o usan la plataforma disponible en{' '}
              <strong>qlc.net</strong> (el &quot;Servicio&quot;).
            </p>

            <h3>1. Responsable del tratamiento</h3>
            <p>
              Quantum Liquidity Capital (QLC) es responsable de los datos personales
              tratados a través del Servicio. Para cualquier consulta relacionada con
              esta política puedes escribir a [PENDIENTE — correo de contacto de
              soporte/privacidad].
            </p>

            <h3>2. Datos que recopilamos</h3>
            <ul>
              <li><strong>Datos de identificación:</strong> nombre, apellido, documento de identidad.</li>
              <li><strong>Datos de contacto:</strong> correo electrónico, teléfono.</li>
              <li><strong>Datos de la cuenta:</strong> credenciales de acceso, subcuentas/API asociadas, historial de operaciones y estados de cuenta.</li>
              <li><strong>Documentos:</strong> contratos, comprobantes de pago y demás documentos que subas o que QLC genere para tu cuenta.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo y navegador, cookies estrictamente necesarias para el funcionamiento del Servicio.</li>
            </ul>

            <h3>3. Para qué usamos tus datos</h3>
            <ul>
              <li>Verificar tu identidad y cumplir procesos de conocimiento del cliente (KYC).</li>
              <li>Crear y administrar tu cuenta, subcuentas y estados de cuenta.</li>
              <li>Procesar y confirmar reportes de pago.</li>
              <li>Enviarte notificaciones operativas sobre tu cuenta (estados de cuenta, pagos, soporte).</li>
              <li>Brindarte soporte y responder tus solicitudes.</li>
              <li>Cumplir obligaciones legales, contables y regulatorias aplicables.</li>
            </ul>

            <h3>4. Con quién compartimos tus datos</h3>
            <p>
              QLC no vende ni alquila datos personales a terceros. Para operar el
              Servicio usamos proveedores de infraestructura que actúan únicamente
              como encargados del tratamiento, bajo instrucciones de QLC:
            </p>
            <ul>
              <li><strong>Google Drive</strong> — almacenamiento de documentos (contratos, comprobantes) en una carpeta corporativa controlada exclusivamente por QLC, mediante una cuenta de servicio técnica. QLC nunca solicita ni accede a tu cuenta personal de Google.</li>
              <li><strong>Gmail (Google)</strong> — envío de notificaciones automáticas desde la cuenta de correo corporativa de QLC. No se lee, procesa ni comparte el contenido de tu propia bandeja de Gmail.</li>
              <li><strong>Proveedores de base de datos y hosting</strong> (Neon, Render, Vercel) — alojamiento técnico de la plataforma y su base de datos.</li>
              <li><strong>Cloudinary</strong> — alojamiento de imágenes públicas del sitio web (no de tus documentos personales).</li>
            </ul>

            <h3>5. Conservación de los datos</h3>
            <p>
              Conservamos tus datos mientras tu cuenta permanezca activa y durante el
              plazo adicional que exijan las obligaciones legales, contables o
              regulatorias aplicables.
            </p>

            <h3>6. Tus derechos</h3>
            <p>
              Puedes solicitar acceso, rectificación o eliminación de tus datos
              personales, así como oponerte a determinados tratamientos, escribiendo a
              [PENDIENTE — correo de contacto de soporte/privacidad].
            </p>

            <h3>7. Seguridad</h3>
            <p>
              Las contraseñas y credenciales sensibles se almacenan cifradas. El
              acceso a la información está restringido por rol (administrador /
              cliente). QLC nunca almacena datos bancarios completos: los pagos se
              gestionan mediante reporte y confirmación manual de transferencias en
              USDT.
            </p>

            <h3>8. Menores de edad</h3>
            <p>El Servicio no está dirigido a menores de 18 años.</p>

            <h3>9. Cambios a esta política</h3>
            <p>
              Podemos actualizar esta política ocasionalmente. Publicaremos cualquier
              cambio en esta misma página con su fecha de actualización.
            </p>

            <h3>10. Contacto</h3>
            <p>[PENDIENTE — correo de contacto de soporte/privacidad de QLC].</p>
          </div>
        </section>
      </main>
      <PublicFooter text={text} media={media} />
    </div>
  );
}

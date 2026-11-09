import { RedeemBox } from '../../features/gifts/ClientCommerce.jsx';
import { tr } from '../../i18n/tr.js';

export default function RedeemPage() {
  const code = new URLSearchParams(window.location.search).get('codigo') || '';
  return (
    <section className="auth-card redeem-page">
      <span className="section-kicker">QLC · Gift Access</span>
      <h1>{tr('Activa tu regalo')}</h1>
      <p className="muted">{tr('Alguien ha querido regalarte acceso a las herramientas y formación financiera de QLC. Escribe tu código para ver qué recibiste y activarlo sin ningún pago.')}</p>
      <RedeemBox initialCode={code} />
    </section>
  );
}

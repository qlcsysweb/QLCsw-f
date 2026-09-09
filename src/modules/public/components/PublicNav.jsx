import { Link } from 'react-router-dom';
import QlcLogo from '../../../components/QlcLogo';

const LINKS = [
  { href: '#modelo', label: 'Modelo' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#tecnologia', label: 'Tecnología' },
  { href: '#microposiciones', label: 'Microposiciones' },
  { href: '#modelos', label: 'Modelos' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#seguridad', label: 'Seguridad' },
  { href: '#sobre-qlc', label: 'Sobre QLC' },
  { href: '#faq', label: 'FAQ' },
];

export default function PublicNav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <div className="brand-area">
          <a className="brand" href="#inicio">
            <QlcLogo className="brand-mark" alt="QLC" />
            <span className="brand-name">QLC</span>
          </a>
        </div>
        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="header-access">
          <a className="access-btn" href="#contacto">
            Registro
          </a>
          <Link className="access-btn" to="/login">
            Acceso a Clientes
          </Link>
          <Link className="access-btn access-primary" to="/login">
            Acceso a Administradores
          </Link>
        </div>
      </div>
    </nav>
  );
}

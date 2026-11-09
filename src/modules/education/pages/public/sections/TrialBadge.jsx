import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nContext.jsx';

const COPY = {
  es: { tag: 'Prueba gratis', title: 'Tu primer mes es GRATIS', text: 'Al registrarte usas sin costo las herramientas del software educativo durante 30 días.', cta: 'Crear mi cuenta gratis' },
  en: { tag: 'Free trial', title: 'Your first month is FREE', text: 'When you sign up, you can use the educational software tools at no cost for 30 days.', cta: 'Create my free account' },
  pt: { tag: 'Teste grátis', title: 'Seu primeiro mês é GRÁTIS', text: 'Ao se cadastrar, você usa sem custo as ferramentas do software educacional durante 30 dias.', cta: 'Criar minha conta grátis' },
};

// Aviso llamativo del primer mes gratis que lleva al registro de cliente.
export function TrialBadge({ compact = false }) {
  const { lang } = useI18n();
  const c = COPY[lang] || COPY.es;
  return (
    <Link to="/registro" className={`trial-badge ${compact ? 'is-compact' : ''}`}>
      <span className="trial-badge-tag">🎁 {c.tag}</span>
      <span className="trial-badge-body">
        <b>{c.title}</b>
        {!compact && <small>{c.text}</small>}
      </span>
      <span className="trial-badge-cta">{c.cta}</span>
    </Link>
  );
}

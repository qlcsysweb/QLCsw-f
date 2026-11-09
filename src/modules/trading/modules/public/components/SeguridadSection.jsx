import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function SeguridadSection({ text, media = () => [] }) {
  const { t } = useLanguage();

  const CARDS = [
    { title: t('seguridadSection.card1Title'), text: t('seguridadSection.card1Text') },
    { title: t('seguridadSection.card2Title'), text: t('seguridadSection.card2Text') },
    { title: t('seguridadSection.card3Title'), text: t('seguridadSection.card3Text') },
  ];

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

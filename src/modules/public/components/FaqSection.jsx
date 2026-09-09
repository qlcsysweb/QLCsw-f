import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function FaqSection({ faqs, media = () => [] }) {
  const { t } = useLanguage();
  return (
    <section className="section alt" id="faq">
      <div className="container">
        <div className="kicker">{t('faqSection.kicker')}</div>
        <h2>{t('faqSection.title')}</h2>
        <div className="faq-clean">
          {faqs.map((f) => (
            <details key={f.id}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>

        <SectionMedia items={media('faq')} />
      </div>
    </section>
  );
}

import { useLanguage } from '../../../i18n/LanguageContext';

// FAQ AFFILIATE PROGRAM — preguntas de la sección 8 de la "Guía QLC
// Affiliate Program" entregada por el cliente. Mismo estilo que la FAQ general.
const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

export default function FaqAffiliateSection() {
  const { t } = useLanguage();
  return (
    <section className="section alt" id="faq-affiliate-program">
      <div className="container">
        <div className="kicker">{t('faqAffiliateSection.kicker')}</div>
        <h2>{t('faqAffiliateSection.title')}</h2>
        <div className="faq-clean">
          {QUESTIONS.map((k) => (
            <details key={k}>
              <summary>{t(`faqAffiliateSection.${k}`)}</summary>
              <p style={{ whiteSpace: 'pre-line' }}>{t(`faqAffiliateSection.${k.replace('q', 'a')}`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

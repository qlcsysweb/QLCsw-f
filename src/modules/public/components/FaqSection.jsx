import SectionMedia from './SectionMedia';

export default function FaqSection({ faqs, media = () => [] }) {
  return (
    <section className="section alt" id="faq">
      <div className="container">
        <div className="kicker">PREGUNTAS FRECUENTES</div>
        <h2>Lo esencial.</h2>
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

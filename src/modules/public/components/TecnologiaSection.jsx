import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function TecnologiaSection({ text, media = () => [] }) {
  const { t } = useLanguage();

  const PILLARS = [
    { icon: '◈', title: t('tecnologiaSection.pillarStrategyTitle'), text: t('tecnologiaSection.pillarStrategyText') },
    { icon: '◌', title: t('tecnologiaSection.pillarAlgorithmsTitle'), text: t('tecnologiaSection.pillarAlgorithmsText') },
    { icon: '↔', title: t('tecnologiaSection.pillarApiTitle'), text: t('tecnologiaSection.pillarApiText') },
    { icon: '▦', title: t('tecnologiaSection.pillarMicroTitle'), text: t('tecnologiaSection.pillarMicroText') },
  ];

  return (
    <section className="section alt" id="tecnologia">
      <div className="container">
        <div className="kicker">{text('tecnologia', 'kicker', 'INFRAESTRUCTURA')}</div>
        <h2>
          {text('tecnologia', 'h2_line1', 'Una arquitectura.')}
          <br />
          <span className="gradient">{text('tecnologia', 'h2_line2', 'Una experiencia sencilla.')}</span>
        </h2>
        <p className="sub">
          {text(
            'tecnologia',
            'sub',
            'La complejidad tecnológica pertenece a QLC. Para el cliente, el producto se resume en una conexión, una estrategia y una ejecución directa en su cuenta.'
          )}
        </p>

        <div className="pillars">
          {PILLARS.map((p) => (
            <div className="pillar" key={p.title}>
              <div className="icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>

        <SectionMedia items={media('tecnologia')} />
      </div>
    </section>
  );
}

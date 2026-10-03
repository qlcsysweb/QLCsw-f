import { useState } from 'react';
import SectionMedia from './SectionMedia';
import TecnologiaIntroModal from './TecnologiaIntroModal';
import { StrategyIcon, AnalysisIcon, AlgorithmsIcon, ApiIcon, MicroIcon } from './TechIcons';
import { useLanguage } from '../../../i18n/LanguageContext';

// Las 5 etapas de la tecnología QLC. La etapa 02 (título y texto) es editable
// desde el CMS (Contenido → Tecnología); si no se edita, usa el texto base.
export function useTechStages(text) {
  const { t } = useLanguage();
  return [
    { Icon: StrategyIcon, title: t('tecnologiaSection.stage1Title'), text: t('tecnologiaSection.stage1Text') },
    {
      Icon: AnalysisIcon,
      title: text('tecnologia', 'stage2_title', '') || t('tecnologiaSection.stage2Title'),
      text: text('tecnologia', 'stage2_text', '') || t('tecnologiaSection.stage2Text'),
    },
    { Icon: AlgorithmsIcon, title: t('tecnologiaSection.stage3Title'), text: t('tecnologiaSection.stage3Text') },
    { Icon: ApiIcon, title: t('tecnologiaSection.stage4Title'), text: t('tecnologiaSection.stage4Text') },
    { Icon: MicroIcon, title: t('tecnologiaSection.stage5Title'), text: t('tecnologiaSection.stage5Text') },
  ];
}

// withIntro: al ENTRAR a la sección (página pública) se muestra primero el
// modal "De los datos a las oportunidades". En la vista previa del CMS no.
export default function TecnologiaSection({ text, media = () => [], withIntro = false }) {
  const { t } = useLanguage();
  const [showIntro, setShowIntro] = useState(withIntro);
  const stages = useTechStages(text);

  return (
    <section className="section alt" id="tecnologia">
      {showIntro && <TecnologiaIntroModal text={text} stages={stages} onClose={() => setShowIntro(false)} />}
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

        <ol className="tech-stages">
          {stages.map(({ Icon, title, text: body }, i) => (
            <li className="tech-stage" key={i}>
              <div className="tech-stage-icon">
                <Icon />
              </div>
              <div className="tech-stage-body">
                <div className="tech-stage-kicker">
                  {t('tecnologiaSection.stage')} {String(i + 1).padStart(2, '0')}
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <SectionMedia items={media('tecnologia')} />
      </div>
    </section>
  );
}

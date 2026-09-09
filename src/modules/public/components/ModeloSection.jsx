import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function ModeloSection({ text, media = () => [] }) {
  const { t } = useLanguage();

  const FEATURES = [
    { icon: '01', title: t('modeloSection.feature01Title'), text: t('modeloSection.feature01Text') },
    { icon: '02', title: t('modeloSection.feature02Title'), text: t('modeloSection.feature02Text') },
    { icon: '03', title: t('modeloSection.feature03Title'), text: t('modeloSection.feature03Text') },
    { icon: '04', title: t('modeloSection.feature04Title'), text: t('modeloSection.feature04Text') },
    { icon: '05', title: t('modeloSection.feature05Title'), text: t('modeloSection.feature05Text') },
  ];

  return (
    <section className="section alt" id="modelo">
      <div className="container">
        <div className="section-intro">
          <div>
            <div className="kicker">{text('modelo', 'kicker', 'EL CONCEPTO')}</div>
            <h2>
              {text('modelo', 'h2_line1', 'Copytrading institucional.')}
              <br />
              <span className="gradient">{text('modelo', 'h2_line2', 'Sin salir de tu cuenta.')}</span>
            </h2>
          </div>
          <div className="clean-card">
            <p>
              {text(
                'modelo',
                'intro',
                'La estrategia de QLC se ejecuta directamente sobre la cuenta del cliente mediante una conexión API. El capital permanece en su propia cuenta de exchange.'
              )}
            </p>
          </div>
        </div>

        <div className="feature-list">
          {FEATURES.map((f) => (
            <div className="feature-item" key={f.icon}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>

        <SectionMedia items={media('modelo')} />
      </div>
    </section>
  );
}

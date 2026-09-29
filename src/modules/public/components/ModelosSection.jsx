import SectionMedia from './SectionMedia';
import ParticipationModelSummary from '../../../components/ParticipationModelSummary';
import { useLanguage } from '../../../i18n/LanguageContext';

// MODELO ÚNICO DE PARTICIPACIÓN — QLC 70% / Cliente 30%. Sin selector ni
// comparación: se presenta directamente el único modelo disponible (textos
// administrables desde Admin → Modelo de participación).
export default function ModelosSection({ models, text, media = () => [] }) {
  const { t } = useLanguage();
  const model = models[0] || null;
  return (
    <section className="section alt" id="modelos">
      <div className="container">
        <div className="kicker">{t('modelosSection.kicker')}</div>
        <h2>
          {t('modelosSection.titleLine1')}
          <br />
          <span className="gradient">{t('modelosSection.titleLine2')}</span>
        </h2>
        <p className="sub">{t('modelosSection.sub')}</p>

        <div className="model-single">
          <div className="model-card featured">
            <div className="model-no">{t('participationModel.title')}</div>
            {model?.tagline && <h3>{model.tagline}</h3>}
            {model?.description && <p>{model.description}</p>}
            {model?.detailsContent && <p className="model-details">{model.detailsContent}</p>}
          </div>
          <div className="model-card model-split-card">
            <ParticipationModelSummary model={model} />
          </div>
        </div>

        <p className="note">
          {text(
            'modelos',
            'note',
            'Las referencias de rendimiento son objetivos o parámetros del modelo y no constituyen una garantía de resultados futuros.'
          )}
        </p>

        <SectionMedia items={media('modelos')} />
      </div>
    </section>
  );
}

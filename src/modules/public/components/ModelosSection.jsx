import SectionMedia from './SectionMedia';
import ParticipationModelSummary, { ParticipationModelDetails, fillSplit } from '../../../components/ParticipationModelSummary';
import { useLanguage } from '../../../i18n/LanguageContext';

// MODELO ÚNICO DE PARTICIPACIÓN. Sin selector ni comparación: encabezado con
// el reparto grande (Model.percentage, hoy 50/50) y el detalle en tarjetas
// (cómo funciona + ejemplo calculado, características y "¿para quién?").
// Tagline/descripción se administran desde Admin → Modelo de participación.
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
          <span className="gradient">{fillSplit(t('modelosSection.titleLine2'), model)}</span>
        </h2>

        <div className="model-head">
          <div className="model-head-copy">
            {model?.tagline && <h3>{model.tagline}</h3>}
            {model?.description && <p>{model.description}</p>}
          </div>
          <ParticipationModelSummary model={model} showTitle={false} className="model-head-split" />
        </div>

        <ParticipationModelDetails model={model} />

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

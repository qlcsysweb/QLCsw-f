import { useLanguage } from '../i18n/LanguageContext';

// Porcentajes del modelo único a partir de Model.percentage ("70/30").
// Si el dato no viene (p. ej. mientras carga), se usa el reparto oficial.
export function participationSplit(model) {
  const match = String(model?.percentage || '').match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  return match ? { qlc: match[1], client: match[2] } : { qlc: '70', client: '30' };
}

// Texto corto para tablas/listas: "QLC 70% · Cliente 30%".
export function formatParticipationSplit(model, t) {
  const { qlc, client } = participationSplit(model);
  return `QLC ${qlc}% · ${t('participationModel.client')} ${client}%`;
}

/*
 * MODELO ÚNICO DE PARTICIPACIÓN — ya no hay selector ni otros modelos:
 * se muestra directamente "Modelo de participación · QLC: 70% · Cliente: 30%".
 */
export default function ParticipationModelSummary({ model, showTitle = true, className = '' }) {
  const { t } = useLanguage();
  const { qlc, client } = participationSplit(model);
  return (
    <div className={`qlc-pm ${className}`}>
      {showTitle && <div className="qlc-pm-title">{t('participationModel.title')}</div>}
      <dl className="qlc-pm-split">
        <div>
          <dt>QLC</dt>
          <dd>{qlc}%</dd>
        </div>
        <div>
          <dt>{t('participationModel.client')}</dt>
          <dd>{client}%</dd>
        </div>
      </dl>
    </div>
  );
}

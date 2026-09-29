import { useLanguage } from '../i18n/LanguageContext';

// Porcentajes del modelo único a partir de Model.percentage ("50/50").
// Si el dato no viene (p. ej. mientras carga), se usa el reparto oficial.
export function participationSplit(model) {
  const match = String(model?.percentage || '').match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  return match ? { qlc: match[1], client: match[2] } : { qlc: '50', client: '50' };
}

// Texto corto para tablas/listas: "QLC 50% · Cliente 50%".
export function formatParticipationSplit(model, t) {
  const { qlc, client } = participationSplit(model);
  return `QLC ${qlc}% · ${t('participationModel.client')} ${client}%`;
}

// Reemplaza {qlc} / {client} en textos traducidos con el reparto real.
export function fillSplit(text, model) {
  const { qlc, client } = participationSplit(model);
  return String(text).replaceAll('{qlc}', qlc).replaceAll('{client}', client);
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

// Ejemplos calculados con el porcentaje REAL del modelo (nunca cifras fijas):
// la participación se aplica solo sobre la ganancia, nunca sobre el capital.
export function participationExamples(model, capital = 100, profits = [20, 1]) {
  const { qlc } = participationSplit(model);
  const q = Number(qlc) / 100;
  return profits.map((profit) => {
    const qlcAmount = Math.round(profit * q * 100) / 100;
    const clientAmount = Math.round((profit - qlcAmount) * 100) / 100;
    return {
      profit: fmt(profit),
      qlcAmount: fmt(qlcAmount),
      clientAmount: fmt(clientAmount),
      finalCapital: fmt(Math.round((capital + clientAmount) * 100) / 100),
    };
  });
}

/*
 * MODELO ÚNICO DE PARTICIPACIÓN — ya no hay selector ni otros modelos:
 * se muestra directamente "Modelo de participación · QLC: 50% · Cliente: 50%".
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

/*
 * Detalle del modelo en tarjetas (sin pared de texto): cómo funciona +
 * ejemplo, características y "¿para quién está pensado?" como cita.
 * Se usa en la página pública y en el modal "Ver detalles" del cliente.
 */
export function ParticipationModelDetails({ model, capital = 100 }) {
  const { t } = useLanguage();
  const examples = participationExamples(model, capital);
  const { qlc, client } = participationSplit(model);
  return (
    <div className="qlc-pmd">
      <div className="qlc-pmd-card">
        <h4>{t('participationModel.howTitle')}</h4>
        <p>{fillSplit(t('participationModel.howText'), model)}</p>
        <p className="qlc-pmd-zero">{t('participationModel.zeroCase')}</p>
      </div>

      <div className="qlc-pmd-card qlc-pmd-example">
        <h4>{t('participationModel.exampleTitle').replace('{capital}', capital)}</h4>
        {examples.map((ex) => (
          <div className="qlc-pmd-ex-row" key={ex.profit}>
            <div className="qlc-pmd-ex-profit">
              {t('participationModel.exampleProfit')}: <strong>{ex.profit} USDT</strong>
            </div>
            <div className="qlc-pmd-ex-split">
              <span>
                QLC ({qlc}%) <strong>{ex.qlcAmount} USDT</strong>
              </span>
              <span>
                {t('participationModel.client')} ({client}%) <strong>{ex.clientAmount} USDT</strong>
              </span>
              <span className="qlc-pmd-ex-final">
                {t('participationModel.exampleFinal')} <strong>{ex.finalCapital} USDT</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="qlc-pmd-card">
        <h4>{t('participationModel.featuresTitle')}</h4>
        <ul>
          <li>{t('participationModel.feature1')}</li>
          <li>{t('participationModel.feature2')}</li>
          <li>{t('participationModel.feature3')}</li>
          <li>{t('participationModel.feature4')}</li>
        </ul>
      </div>

      <figure className="qlc-pmd-card qlc-pmd-quote">
        <h4>{t('participationModel.forWhomTitle')}</h4>
        <blockquote>{t('participationModel.forWhomQuote')}</blockquote>
      </figure>
    </div>
  );
}

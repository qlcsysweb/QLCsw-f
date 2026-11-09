import { useLanguage } from '../i18n/LanguageContext';
import { getProfitDistribution, useProfitDistribution } from '../utils/profitDistribution';

// REPARTO DE LA GANANCIA (QLC Affiliate Program): cliente / QLC / promotor
// afiliador, tomado de la configuración vigente del backend (la misma que se
// aplica en los estados de cuenta). Referencia oficial: 50 / 40 / 10.
// `model` se conserva en la firma por compatibilidad con los llamadores.
// eslint-disable-next-line no-unused-vars
export function participationSplit(model) {
  const d = getProfitDistribution();
  return { client: String(d.client), qlc: String(d.qlc), affiliate: String(d.affiliate) };
}

// Texto corto para tablas/listas: "Cliente 50% · QLC 40% · Promotor afiliador 10%".
export function formatParticipationSplit(model, t) {
  const { qlc, client, affiliate } = participationSplit(model);
  return `${t('participationModel.client')} ${client}% · QLC ${qlc}% · ${t('participationModel.affiliate')} ${affiliate}%`;
}

// Reemplaza {client} / {qlc} / {affiliate} en textos traducidos con el reparto real.
export function fillSplit(text, model) {
  const { qlc, client, affiliate } = participationSplit(model);
  return String(text).replaceAll('{qlc}', qlc).replaceAll('{client}', client).replaceAll('{affiliate}', affiliate);
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

// Ejemplos calculados con el porcentaje REAL del modelo (nunca cifras fijas):
// la participación se aplica solo sobre la ganancia, nunca sobre el capital.
export function participationExamples(model, capital = 100, profits = [20, 1]) {
  const { qlc, affiliate } = participationSplit(model);
  const r2 = (n) => Math.round(n * 100) / 100;
  return profits.map((profit) => {
    const qlcAmount = r2((profit * Number(qlc)) / 100);
    const affiliateAmount = r2((profit * Number(affiliate)) / 100);
    const clientAmount = r2(profit - qlcAmount - affiliateAmount);
    return {
      profit: fmt(profit),
      qlcAmount: fmt(qlcAmount),
      affiliateAmount: fmt(affiliateAmount),
      clientAmount: fmt(clientAmount),
      finalCapital: fmt(r2(capital + clientAmount)),
    };
  });
}

/*
 * MODELO ÚNICO DE PARTICIPACIÓN — ya no hay selector ni otros modelos:
 * se muestra directamente "Modelo de participación · QLC: 50% · Cliente: 50%".
 */
export default function ParticipationModelSummary({ model, showTitle = true, className = '' }) {
  const { t } = useLanguage();
  useProfitDistribution();
  const { qlc, client, affiliate } = participationSplit(model);
  return (
    <div className={`qlc-pm ${className}`}>
      {showTitle && <div className="qlc-pm-title">{t('participationModel.title')}</div>}
      <dl className="qlc-pm-split">
        <div>
          <dt>{t('participationModel.client')}</dt>
          <dd>{client}%</dd>
        </div>
        <div>
          <dt>QLC</dt>
          <dd>{qlc}%</dd>
        </div>
        <div>
          <dt>{t('participationModel.affiliate')}</dt>
          <dd>{affiliate}%</dd>
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
  useProfitDistribution();
  const examples = participationExamples(model, capital);
  const { qlc, client, affiliate } = participationSplit(model);
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
                {t('participationModel.client')} ({client}%) <strong>{ex.clientAmount} USDT</strong>
              </span>
              <span>
                QLC ({qlc}%) <strong>{ex.qlcAmount} USDT</strong>
              </span>
              <span>
                {t('participationModel.affiliate')} ({affiliate}%) <strong>{ex.affiliateAmount} USDT</strong>
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

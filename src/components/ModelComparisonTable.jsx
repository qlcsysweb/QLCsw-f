import { useLanguage } from '../i18n/LanguageContext';

// CORRECCIÓN 5 — tabla comparativa real (no solo texto copiado) de los 3
// modelos de participación, tal como la define QLC_Guia_Modelos_
// Participacion_Disenador_Web.docx §5. Los valores son conceptuales/fijos
// del documento comercial (no editables por modelo individual, a diferencia
// de tagline/description/detailsContent que sí administra ADMIN → Modelos).
const ROWS = [
  'mainObjective',
  'performance',
  'modelBase',
  'qlcParticipation',
  'clientParticipation',
  'liquidity',
  'guaranteedReturn',
  'profile',
];

export default function ModelComparisonTable() {
  const { t } = useLanguage();
  return (
    <div className="qlc-table-wrap">
      <table className="qlc-table">
        <thead>
          <tr>
            <th>{t('modelComparison.feature')}</th>
            <th>{t('modelComparison.flexible')}</th>
            <th>{t('modelComparison.performance')}</th>
            <th>{t('modelComparison.compound')}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row}>
              <td>
                <strong>{t(`modelComparison.row.${row}`)}</strong>
              </td>
              <td>{t(`modelComparison.flexibleValue.${row}`)}</td>
              <td>{t(`modelComparison.performanceValue.${row}`)}</td>
              <td>{t(`modelComparison.compoundValue.${row}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

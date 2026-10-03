import { useLanguage } from '../../../i18n/LanguageContext';
import { formatRoi, formatWinRate, formatDrawdown } from '../trackRecordFormat';

/*
 * Las 4 cards informativas (hero y Resultados):
 * BITGET | ELITE TRADER · ROI 30D | valor · TASA DE ÉXITO | valor · MAXIMUM DRAWDOWN | valor
 * ROI, tasa de éxito y Maximum Drawdown provienen del TrackRecord que edita el
 * admin (Admin → Track Record); sin valor configurado se muestra "—".
 */
export default function TrackRecordHighlights({ trackRecord, text, className = '' }) {
  const { t } = useLanguage();
  const platformLabel = text
    ? text('hero', 'mini_platform_label', trackRecord?.platformName || 'BITGET')
    : trackRecord?.platformName || 'BITGET';
  const platformValue = text ? text('hero', 'mini_platform_value', 'Elite Trader') : 'Elite Trader';

  return (
    <div className={`hero-mini ${className}`}>
      <div className="mini">
        <b>{platformLabel}</b>
        <span>{platformValue}</span>
      </div>
      <div className="mini mini-metric">
        <span>{t('hero.roi30d')}</span>
        <b>{formatRoi(trackRecord?.roi30d)}</b>
      </div>
      <div className="mini mini-metric">
        <span>{t('hero.winRate')}</span>
        <b>{formatWinRate(trackRecord?.winRate)}</b>
      </div>
      <div className="mini mini-metric">
        <span>{t('hero.maxDrawdown')}</span>
        <b>{formatDrawdown(trackRecord?.maxDrawdown)}</b>
      </div>
    </div>
  );
}

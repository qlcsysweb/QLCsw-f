import { tradingPath } from '../../../../../shared/config.js';
import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';
import useSectionNav from '../useSectionNav';

export default function PublicFooter({ text, media = () => [] }) {
  const { t } = useLanguage();
  const goToSection = useSectionNav();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>QUANTUM LIQUIDITY CAPITAL</h4>
          <div>{t('footer.institutionalTagline')}</div>
          <div style={{ marginTop: 14, color: '#aab4bd' }}>
            {text('footer', 'tagline', 'Bot Trading Institucional. Accesible desde 100 USDT.')}
          </div>
        </div>
        <div>
          <h4>{t('footer.navigationHeading')}</h4>
          <div>
            <a href={tradingPath('/modelo')} onClick={goToSection('/modelo')}>{t('nav.modelo')}</a> ·{' '}
            <a href={tradingPath('/como-funciona')} onClick={goToSection('/como-funciona')}>{t('nav.comoFunciona')}</a> ·{' '}
            <a href={tradingPath('/tecnologia')} onClick={goToSection('/tecnologia')}>{t('nav.tecnologia')}</a> ·{' '}
            <a href={tradingPath('/microposiciones')} onClick={goToSection('/microposiciones')}>{t('nav.microposiciones')}</a> ·{' '}
            <a href={tradingPath('/el-problema')} onClick={goToSection('/el-problema')}>{t('nav.elProblema')}</a>
          </div>
          <div>
            <a href={tradingPath('/modelos')} onClick={goToSection('/modelos')}>{t('nav.modelos')}</a> ·{' '}
            <a href={tradingPath('/resultados')} onClick={goToSection('/resultados')}>{t('nav.resultados')}</a> ·{' '}
            <a href={tradingPath('/seguridad')} onClick={goToSection('/seguridad')}>{t('nav.seguridad')}</a> ·{' '}
            <a href={tradingPath('/sobre-qlc')} onClick={goToSection('/sobre-qlc')}>{t('nav.sobreQlc')}</a> ·{' '}
            <a href={tradingPath('/faq')} onClick={goToSection('/faq')}>{t('nav.faq')}</a>
          </div>
        </div>
        <div>
          <h4>{t('footer.accessHeading')}</h4>
          <div>{t('footer.accessLine')}</div>
          <div style={{ marginTop: 8 }}>QLC.NET</div>
        </div>
      </div>
      <div className="container">
        <SectionMedia items={media('footer')} />
      </div>
      <div className="container disclaimer">
        {text(
          'footer',
          'disclaimer',
          'Los activos digitales y el trading apalancado implican riesgos significativos. Los resultados históricos no garantizan resultados futuros. La información presentada es de carácter informativo y está sujeta a los términos y condiciones aplicables.'
        )}
      </div>
      <div className="container disclaimer" style={{ marginTop: 6 }}>
        <a href={tradingPath('/privacidad')}>Política de Privacidad</a> ·{' '}
        <a href={tradingPath('/terminos')}>Términos y Condiciones</a>
      </div>
    </footer>
  );
}

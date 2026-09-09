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
            {text('footer', 'tagline', 'Copytrading Institucional. Accesible desde 20 USDT.')}
          </div>
        </div>
        <div>
          <h4>{t('footer.navigationHeading')}</h4>
          <div>
            <a href="/modelo" onClick={goToSection('/modelo', 'modelo')}>{t('nav.modelo')}</a> ·{' '}
            <a href="/como-funciona" onClick={goToSection('/como-funciona', 'como-funciona')}>{t('nav.comoFunciona')}</a> ·{' '}
            <a href="/tecnologia" onClick={goToSection('/tecnologia', 'tecnologia')}>{t('nav.tecnologia')}</a>
          </div>
          <div>
            <a href="/modelos" onClick={goToSection('/modelos', 'modelos')}>{t('nav.modelos')}</a> ·{' '}
            <a href="/resultados" onClick={goToSection('/resultados', 'resultados')}>{t('nav.resultados')}</a> ·{' '}
            <a href="/seguridad" onClick={goToSection('/seguridad', 'seguridad')}>{t('nav.seguridad')}</a> ·{' '}
            <a href="/sobre-qlc" onClick={goToSection('/sobre-qlc', 'sobre-qlc')}>{t('nav.sobreQlc')}</a>
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
    </footer>
  );
}

import { useState } from 'react';
import SectionMedia from './SectionMedia';
import ProblemaIntroModal from './ProblemaIntroModal';
import ProblemaCharts from './ProblemaCharts';
import { useLanguage } from '../../../i18n/LanguageContext';

// CORRECCIÓN 26 — nueva sección pública "El problema", ubicada después de
// Microposiciones. El contenido es real (texto proporcionado), administrable
// vía CMS (PublicContent, sección "problema") y bilingüe.
// Videos de referencia (títulos = nombre del video en YouTube). Se abren en
// una pestaña nueva, igual que el enlace de Bitget en Resultados.
const VIDEOS = [
  { url: 'https://youtu.be/5NGCovAg71c', titleKey: 'problemaSection.video1Title', channel: 'VisualEconomik' },
  { url: 'https://youtu.be/-d-zddKM5uE', titleKey: 'problemaSection.video2Title', channel: 'El psicólogo del trading' },
];

// withIntro: al ENTRAR a la sección (página pública) se muestra primero el
// anuncio "QLC: un aliado estratégico…". En la vista previa del CMS no.
export default function ProblemaSection({ text, media = () => [], withIntro = false }) {
  const { t } = useLanguage();
  const [showIntro, setShowIntro] = useState(withIntro);
  return (
    <section className="section alt" id="el-problema">
      {showIntro && <ProblemaIntroModal onClose={() => setShowIntro(false)} />}
      <div className="container">
        <div className="problema-head">
          <div>
            <div className="kicker">{t('problemaSection.kicker')}</div>
            <h2 style={{ marginBottom: 10 }}>
              {text('problema', 'title', 'EL JUEGO NO ES PAREJO.')}
            </h2>
            <p className="sub" style={{ marginBottom: 25 }}>
              {text('problema', 'lead', 'El 95% pierde. El 5% opera con otra infraestructura.')}
            </p>
          </div>
          <div className="problema-videos">
            {VIDEOS.map((v) => (
              <div className="problema-video" key={v.url}>
                <div className="problema-video-text">
                  <span>▶ {t('problemaSection.videoLabel')} · {v.channel}</span>
                  <strong>{t(v.titleKey)}</strong>
                </div>
                <a className="btn primary problema-video-btn" href={v.url} target="_blank" rel="noreferrer">
                  {t('problemaSection.watchVideo')} ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="clean-card problema-card">
          <p style={{ color: 'var(--qlc-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
            {text(
              'problema',
              'body_1',
              'La mayoría de los traders minoristas enfrenta los mercados con herramientas limitadas: gráficos, indicadores y líneas en una pantalla, intentando anticipar si el precio subirá o bajará.'
            )}
          </p>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
            {text(
              'problema',
              'body_2',
              'Mientras tanto, el entorno profesional utiliza modelos cuantitativos, algoritmos, software especializado y herramientas de análisis de última generación, desarrolladas para procesar información y ejecutar estrategias con una capacidad que un operador humano no puede igualar.'
            )}
          </p>
          <p style={{ color: '#c7ccd2', fontSize: 15, lineHeight: 1.6, fontWeight: 600, marginBottom: 15 }}>
            {text(
              'problema',
              'body_3',
              'El problema no siempre es la estrategia. Es la infraestructura disponible para ejecutarla.'
            )}
          </p>
          <p style={{ color: 'var(--qlc-blue2)', fontSize: 17, fontWeight: 700, marginBottom: 15 }}>
            {text('problema', 'body_4', 'QLC cambia esa ecuación.')}
          </p>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
            {text(
              'problema',
              'body_5',
              'Ponemos al alcance de inversores individuales una infraestructura de Copytrading Institucional, basada en nuestra propia estrategia, tecnología y sistemas de ejecución.'
            )}
          </p>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
            {text('problema', 'body_6', 'Desde 100 USDT.')}
          </p>
          <p style={{ color: '#c7ccd2', fontSize: 15, lineHeight: 1.6, fontWeight: 600, marginBottom: 15 }}>
            {text('problema', 'body_7', 'Tu cuenta sigue siendo individual. Nuestra gestión es global.')}
          </p>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
            {text(
              'problema',
              'body_8',
              'Tú ves tu cuenta. Nosotros vemos tu cuenta como parte de una estructura global de miles de cuentas.'
            )}
          </p>
          <p style={{ color: 'var(--qlc-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
            {text(
              'problema',
              'body_9',
              'La diferencia no está solamente en lo que ves en el gráfico. Está en todo lo que ocurre detrás de él.'
            )}
          </p>
          <p style={{ color: 'var(--qlc-blue2)', fontSize: 16, fontWeight: 700 }}>
            {text(
              'problema',
              'closing',
              'QLC — Infraestructura institucional. Ahora al alcance del inversor individual.'
            )}
          </p>
        </div>

        <ProblemaCharts />

        <SectionMedia items={media('problema')} />
      </div>
    </section>
  );
}

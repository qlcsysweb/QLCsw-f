import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';

// "Conocimiento respaldado por experiencia real" en la página principal: el texto va arriba de las tarjetas
// de rutas y, en el tercer espacio, la tarjeta con el logo, las métricas de Bitget y el botón al perfil.
// Las métricas y el enlace se editan en el panel de administración (Aviso Trading Bot) y llegan por /public/notice.
const COPY = {
  es: {
    eyebrow: 'Conocimiento respaldado por experiencia real',
    p1: 'En QLC creemos que la educación financiera debe ir acompañada de evidencia.',
    p2: 'Compartimos públicamente nuestras métricas de desempeño en Bitget, mostrando los resultados de nuestra propia operativa.',
    p3: 'A través de nuestro curso de trading conocerás los principios, herramientas, análisis estadístico y estrategias de gestión de riesgo que utilizamos para estudiar y operar los mercados.',
    p4: 'No enseñamos promesas de rentabilidad. Compartimos conocimiento, metodología y experiencia real.',
    signature: 'Quantum Liquidity Capital.',
    motto: 'Preservamos capital. Capitalizamos oportunidades.',
    elite: 'Elite trader',
    roi: 'ROI {days}D',
    hit: 'Tasa de éxito',
    drawdown: 'Maximum drawdown',
    cta: 'Comprobar perfil en Bitget →',
    warnTitle: 'Importante',
    warn1: 'Para visualizar nuestro perfil en Bitget es necesario tener instalada la app oficial de Bitget en tu teléfono.',
    warn2: 'Sin la aplicación, Bitget puede no permitir el acceso al perfil.',
    cancel: 'Cancelar',
    go: 'Continuar a Bitget',
  },
  en: {
    eyebrow: 'Knowledge backed by real experience',
    p1: 'At QLC we believe financial education must come with evidence.',
    p2: 'We publicly share our performance metrics on Bitget, showing the results of our own trading.',
    p3: 'Through our trading course you will learn the principles, tools, statistical analysis and risk management strategies we use to study and trade the markets.',
    p4: 'We do not teach promises of returns. We share knowledge, methodology and real experience.',
    signature: 'Quantum Liquidity Capital.',
    motto: 'We preserve capital. We capitalize on opportunities.',
    elite: 'Elite trader',
    roi: 'ROI {days}D',
    hit: 'Win rate',
    drawdown: 'Maximum drawdown',
    cta: 'Check profile on Bitget →',
    warnTitle: 'Important',
    warn1: 'To view our profile on Bitget you need the official Bitget app installed on your phone.',
    warn2: 'Without the app, Bitget may not allow access to the profile.',
    cancel: 'Cancel',
    go: 'Continue to Bitget',
  },
  pt: {
    eyebrow: 'Conhecimento respaldado por experiência real',
    p1: 'Na QLC acreditamos que a educação financeira deve vir acompanhada de evidência.',
    p2: 'Compartilhamos publicamente nossas métricas de desempenho na Bitget, mostrando os resultados da nossa própria operação.',
    p3: 'Por meio do nosso curso de trading você conhecerá os princípios, ferramentas, análise estatística e estratégias de gestão de risco que usamos para estudar e operar os mercados.',
    p4: 'Não ensinamos promessas de rentabilidade. Compartilhamos conhecimento, metodologia e experiência real.',
    signature: 'Quantum Liquidity Capital.',
    motto: 'Preservamos capital. Capitalizamos oportunidades.',
    elite: 'Elite trader',
    roi: 'ROI {days}D',
    hit: 'Taxa de acerto',
    drawdown: 'Maximum drawdown',
    cta: 'Verificar perfil na Bitget →',
    warnTitle: 'Importante',
    warn1: 'Para visualizar nosso perfil na Bitget é necessário ter instalado o app oficial da Bitget no seu celular.',
    warn2: 'Sem o aplicativo, a Bitget pode não permitir o acesso ao perfil.',
    cancel: 'Cancelar',
    go: 'Continuar para a Bitget',
  },
};

// Perfil público de QLC en Bitget. Si en el panel (Aviso Trading Bot) se guarda otro enlace, se usa ese.
const DEFAULT_BITGET_URL = 'https://share.glassgs.com/sl/XMF4AQUFJTHA';

const pct = (n, sign = false) => (n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : `${sign && Number(n) > 0 ? '+' : ''}${Number(n).toFixed(2)}%`);

// Texto que va arriba de las tres tarjetas, fuera de ellas.
export function EvidenceIntro() {
  const { lang } = useI18n();
  const c = COPY[lang] || COPY.es;
  return (
    <div className="evidence-intro reveal" style={{ '--r': 3 }}>
      <span className="evidence-eyebrow">{c.eyebrow}</span>
      <p>{c.p1}</p>
      <p>{c.p2}</p>
      <p>{c.p3}</p>
      <p><b>{c.p4}</b></p>
      <p className="evidence-motto"><b>{c.signature}</b> {c.motto}</p>
    </div>
  );
}

// Tercer espacio de las rutas: logo, métricas de Bitget y botón al perfil (con aviso de la app).
export function EvidenceCard({ index = 2 }) {
  const { lang } = useI18n();
  const c = COPY[lang] || COPY.es;
  const [notice, setNotice] = useState(null);
  const [warn, setWarn] = useState(false);
  useEffect(() => {
    let alive = true;
    api.get('/public/notice').then((n) => alive && setNotice(n)).catch(() => null);
    return () => {
      alive = false;
    };
  }, []);
  const m = notice?.metrics || {};
  const url = notice?.bitgetUrl || DEFAULT_BITGET_URL;
  const open = () => {
    setWarn(false);
    window.open(url, '_blank', 'noopener');
  };
  return (
    <article className="access-card route-card evidence-card reveal-card is-gold" style={{ '--c': index }}>
      <img className="evidence-logo" src="/brand/qlc-logo.png" alt="Quantum Liquidity Capital" loading="lazy" />
      <div className="evidence-metrics">
        <div><small>Bitget</small><b>{c.elite}</b></div>
        <div><small>{c.roi.replace('{days}', m.days ?? 180)}</small><b className="up">{pct(m.returnPct, true)}</b></div>
        <div><small>{c.hit}</small><b className="up">{pct(m.hitRate)}</b></div>
        <div><small>{c.drawdown}</small><b className="up">{pct(m.drawdown)}</b></div>
      </div>
      <button type="button" className="pbtn pbtn-primary" onClick={() => setWarn(true)}>{c.cta}</button>
      <Modal open={warn} title={c.warnTitle} onClose={() => setWarn(false)}
        footer={<><button type="button" className="btn-secondary" onClick={() => setWarn(false)}>{c.cancel}</button><button type="button" className="btn-primary" onClick={open}>{c.go}</button></>}>
        <p>{c.warn1}</p>
        <p>{c.warn2}</p>
      </Modal>
    </article>
  );
}

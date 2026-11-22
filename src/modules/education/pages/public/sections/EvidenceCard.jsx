import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';

// Tarjeta "Conocimiento respaldado por experiencia real" de la página principal. Las métricas y el enlace al
// perfil de Bitget se editan en el panel (Aviso Trading Bot) y llegan por /public/notice.
const COPY = {
  es: {
    tag: 'Experiencia real',
    title: 'Conocimiento respaldado por experiencia real',
    p1: 'En QLC creemos que la educación financiera debe ir acompañada de evidencia. Por eso compartimos públicamente nuestras métricas de desempeño en Bitget, mostrando los resultados de nuestra propia operativa.',
    p2: 'A través de nuestro curso de trading conocerás los principios, herramientas, análisis estadístico y estrategias de gestión de riesgo que utilizamos para estudiar y operar los mercados.',
    p3: 'No enseñamos promesas de rentabilidad. Compartimos conocimiento, metodología y experiencia real.',
    motto: 'Preservamos capital. Capitalizamos oportunidades.',
    elite: 'Elite trader',
    roi: 'ROI {days}D',
    hit: 'Tasa de éxito',
    drawdown: 'Maximum drawdown',
    cta: 'Comprobar perfil en Bitget →',
    note: 'Las métricas son de carácter informativo y no constituyen una garantía de resultados futuros.',
    warnTitle: 'Importante',
    warn1: 'Para visualizar nuestro perfil en Bitget es necesario tener instalada la app oficial de Bitget en tu teléfono.',
    warn2: 'Sin la aplicación, Bitget puede no permitir el acceso al perfil.',
    cancel: 'Cancelar',
    go: 'Continuar a Bitget',
  },
  en: {
    tag: 'Real experience',
    title: 'Knowledge backed by real experience',
    p1: 'At QLC we believe financial education must come with evidence. That is why we publicly share our performance metrics on Bitget, showing the results of our own trading.',
    p2: 'Through our trading course you will learn the principles, tools, statistical analysis and risk management strategies we use to study and trade the markets.',
    p3: 'We do not teach promises of returns. We share knowledge, methodology and real experience.',
    motto: 'We preserve capital. We capitalize on opportunities.',
    elite: 'Elite trader',
    roi: 'ROI {days}D',
    hit: 'Win rate',
    drawdown: 'Maximum drawdown',
    cta: 'Check profile on Bitget →',
    note: 'Metrics are for information only and do not guarantee future results.',
    warnTitle: 'Important',
    warn1: 'To view our profile on Bitget you need the official Bitget app installed on your phone.',
    warn2: 'Without the app, Bitget may not allow access to the profile.',
    cancel: 'Cancel',
    go: 'Continue to Bitget',
  },
  pt: {
    tag: 'Experiência real',
    title: 'Conhecimento respaldado por experiência real',
    p1: 'Na QLC acreditamos que a educação financeira deve vir acompanhada de evidência. Por isso compartilhamos publicamente nossas métricas de desempenho na Bitget, mostrando os resultados da nossa própria operação.',
    p2: 'Por meio do nosso curso de trading você conhecerá os princípios, ferramentas, análise estatística e estratégias de gestão de risco que usamos para estudar e operar os mercados.',
    p3: 'Não ensinamos promessas de rentabilidade. Compartilhamos conhecimento, metodologia e experiência real.',
    motto: 'Preservamos capital. Capitalizamos oportunidades.',
    elite: 'Elite trader',
    roi: 'ROI {days}D',
    hit: 'Taxa de acerto',
    drawdown: 'Maximum drawdown',
    cta: 'Verificar perfil na Bitget →',
    note: 'As métricas são informativas e não constituem garantia de resultados futuros.',
    warnTitle: 'Importante',
    warn1: 'Para visualizar nosso perfil na Bitget é necessário ter instalado o app oficial da Bitget no seu celular.',
    warn2: 'Sem o aplicativo, a Bitget pode não permitir o acesso ao perfil.',
    cancel: 'Cancelar',
    go: 'Continuar para a Bitget',
  },
};

// Perfil público de QLC en Bitget. Si en el panel (Aviso Trading Bot) se guarda otro enlace, se usa ese.
const DEFAULT_BITGET_URL = 'https://share.glassgs.com/sl/GQYXP2GMTJZJ';

const pct = (n, sign = false) => (n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : `${sign && Number(n) > 0 ? '+' : ''}${Number(n).toFixed(2)}%`);

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
      <span className="access-tag">{c.tag}</span>
      <img className="evidence-logo" src="/brand/qlc-logo.png" alt="Quantum Liquidity Capital" loading="lazy" />
      <h3>{c.title}</h3>
      <p>{c.p1}</p>
      <p>{c.p2}</p>
      <p><b>{c.p3}</b></p>
      <div className="evidence-metrics">
        <div><small>Bitget</small><b>{c.elite}</b></div>
        <div><small>{c.roi.replace('{days}', m.days ?? 180)}</small><b className="up">{pct(m.returnPct, true)}</b></div>
        <div><small>{c.hit}</small><b className="up">{pct(m.hitRate)}</b></div>
        <div><small>{c.drawdown}</small><b className="up">{pct(m.drawdown)}</b></div>
      </div>
      <p className="evidence-motto">Quantum Liquidity Capital · {c.motto}</p>
      {url && <button type="button" className="pbtn pbtn-primary" onClick={() => setWarn(true)}>{c.cta}</button>}
      <small className="evidence-note">{c.note}</small>
      <Modal open={warn} title={c.warnTitle} onClose={() => setWarn(false)}
        footer={<><button type="button" className="btn-secondary" onClick={() => setWarn(false)}>{c.cancel}</button><button type="button" className="btn-primary" onClick={open}>{c.go}</button></>}>
        <p>{c.warn1}</p>
        <p>{c.warn2}</p>
      </Modal>
    </article>
  );
}

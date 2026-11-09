import { Link } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { MODULE_STATE } from '../../../utils/labels.js';
import { AsyncView } from '../../../components/ui/States.jsx';
import { Pill, ProgressBar } from '../../../components/ui/Card.jsx';
import { AccessOffers } from '../../../features/access/AccessOffers.jsx';
import { modulePath, useAcademy } from '../../../features/academy/useAcademy.js';
import { tr } from '../../../i18n/tr.js';

const PILL = { good: '', info: '', warn: 'warn', muted: 'muted', bad: 'bad' };

function ModuleTile({ m, to }) {
  const meta = MODULE_STATE[m.state];
  const open = m.state === 'AVAILABLE' || m.state === 'COMPLETED';
  const body = (
    <>
      <div className="tile-top">
        <span className="tile-n">{String(m.number).padStart(2, '0')}</span>
        <Pill variant={PILL[meta.tone]}>{tr(meta.label)}</Pill>
      </div>
      <h3>{tr(m.title)}</h3>
      <p>{tr(m.summary)}</p>
      <span className="tile-cta">{m.state === 'COMPLETED' ? tr('Revisar módulo →') : open ? tr('Entrar al módulo →') : ''}</span>
    </>
  );
  return open || to.admin ? <Link className={`module-tile state-${m.state}`} to={to.path}>{tr(body)}</Link> : <div className={`module-tile state-${m.state}`}>{tr(body)}</div>;
}

export default function AcademyHome() {
  const { basePath, isAdminView } = useWorkspace();
  const res = useAcademy();
  return (
    <AsyncView {...res} onRetry={res.reload}>
      {(a) => (
        <div className="academy">
          <header className="academy-hero">
            <div>
              <div className="section-kicker">{tr('Academia financiera')}</div>
              <h1>{tr('2 bloques · 12 módulos')}</h1>
              <p className="subtitle">{tr('Educación → herramienta → ejercicio → registro → seguimiento. Cada módulo utiliza la información construida en el anterior.')}</p>
            </div>
            <div className="academy-progress">
              <span>Bloque 1 · {a.progressPct}%</span>
              <ProgressBar value={a.progressPct} label={tr('Progreso del bloque 1')} />
              <span>Bloque 2 · {a.block2ProgressPct}%</span>
              <ProgressBar value={a.block2ProgressPct} label={tr('Progreso del bloque 2')} />
              {a.next && <Link className="btn-primary" to={modulePath(basePath, a.next.number)}>{tr('Continuar con M')}{a.next.number}</Link>}
            </div>
          </header>

          {a.access.mode === 'NONE' && !isAdminView && <AccessOffers compact />}

          <section className="academy-block">
            <div className="block-head">
              <h2>{tr('Bloque 1 · Fundamentos, inversión y riesgo')}</h2>
              <span className="muted small">{a.access.mode === 'TOOLS' ? tr('Modalidad: solo herramientas') : tr('Modalidad: academia completa')}</span>
            </div>
            <div className="tiles">
              {a.block1.slice(0, 3).map((m) => <ModuleTile key={m.number} m={m} to={{ path: modulePath(basePath, m.number), admin: isAdminView }} />)}
            </div>
            <div className="route-strip">
              <div>
                <b>{tr('Después del Módulo 3 eliges tu ruta')}</b>
                <span>{tr('Ruta de Mercados (M4–M6, opcional) o Ruta Patrimonial (M7–M12).')}</span>
              </div>
              <div className="route-strip-actions">
                {a.route && <Pill>{a.route === 'MARKETS' ? tr('Ruta de Mercados') : tr('Ruta Patrimonial')}</Pill>}
                {a.filter.passed && <Pill>{tr('Filtro aprobado')}</Pill>}
                <Link className={`btn-secondary ${a.routeAvailable || isAdminView ? '' : 'is-disabled'}`} to={`${basePath}/academia/ruta`}>{tr('Selección de ruta')}</Link>
              </div>
            </div>
            <div className="tiles">
              {a.block1.slice(3).map((m) => <ModuleTile key={m.number} m={m} to={{ path: modulePath(basePath, m.number), admin: isAdminView }} />)}
            </div>
          </section>

          <section className="academy-block">
            <div className="block-head">
              <h2>{tr('Bloque 2 · Organización y crecimiento patrimonial')}</h2>
              <span className="muted small">{a.block2ProgressPct}{tr('% completado · La Ruta de Mercados (M4–M6) es opcional')}</span>
            </div>
            <div className="tiles">
              {a.block2.map((m) => <ModuleTile key={m.number} m={m} to={{ path: modulePath(basePath, m.number), admin: isAdminView }} />)}
            </div>
          </section>
        </div>
      )}
    </AsyncView>
  );
}

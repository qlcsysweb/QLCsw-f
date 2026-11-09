import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Field, FormError, Textarea } from '../../../components/ui/Form.jsx';
import { dateTime } from '../../../utils/format.js';
import { ErrorState, Loading } from '../../../components/ui/States.jsx';
import { Pill } from '../../../components/ui/Card.jsx';
import { ModuleLayout } from '../../../features/academy/ModuleLayout.jsx';
import { RiskNote, ToolCard } from '../../../features/academy/ResultParts.jsx';
import { ModuleMedia } from '../../../features/academy/ModuleMedia.jsx';
import { modulePath, useAcademy, useModule } from '../../../features/academy/useAcademy.js';
import { M1Diagnosis } from '../../../features/academy/tools/M1Diagnosis.jsx';
import { M2ProductMap } from '../../../features/academy/tools/M2ProductMap.jsx';
import { M3PortfolioBuilder } from '../../../features/academy/tools/M3PortfolioBuilder.jsx';
import { M4RiskSimulator, M5TradeSimulator, M6ProfessionalSimulator } from '../../../features/academy/tools/SimulationTools.jsx';
import { M7Budget } from '../../../features/academy/tools/M7Budget.jsx';
import { M8EmergencyFund } from '../../../features/academy/tools/M8EmergencyFund.jsx';
import { M9Obligations } from '../../../features/academy/tools/M9Obligations.jsx';
import { M10NetReturn } from '../../../features/academy/tools/M10NetReturn.jsx';
import { M11Inflation } from '../../../features/academy/tools/M11Inflation.jsx';
import { M12AnnualReview } from '../../../features/academy/tools/M12AnnualReview.jsx';
import { Masterclass } from '../../../features/academy/Masterclass.jsx';
import { ModuleQuestions } from '../../../features/academy/ModuleQuestions.jsx';
import { tr } from '../../../i18n/tr.js';

const TOOLS = {
  1: M1Diagnosis, 2: M2ProductMap, 3: M3PortfolioBuilder, 4: M4RiskSimulator, 5: M5TradeSimulator, 6: M6ProfessionalSimulator,
  7: M7Budget, 8: M8EmergencyFund, 9: M9Obligations, 10: M10NetReturn, 11: M11Inflation, 12: M12AnnualReview,
};
const NEXT_STEP = { 3: 'ruta', 6: 'm/7', 12: null };

function Lesson({ module }) {
  return (
    <div className="lesson-view">
      {module.lesson.map((s) => (
        <section key={s.title} className="lesson-block">
          <h3>{tr(s.title)}</h3>
          {s.paragraphs.map((p, i) => <p key={i}>{tr(p)}</p>)}
        </section>
      ))}
      <ModuleMedia items={module.media} />
      {module.riskNotes.map((n) => <RiskNote key={n}>{n}</RiskNote>)}
    </div>
  );
}

function Progress({ module, onDone }) {
  const { api, canEdit, basePath } = useWorkspace();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(module.exercise || '');
  const [state, setState] = useState({ busy: false, error: null, saved: false });
  useEffect(() => {
    setExercise(module.exercise || '');
  }, [module.exercise]);

  const save = async (status) => {
    setState({ busy: true, error: null, saved: false });
    try {
      await api.put(`/academy/modules/${module.number}/progress`, { status, exercise });
      setState({ busy: false, error: null, saved: true });
      await onDone();
      if (status === 'COMPLETED') {
        const next = NEXT_STEP[module.number];
        if (next) navigate(`${basePath}/academia/${next}`);
        else if (next === undefined) navigate(modulePath(basePath, module.number + 1));
      }
    } catch (error) {
      setState({ busy: false, error, saved: false });
    }
  };

  return (
    <ToolCard title={tr('Ejercicio y registro')} description={module.exerciseGuide?.prompt || tr('Registra tus conclusiones y marca el módulo como completado cuando termines.')}>
      {module.exerciseGuide?.steps ? (
        <ol className="exercise-steps">
          {module.exerciseGuide.steps.map((s) => <li key={s}>{tr(s)}</li>)}
        </ol>
      ) : null}
      <Field label={tr('Tu registro')}>
        <Textarea value={exercise} onChange={(e) => setExercise(e.target.value)} maxLength={5000} disabled={!canEdit} placeholder={tr('Escribe tus respuestas y conclusiones')} />
      </Field>
      {module.adminReply && (
        <div className="exercise-reply">
          <b>{tr('Respuesta del equipo QLC')}</b>
          <small>{dateTime(module.adminReplyAt)}</small>
          <p>{module.adminReply}</p>
        </div>
      )}
      <FormError error={state.error} />
      {state.saved && <p className="small up">{tr('Avance guardado.')}</p>}
      {canEdit && (
        <div className="form-actions">
          <Button variant="secondary" loading={state.busy} onClick={() => save('IN_PROGRESS')}>{tr('Guardar avance')}</Button>
          <Button loading={state.busy} onClick={() => save('COMPLETED')}>{module.status === 'COMPLETED' ? tr('Actualizar registro') : tr('Completar módulo')}</Button>
        </div>
      )}
      {module.number === 6 && module.status === 'COMPLETED' && (
        <p className="muted small">{tr('Completaste la Ruta de Mercados. Continúa con la educación patrimonial en el Módulo 7. No estás obligado a operar ni a utilizar QLC.')}</p>
      )}
      {module.number === 12 && module.status === 'COMPLETED' && (
        <p className="muted small">{tr('Completaste los 12 módulos del programa. Tu revisión anual queda guardada en tu historial patrimonial.')}</p>
      )}
    </ToolCard>
  );
}

export default function ModulePage() {
  const number = Number(useParams().n);
  const { basePath } = useWorkspace();
  const overview = useAcademy();
  const mod = useModule(number);
  const [tab, setTab] = useState(null);

  if ((overview.loading && !overview.data) || (mod.loading && !mod.data)) return <Loading />;
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />;
  if (mod.error) {
    return (
      <ModuleLayout overview={overview.data} block={number > 6 ? 2 : 1} kicker={tr('Módulo {n}', { n: number })} title={tr('Módulo no disponible')}>
        <ErrorState error={mod.error} />
        <div className="form-actions"><Link className="btn-secondary" to={`${basePath}/academia`}>{tr('Volver a la academia')}</Link></div>
      </ModuleLayout>
    );
  }

  const m = mod.data;
  const Tool = TOOLS[number];
  const showMasterclass = !!m.masterclass;
  const masterTab = showMasterclass ? [['masterclass', 'Masterclass']] : [];
  const tabs = m.mode === 'ACADEMY'
    ? [...masterTab, ['clase', 'Instrucciones de uso de herramienta'], ['herramienta', 'Herramienta'], ['avance', 'Ejercicio y avance']]
    : [['herramienta', 'Herramienta'], ['avance', 'Avance'], ...masterTab];
  const active = tab && tabs.some(([k]) => k === tab) ? tab : tabs[0][0];
  const refresh = async () => { await Promise.all([overview.reload(), mod.reload()]); };

  return (
    <ModuleLayout
      overview={overview.data}
      block={m.block}
      kicker={tr('Módulo {n}', { n: number })}
      title={`${m.title}`}
      subtitle={m.tool?.question}
      actions={<Pill variant={m.status === 'COMPLETED' ? '' : 'warn'}>{m.status === 'COMPLETED' ? 'Completado' : m.status === 'IN_PROGRESS' ? tr('En curso') : tr('Sin iniciar')}</Pill>}
    >
      <div className="tabs" role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={active === key} className={active === key ? 'is-active' : ''} onClick={() => setTab(key)}>{tr(label)}</button>
        ))}
      </div>
      <div className="tab-panel" key={active}>
        {active === 'masterclass' && <Masterclass number={number} status={m.masterclass} onChange={refresh} />}
        {active === 'clase' && <Lesson module={m} />}
        {active === 'herramienta' && (
          <>
            <div className="tool-intro">
              <div><span className="section-kicker">{tr('Herramienta')}</span><h2>{tr(m.tool?.name)}</h2></div>
              {m.mode === 'TOOL_ONLY' && <ul className="essentials">{m.essentials.map((e) => <li key={e}>{tr(e)}</li>)}</ul>}
            </div>
            {m.mode === 'TOOL_ONLY' && m.riskNotes.map((n) => <RiskNote key={n}>{n}</RiskNote>)}
            <Tool onSaved={refresh} />
          </>
        )}
        {active === 'avance' && <><Progress module={m} onDone={refresh} /><ModuleQuestions number={number} /></>}
      </div>
    </ModuleLayout>
  );
}

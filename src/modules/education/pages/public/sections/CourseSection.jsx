import { useState } from 'react';
import { LESSONS as LESSONS_BY_LANG } from '../courseContent.js';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { ClassViewer } from './ClassViewer.jsx';
import { SectionHead } from './SectionParts.jsx';

const STAGE_ICONS = {
  learn: <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Zm4 2.2V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.3M21 9.5V14" />,
  apply: <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V15H4V6.5ZM2.5 15h19l-1 3h-17l-1-3Z" />,
  track: <path d="M4 19V5m0 14h16M8 15v-3m4 3V9m4 6v-5m3-4-4 3-3-2-4 3" />,
};

function CourseStages({ stages }) {
  const { t } = useI18n();
  return (
    <ol className="course-stages reveal" style={{ '--r': 2 }} aria-label={t('public.stages')}>
      {stages.map((s) => (
        <li key={s.title}>
          <span className="course-stage-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{STAGE_ICONS[s.icon]}</svg>
          </span>
          <div><b>{s.title}</b><p>{s.text}</p></div>
        </li>
      ))}
    </ol>
  );
}

export function CourseSection({ section }) {
  const { t, lang } = useI18n();
  const [openIndex, setOpenIndex] = useState(null);
  const LESSONS = LESSONS_BY_LANG[lang] || LESSONS_BY_LANG.es;
  const classes = section.items?.length ? section.items : LESSONS.map((l) => ({ title: l.title, tag: t('public.classTag', { n: Number(l.id) }) }));

  return (
    <div className="ps-container course">
      <div className="course-head">
        <div className="course-head-text">
          <SectionHead section={section} compact />
          {section.subtitle && <p className="ps-sub reveal" style={{ '--r': 3 }}>{section.subtitle}</p>}
        </div>
        {section.stages?.length > 0 && <CourseStages stages={section.stages} />}
      </div>
      <div className="course-grid">
        {classes.map((c, i) => (
          <button key={c.title} type="button" className="course-card reveal-card" style={{ '--c': i }} onClick={() => setOpenIndex(i)}>
            <span className="course-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="course-tag">{c.tag || t('public.classTag', { n: i + 1 })}</span>
            <b>{c.title}</b>
            {c.text && <span className="course-text">{c.text}</span>}
            <span className="course-open" aria-hidden="true">{t('public.openClass')}</span>
          </button>
        ))}
      </div>
      {openIndex !== null && LESSONS[openIndex] && (
        <ClassViewer lessons={LESSONS} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  );
}

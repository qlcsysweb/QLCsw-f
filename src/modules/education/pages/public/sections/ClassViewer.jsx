import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nContext.jsx';

const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

function RichText({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}

function lessonSlides(block, cont) {
  const slides = chunk(block.paragraphs || [], 2).map((group, i) => ({ type: 'text', title: i ? `${block.title} ${cont}` : block.title, paragraphs: group }));
  if (block.list) chunk(block.list, 5).forEach((items) => slides.push({ type: 'list', title: block.title, items }));
  if (block.after?.length) slides.push({ type: 'text', title: block.title, paragraphs: block.after });
  if (block.example) slides.push({ type: 'example', title: block.title, example: block.example });
  return slides.length ? slides : [{ type: 'text', title: block.title, paragraphs: [] }];
}

const BLOCK_SLIDES = {
  cards: (b) => chunk(b.items, 3).map((items) => ({ type: 'cards', items, numbered: b.numbered })),
  lesson: (b, cont) => lessonSlides(b, cont),
  risk: (b) => [{ type: 'risk', label: b.label, text: b.text }],
  quote: (b) => [{ type: 'quote', text: b.text, source: b.source }],
  table: (b) => b.rows.map((row) => ({ type: 'compare', head: b.head, row })),
  timeline: (b) => chunk(b.steps.map((s, i) => [...s, i]), 4).map((steps) => ({ type: 'timeline', title: b.title, steps })),
  bars: (b) => [{ type: 'bars', items: b.items, note: b.note }],
};

export function buildSlides(lesson, cont = '(cont.)') {
  return [{ type: 'intro', title: lesson.title, intro: lesson.intro }, ...lesson.blocks.flatMap((b) => BLOCK_SLIDES[b.type]?.(b, cont) || [])];
}

function Slide({ slide }) {
  switch (slide.type) {
    case 'intro':
      return (<><h3 className="cv-title">{slide.title}</h3><p className="cv-lead">{slide.intro}</p></>);
    case 'text':
      return (<><h4 className="cv-sub">{slide.title}</h4>{slide.paragraphs.map((p, i) => <p key={i}><RichText text={p} /></p>)}</>);
    case 'list':
      return (<><h4 className="cv-sub">{slide.title}</h4><ul className="cv-list">{slide.items.map((it, i) => <li key={i}><RichText text={it} /></li>)}</ul></>);
    case 'example':
      return (<><h4 className="cv-sub">{slide.title}</h4><div className="cv-example"><b>{slide.example[0]}</b> {slide.example[1]}</div></>);
    case 'cards':
      return (
        <div className="cv-cards">
          {slide.items.map(([title, text], i) => (
            <article key={title} className="cv-card">
              {slide.numbered && <span className="cv-num">{String.fromCharCode(65 + i)}</span>}
              <b>{title}</b>
              <p>{text}</p>
            </article>
          ))}
        </div>
      );
    case 'risk':
      return <div className="cv-risk"><strong>{slide.label}</strong> {slide.text}</div>;
    case 'quote':
      return <blockquote className="cv-quote">{slide.text}{slide.source && <small>{slide.source}</small>}</blockquote>;
    case 'compare':
      return (
        <dl className="cv-compare">
          {slide.head.map((h, i) => (<div key={h}><dt>{h}</dt><dd>{slide.row[i]}</dd></div>))}
        </dl>
      );
    case 'timeline':
      return (
        <>
          {slide.title && <h4 className="cv-sub">{slide.title}</h4>}
          <ol className="cv-steps">
            {slide.steps.map(([t, d, i]) => (<li key={t}><span>{String(i + 1).padStart(2, '0')}</span><div><b>{t}</b><p>{d}</p></div></li>))}
          </ol>
        </>
      );
    case 'bars':
      return (
        <>
          <div className="cv-bars">
            {slide.items.map(([label, w]) => (<div key={label}><b>{label}</b><span className="track"><span className="fill" style={{ width: `${w}%` }} /></span></div>))}
          </div>
          <p className="cv-note">{slide.note}</p>
        </>
      );
    default:
      return null;
  }
}

export function ClassViewer({ lessons, index, onChange, onClose }) {
  const { t } = useI18n();
  const lesson = lessons[index];
  const cont = t('public.viewer.cont');
  const slides = useMemo(() => buildSlides(lesson, cont), [lesson, cont]);
  const [position, setPosition] = useState({ index, step: 0 });
  const step = position.index === index ? Math.min(position.step, slides.length - 1) : 0;
  const setStep = (next) => setPosition((p) => {
    const current = p.index === index ? p.step : 0;
    return { index, step: typeof next === 'function' ? next(current) : next };
  });
  const panelRef = useRef(null);
  const last = step === slides.length - 1;
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(slides.length - 1, s + 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [slides.length, onClose, index]);

  return (
    <div className="cv" role="dialog" aria-modal="true" aria-label={lesson.title} ref={panelRef} tabIndex={-1}>
      <div className="cv-top">
        <span className="cv-kicker">{t('public.viewer.progress', { n: Number(lesson.id), total: lessons.length })}</span>
        <div className="cv-progress" aria-hidden="true"><span style={{ width: `${((step + 1) / slides.length) * 100}%` }} /></div>
        <button type="button" className="cv-close" onClick={onClose} aria-label={t('public.viewer.close')}>×</button>
      </div>
      <div className="cv-body" key={`${index}-${step}`} aria-live="polite">
        <Slide slide={slides[step]} />
      </div>
      <div className="cv-nav">
        <button type="button" className="pbtn pbtn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>{t('public.viewer.prev')}</button>
        <span className="cv-count">{step + 1} / {slides.length}</span>
        {!last && <button type="button" className="pbtn pbtn-primary" onClick={() => setStep(step + 1)}>{t('public.viewer.next')}</button>}
        {last && index < lessons.length - 1 && <button type="button" className="pbtn pbtn-primary" onClick={() => onChange(index + 1)}>{t('public.viewer.nextClass', { n: index + 2 })}</button>}
        {last && index === lessons.length - 1 && <button type="button" className="pbtn pbtn-primary" onClick={onClose}>{t('public.viewer.finish')}</button>}
      </div>
    </div>
  );
}

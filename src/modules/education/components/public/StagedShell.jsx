import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { IntroReveal } from './IntroReveal.jsx';
import { PublicNavbar } from './PublicNavbar.jsx';
import { SectionStage } from './SectionStage.jsx';

export function useStagedSections(sections, titleSuffix) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('s');
  const activeKey = sections.some((s) => s.key === requested) ? requested : sections[0]?.key;

  useEffect(() => {
    document.body.classList.add('public-locked');
    return () => document.body.classList.remove('public-locked');
  }, []);

  useEffect(() => {
    const section = sections.find((s) => s.key === activeKey);
    if (section) document.title = `${section.navLabel} · ${titleSuffix}`;
  }, [activeKey, sections, titleSuffix]);

  const select = useCallback((key) => {
    if (key && key !== activeKey) setParams(key === sections[0]?.key ? {} : { s: key });
  }, [activeKey, sections, setParams]);

  return { activeKey, select };
}

export function StagedShell({ sections, activeKey, onSelect, render, onLegal, extraLink, homeTo, children }) {
  const { t } = useI18n();
  return (
    <div className="public-shell">
      <IntroReveal />
      <PublicNavbar sections={sections} activeKey={activeKey} onSelect={onSelect} onLegal={onLegal} extraLink={extraLink} homeTo={homeTo} />
      <main className="public-stage" id="contenido">
        {activeKey && <SectionStage activeKey={activeKey} render={render} />}
        <nav className="stage-dots" aria-label={t('common.sections')}>
          {sections.map((s) => (
            <button key={s.key} type="button" aria-label={s.navLabel} className={s.key === activeKey ? 'is-active' : ''} onClick={() => onSelect(s.key)} />
          ))}
        </nav>
      </main>
      {children}
    </div>
  );
}

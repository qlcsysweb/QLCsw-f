import SectionMedia from './SectionMedia';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function ModelosSection({ models, text, media = () => [] }) {
  const { t } = useLanguage();
  return (
    <section className="section alt" id="modelos">
      <div className="container">
        <div className="kicker">{t('modelosSection.kicker')}</div>
        <h2>
          {t('modelosSection.titleLine1')}
          <br />
          <span className="gradient">{t('modelosSection.titleLine2')}</span>
        </h2>
        <p className="sub">{t('modelosSection.sub')}</p>

        <div className="models">
          {models.map((m) => (
            <div className={`model-card${m.key === 'PERFORMANCE' ? ' featured' : ''}`} key={m.id}>
              <div className="model-no">
                {String(m.displayOrder).padStart(2, '0')} · {m.key}
              </div>
              <h3>{m.tagline || m.name}</h3>
              <p>{m.description}</p>
              {m.conditions && (
                <p>
                  <strong>{m.conditions}</strong>
                </p>
              )}
              {m.objective && (
                <p>
                  {t('modelosSection.objective')}: <strong>{m.objective}</strong>
                  {m.period ? ` (${m.period})` : ''}
                </p>
              )}
              <div className="model-tag">{m.name}</div>
            </div>
          ))}
        </div>

        <p className="note">
          {text(
            'modelos',
            'note',
            'Las referencias de rendimiento son objetivos o parámetros del modelo y no constituyen una garantía de resultados futuros.'
          )}
        </p>

        <SectionMedia items={media('modelos')} />
      </div>
    </section>
  );
}

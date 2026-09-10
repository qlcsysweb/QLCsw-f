import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';

// CORRECCIÓN 1/6/20/21 — Guías de Uso: biblioteca de contenido HTML
// editable desde ADMIN → Guías de Uso. El PDF (si está configurado) se
// conserva como descarga adicional, nunca reemplaza esta lectura directa.
export default function ClientGuidesPage() {
  const { t, language } = useLanguage();
  const [guides, setGuides] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/client/guides')
      .then(({ data }) => {
        setGuides(data.guides);
        if (data.guides.length > 0) setActiveId(data.guides[0].id);
      })
      .catch((err) => setError(translateBackendMessage(err.message, language)));
    api
      .get('/client/guide')
      .then(({ data }) => setPdfUrl(data.url))
      .catch(() => setPdfUrl(null));
  }, []);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!guides) return <div className="qlc-empty">{t('common.loading')}</div>;

  const active = guides.find((g) => g.id === activeId);
  const title = active ? (language === 'en' && active.titleEn ? active.titleEn : active.titleEs) : '';
  const content = active ? (language === 'en' && active.contentEn ? active.contentEn : active.contentEs) : '';
  const description = active
    ? language === 'en' && active.descriptionEn
      ? active.descriptionEn
      : active.descriptionEs
    : '';

  const downloadPdf = async () => {
    try {
      const { data } = await api.get('/client/guide');
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientGuides.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientGuides.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientGuides.intro')}</p>

      {guides.length === 0 ? (
        <div className="qlc-empty">{t('clientGuides.none')}</div>
      ) : (
        <div className="qlc-detail-grid" style={{ gridTemplateColumns: '260px 1fr', alignItems: 'start' }}>
          <div className="qlc-card" style={{ padding: 10 }}>
            {guides.map((g) => {
              const gTitle = language === 'en' && g.titleEn ? g.titleEn : g.titleEs;
              return (
                <button
                  key={g.id}
                  className="qlc-btn ghost"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: 6,
                    borderColor: g.id === activeId ? 'var(--qlc-blue2)' : undefined,
                  }}
                  onClick={() => setActiveId(g.id)}
                >
                  {gTitle}
                </button>
              );
            })}
            {pdfUrl && (
              <button className="qlc-btn primary" style={{ width: '100%', marginTop: 10 }} onClick={downloadPdf}>
                {t('clientGuides.downloadPdf')}
              </button>
            )}
          </div>

          <div className="qlc-card">
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            {description && <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{description}</p>}
            <div className="qlc-guide-content" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { translateBackendMessage } from '../../i18n/backendMessages';
import usePolling from '../../hooks/usePolling';
import LoadingScreen from '../../components/LoadingScreen';

// CORRECCIÓN 1/6/20/21 — Guías de Uso: biblioteca de contenido HTML
// editable desde ADMIN → Guías de Uso. El PDF (si está configurado) se
// conserva como descarga adicional, nunca reemplaza esta lectura directa.
//
// Apertura directa: /client/guides?guide=<clave> selecciona una guía de
// sistema (p. ej. "permisos-api", desde la notificación del cliente nuevo).
// La clave queda en la URL, así que recargar conserva la guía elegida.
export default function ClientGuidesPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedKey = searchParams.get('guide');
  const [guides, setGuides] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');
  const [zoomed, setZoomed] = useState(null);
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;
  const contentRef = useRef(null);
  const scrolledForRef = useRef(null);

  const load = () => {
    api
      .get('/client/guides')
      .then(({ data }) => {
        setGuides(data.guides);
        // Conserva la guía seleccionada si sigue existiendo (evita que el
        // sondeo en segundo plano regrese a la primera guía mientras el
        // cliente está leyendo otra).
        const stillExists = data.guides.some((g) => g.id === activeIdRef.current);
        if (!stillExists && data.guides.length > 0) setActiveId(data.guides[0].id);
      })
      .catch((err) => setError(translateBackendMessage(err.message, language)));
    api
      .get('/client/guide')
      .then(({ data }) => setPdfUrl(data.url))
      .catch(() => setPdfUrl(null));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Contenido administrable (ADMIN → Guías de Uso): mismo ritmo que el resto
  // del contenido informativo/CMS, no requiere sondeo agresivo.
  usePolling(load, 20000);

  // La guía pedida por URL manda sobre la selección por defecto — una vez por
  // navegación, para que después el cliente pueda elegir otra libremente.
  const requested = requestedKey && guides ? guides.find((g) => g.key === requestedKey) : null;
  const appliedForRef = useRef(null);
  useEffect(() => {
    if (!requested || appliedForRef.current === location.key) return;
    appliedForRef.current = location.key;
    setActiveId(requested.id);
  }, [requested, location.key]);

  // Al llegar con ?guide=… se lleva la vista al contenido de la guía (en
  // pantallas pequeñas el listado queda arriba) — una vez por navegación.
  useEffect(() => {
    if (!requested || requested.id !== activeId || scrolledForRef.current === location.key) return;
    scrolledForRef.current = location.key;
    contentRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [requested, activeId, location.key]);

  useEffect(() => {
    if (!zoomed) return undefined;
    const onKey = (e) => e.key === 'Escape' && setZoomed(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  if (error) return <div className="qlc-empty">{error}</div>;
  if (!guides) return <LoadingScreen />;

  const active = guides.find((g) => g.id === activeId);
  const title = active ? (language === 'en' && active.titleEn ? active.titleEn : active.titleEs) : '';
  const content = active ? (language === 'en' && active.contentEn ? active.contentEn : active.contentEs) : '';
  const description = active
    ? language === 'en' && active.descriptionEn
      ? active.descriptionEn
      : active.descriptionEs
    : '';

  const selectGuide = (g) => {
    setActiveId(g.id);
    // La URL refleja la guía de sistema elegida (o se limpia para las demás).
    const next = new URLSearchParams(searchParams);
    if (g.key) next.set('guide', g.key);
    else next.delete('guide');
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  };

  const downloadPdf = async () => {
    // Guía con PDF propio (archivo estático del portal, mismo origen).
    if (active?.pdfUrl) {
      const link = document.createElement('a');
      link.href = active.pdfUrl;
      link.download = active.pdfUrl.split('/').pop();
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    try {
      const { data } = await api.get('/client/guide');
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      setError(translateBackendMessage(err.message, language));
    }
  };

  // Las capturas de una guía se pueden ampliar para leer los permisos.
  const onContentClick = (e) => {
    const img = e.target.closest?.('.qlc-guide-figure img');
    if (img) setZoomed({ src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' });
  };

  return (
    <div>
      <div className="qlc-kicker">{t('clientGuides.kicker')}</div>
      <h1 style={{ marginTop: 0 }}>{t('clientGuides.title')}</h1>
      <p style={{ color: 'var(--qlc-muted)', fontSize: 13, maxWidth: 640 }}>{t('clientGuides.intro')}</p>

      {guides.length === 0 ? (
        <div className="qlc-empty">{t('clientGuides.none')}</div>
      ) : (
        <div className="qlc-detail-grid qlc-guides-layout">
          <div className="qlc-card" style={{ padding: 10 }}>
            {guides.map((g) => {
              const gTitle = language === 'en' && g.titleEn ? g.titleEn : g.titleEs;
              return (
                <button
                  key={g.id}
                  className="qlc-btn ghost qlc-guides-item"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: 6,
                    borderColor: g.id === activeId ? 'var(--qlc-blue2)' : undefined,
                  }}
                  aria-current={g.id === activeId ? 'true' : undefined}
                  onClick={() => selectGuide(g)}
                >
                  {gTitle}
                </button>
              );
            })}
            {(active?.pdfUrl || pdfUrl) && (
              <button className="qlc-btn primary" style={{ width: '100%', marginTop: 10 }} onClick={downloadPdf}>
                {t('clientGuides.downloadPdf')}
              </button>
            )}
          </div>

          <div className="qlc-card qlc-guides-content" ref={contentRef}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            {description && <p style={{ color: 'var(--qlc-muted)', fontSize: 13 }}>{description}</p>}
            <div className="qlc-guide-content" onClick={onContentClick} dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      )}

      {zoomed && (
        <div className="qlc-guide-lightbox" role="dialog" aria-modal="true" aria-label={zoomed.alt} onClick={() => setZoomed(null)}>
          <button type="button" className="qlc-guide-lightbox-close" aria-label={t('clientGuides.closeImage')} onClick={() => setZoomed(null)}>
            ×
          </button>
          <img src={zoomed.src} alt={zoomed.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

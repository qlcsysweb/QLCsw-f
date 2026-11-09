import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { responsiveImage } from '../../utils/media.js';
import { Button } from '../../components/ui/Button.jsx';
import { FormError } from '../../components/ui/Form.jsx';
import { tr } from '../../i18n/tr.js';

function DriveItem({ item }) {
  const { api } = useWorkspace();
  const [url, setUrl] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });
  const load = async () => {
    setState({ busy: true, error: null });
    try {
      const res = await api.get(`/academy/media/${item.id}/link`);
      if (item.fileType === 'VIDEO') setUrl(res.url);
      else window.open(res.url, '_blank', 'noopener');
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };
  if (item.fileType === 'VIDEO' && url) {
    return <video className="media-video" src={url} controls preload="metadata" controlsList="nodownload" />;
  }
  return (
    <div className="media-item">
      <span className="media-icon" aria-hidden="true">{item.fileType === 'VIDEO' ? '▶' : '▤'}</span>
      <span className="media-name">{tr(item.name)}</span>
      <Button variant="secondary" loading={state.busy} onClick={load}>{item.fileType === 'VIDEO' ? 'Reproducir' : tr('Abrir documento')}</Button>
      <FormError error={state.error} />
    </div>
  );
}

export function ModuleMedia({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="module-media">
      <h3>{tr('Material del módulo')}</h3>
      {items.map((item) =>
        item.fileType === 'IMAGE' ? (
          <img key={item.id} className="media-image" {...responsiveImage(item.url, [480, 800, 1200])} sizes="(max-width: 900px) 100vw, 800px" alt={item.name} loading="lazy" />
        ) : (
          <DriveItem key={item.id} item={item} />
        ),
      )}
    </section>
  );
}

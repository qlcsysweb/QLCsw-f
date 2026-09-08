import { useEffect, useState } from 'react';
import api from '../services/api';

// Logo activo configurado desde Admin → Contenido del sitio → Multimedia.
// Si no hay ninguno publicado como principal, el consumidor debe usar su
// PNG estático por defecto (comportamiento actual, sin cambios).
export default function useActiveLogo() {
  const [asset, setAsset] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get('/media/logo')
      .then(({ data }) => setAsset(data.asset))
      .catch(() => setAsset(null))
      .finally(() => setLoaded(true));
  }, []);

  return { asset, loaded };
}

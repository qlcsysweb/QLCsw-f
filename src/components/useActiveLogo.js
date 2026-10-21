import { useEffect, useState } from 'react';
import api from '../services/api';

// Logo activo configurado desde Admin → Contenido del sitio → Multimedia.
// Si no hay ninguno publicado como principal, el consumidor debe usar su
// PNG estático por defecto (comportamiento actual, sin cambios).
// Se pide una sola vez por visita y se comparte entre pantallas (login, nav,
// hero…) para no repetir la consulta en cada cambio de página.
let cached = null; // promesa compartida

function loadLogo() {
  if (!cached) {
    cached = api
      .get('/media/logo')
      .then(({ data }) => data.asset || null)
      .catch(() => {
        cached = null;
        return null;
      });
  }
  return cached;
}

export default function useActiveLogo() {
  const [asset, setAsset] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLogo().then((value) => {
      if (cancelled) return;
      setAsset(value);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { asset, loaded };
}

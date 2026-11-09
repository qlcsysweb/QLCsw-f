import { useEffect, useState } from 'react';
import { SITE_DATA_DEFAULTS, SITE_DATA_URL } from './publicSiteData';

/*
 * Datos del sitio que el admin actualiza (cifras del perfil de Bitget, logos
 * ES/EN, multimedia de secciones, reparto del Affiliate Program) — leídos de
 * site-data.json en el CDN de Cloudinary, NUNCA del backend ni de NeonDB.
 * Se pide una sola vez por visita; mientras llega (o si falla) se usan los
 * valores predefinidos del código (SITE_DATA_DEFAULTS).
 *
 * `fetch` directo, sin credenciales: el token de sesión del portal jamás se
 * envía a Cloudinary.
 */
let current = SITE_DATA_DEFAULTS;
let loading = null;
const listeners = new Set();

export function getSiteData() {
  return current;
}

export function loadSiteData() {
  if (!loading) {
    // El parámetro cambia cada 5 min: evita que el navegador muestre una copia
    // vieja después de que el admin publica un cambio.
    const url = `${SITE_DATA_URL}?t=${Math.floor(Date.now() / 300000)}`;
    loading = fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (data && data.version === 1) {
          current = { ...SITE_DATA_DEFAULTS, ...data };
          listeners.forEach((fn) => fn(current));
        }
      })
      .catch(() => {
        // Se conservan los valores predefinidos del código.
      });
  }
  return loading;
}

export function useSiteData() {
  const [value, setValue] = useState(current);
  useEffect(() => {
    listeners.add(setValue);
    loadSiteData();
    return () => listeners.delete(setValue);
  }, []);
  return value;
}

// Reparto vigente HOY: el más reciente de los programados cuya fecha ya llegó.
export function distributionAt(site, now = new Date()) {
  const d = site?.distribution;
  if (!d?.current) return null;
  let value = d.current;
  for (const s of d.scheduled || []) {
    if (new Date(s.effectiveFrom) <= now) value = s;
  }
  return { client: Number(value.client), qlc: Number(value.qlc), affiliate: Number(value.affiliate) };
}

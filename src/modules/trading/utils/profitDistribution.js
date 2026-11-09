import { useEffect, useState } from 'react';
import { distributionAt, getSiteData, loadSiteData, useSiteData } from '../content/siteData';

/*
 * REPARTO DE LA GANANCIA GENERADA — cliente / QLC / promotor afiliador
 * (QLC Affiliate Program). La fuente es la configuración vigente del backend,
 * publicada en site-data.json (Cloudinary) junto con los cambios ya
 * programados — así el sitio público no consulta el backend ni NeonDB. Los
 * estados de cuenta siempre se calculan en el backend con su configuración.
 * Respaldo: la referencia oficial del documento (50% · 40% · 10%).
 */
const OFFICIAL = { client: 50, qlc: 40, affiliate: 10 };

export function getProfitDistribution() {
  return distributionAt(getSiteData()) || OFFICIAL;
}

export function loadProfitDistribution() {
  return loadSiteData();
}

export function useProfitDistribution() {
  const site = useSiteData();
  // Se recalcula al cambiar de día por si llega la fecha de un cambio programado.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return distributionAt(site) || OFFICIAL;
}

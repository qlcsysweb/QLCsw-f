import { useEffect, useState } from 'react';
import api from '../services/api';

/*
 * REPARTO DE LA GANANCIA GENERADA — cliente / QLC / promotor afiliador
 * (QLC Affiliate Program). La fuente de verdad es la configuración vigente
 * del backend (GET /affiliate/distribution), la misma que se aplica al
 * emitir los estados de cuenta. Mientras carga se usa la referencia oficial
 * del documento: 50% cliente · 40% QLC · 10% promotor afiliador.
 */
let current = { client: 50, qlc: 40, affiliate: 10 };
let loading = null;
const listeners = new Set();

export function getProfitDistribution() {
  return current;
}

export function loadProfitDistribution() {
  if (!loading) {
    loading = api
      .get('/affiliate/distribution')
      .then(({ data }) => {
        const d = data.distribution;
        current = { client: Number(d.clientSharePct), qlc: Number(d.qlcSharePct), affiliate: Number(d.affiliateSharePct) };
        listeners.forEach((fn) => fn(current));
      })
      .catch(() => {
        // Sin conexión se conserva la referencia oficial; se reintenta luego.
        loading = null;
      });
  }
  return loading;
}

export function useProfitDistribution() {
  const [value, setValue] = useState(current);
  useEffect(() => {
    listeners.add(setValue);
    loadProfitDistribution();
    return () => listeners.delete(setValue);
  }, []);
  return value;
}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Identificador único de cada build. Se incrusta en el código (__QLC_BUILD_ID__)
// y se publica en /version.json: una pestaña que quedó abierta con una versión
// anterior lo compara y avisa que hay una versión nueva (ver UpdateBanner.jsx).
const BUILD_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function versionFile() {
  return {
    name: 'qlc-version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId: BUILD_ID }) });
    },
  };
}

// El frontend llama al backend directamente vía VITE_API_URL (ver .env /
// .env.example y src/services/api.js) — este proxy es solo un respaldo por
// si algo pide una ruta relativa "/api" sin esa variable configurada.
export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    __QLC_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://qlcsw-b.onrender.com',
        changeOrigin: true,
      },
    },
  },
});

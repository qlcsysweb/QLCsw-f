import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El frontend llama al backend directamente vía VITE_API_URL (ver .env /
// .env.example y src/services/api.js) — este proxy es solo un respaldo por
// si algo pide una ruta relativa "/api" sin esa variable configurada.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});

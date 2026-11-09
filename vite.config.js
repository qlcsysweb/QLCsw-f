import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const educationShared = fileURLToPath(new URL('./src/modules/education/shared', import.meta.url));
const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || Date.now().toString(36);
const versionPayload = () => JSON.stringify({ version: buildId, buildId, builtAt: new Date().toISOString() });
const devBackend = process.env.VITE_DEV_BACKEND || 'http://localhost:4000';

const versionFile = () => ({
  name: 'qlc-version-file',
  configureServer(server) {
    server.middlewares.use('/version.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(versionPayload());
    });
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: versionPayload() });
  },
});

export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(buildId),
    __QLC_BUILD_ID__: JSON.stringify(buildId),
  },
  resolve: { alias: { '@shared': educationShared } },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: devBackend, changeOrigin: true },
      '/trad/api': { target: devBackend, changeOrigin: true },
    },
  },
});

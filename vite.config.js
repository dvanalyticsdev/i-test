import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { proctorApiMiddleware } from './server/proctorBackend.js';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'proctor-backend-api',
      configureServer(server) {
        server.middlewares.use(proctorApiMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(proctorApiMiddleware);
      }
    }
  ],
  server: {
    watch: { ignored: ['**/server/proctor_db.json', '**/server/proctor_db.json.tmp', '**/.test-data/**'] },
    port: 3000,
    open: true,
  },
});

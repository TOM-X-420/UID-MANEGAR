import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@workspace/api-client-react': join(__dirname, '../../lib/api-client-react/src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});

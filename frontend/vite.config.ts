import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-is': path.resolve(import.meta.dirname, 'src/utils/react-is-shim.ts'),
    },
  },
});

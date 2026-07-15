import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Transpile code to be compatible with older TV browsers (Chrome 47+)
    target: 'es2015',
    minify: 'terser',
    cssTarget: 'chrome47',
  }
});
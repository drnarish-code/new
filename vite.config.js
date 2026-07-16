import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2015', // Transpile down to ES6 to prevent crash on older Chromium engines
    minify: 'esbuild'
  },
  esbuild: {
    // Force transform modern syntaxes that older WebViews cannot evaluate
    supported: {
      'optional-chaining': false,
      'nullish-coalescing': false,
      'logical-assignment-operators': false
    }
  }
});
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
    target: 'es2015', // Memaksa kompilasi ke ES2015 bagi mengelakkan crash pada WebView TV lama
    minify: 'esbuild'
  },
  esbuild: {
    // Memaksa penukaran sintaks modern yang tidak disokong oleh Chromium WebView versi lama
    supported: {
      'optional-chaining': false,
      'nullish-coalescing': false,
      'logical-assignment-operators': false
    }
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vite-inline-assets',
      enforce: 'post',
      transformIndexHtml(html, ctx) {
        if (!ctx || !ctx.bundle) return html;
        let newHtml = html;
        
        for (const [fileName, file] of Object.entries(ctx.bundle)) {
          if (file.type === 'asset' && file.fileName.endsWith('.css')) {
            const styleTagRegex = new RegExp(`<link[^>]*href="[^"]*${file.fileName}"[^>]*>`);
            const inlineStyle = `<style>\n${file.source}\n</style>`;
            newHtml = newHtml.replace(styleTagRegex, inlineStyle);
          }
        }

        for (const [fileName, file] of Object.entries(ctx.bundle)) {
          if (file.type === 'chunk' && fileName.endsWith('.js')) {
            const scriptTagRegex = new RegExp(`<script[^>]*src="[^"]*${file.fileName}"[^>]*><\\/script>`);
            const inlineScript = `<script>\n${file.code}\n</script>`;
            newHtml = newHtml.replace(scriptTagRegex, inlineScript);
          }
        }

        newHtml = newHtml.replace(/type="module" crossorigin/g, '');
        newHtml = newHtml.replace(/type="module"/g, '');
        newHtml = newHtml.replace(/crossorigin/g, '');
        newHtml = newHtml.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');
        
        return newHtml;
      }
    }
  ],
  build: {
    assetsInlineLimit: 100000000 // Inline images and small assets inside files
  }
});
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
        var newHtml = html;
        
        // Find and inline CSS files safely
        var bundleKeys = Object.keys(ctx.bundle);
        for (var i = 0; i < bundleKeys.length; i++) {
          var fileName = bundleKeys[i];
          var file = ctx.bundle[fileName];
          if (file.type === 'asset' && file.fileName.indexOf('.css') !== -1) {
            var styleTagRegex = new RegExp('<link[^>]*href="[^"]*' + file.fileName + '"[^>]*>');
            var inlineStyle = '<style>\n' + file.source + '\n</style>';
            newHtml = newHtml.replace(styleTagRegex, function() { return inlineStyle; });
          }
        }

        // Find and inline JS chunk files safely
        for (var j = 0; j < bundleKeys.length; j++) {
          var chunkName = bundleKeys[j];
          var chunkFile = ctx.bundle[chunkName];
          if (chunkFile.type === 'chunk' && chunkFile.fileName.indexOf('.js') !== -1) {
            var scriptTagRegex = new RegExp('<script[^>]*src="[^"]*' + chunkFile.fileName + '"[^>]*></script>');
            var inlineScript = '<script>\n' + chunkFile.code + '\n</script>';
            newHtml = newHtml.replace(scriptTagRegex, function() { return inlineScript; });
          }
        }

        // Clean out ES modules syntax tags so old TVs can execute code
        newHtml = newHtml.replace(/type="module" crossorigin/g, '');
        newHtml = newHtml.replace(/type="module"/g, '');
        newHtml = newHtml.replace(/crossorigin/g, '');
        newHtml = newHtml.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');
        
        return newHtml;
      }
    }
  ],
  build: {
    assetsInlineLimit: 100000000 // Inline small images and icon SVGs directly
  }
});
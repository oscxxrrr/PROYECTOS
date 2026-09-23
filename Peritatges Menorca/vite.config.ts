import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Plugin para eliminar el atributo crossorigin que causa bloqueo CORS en InfinityFree Free Tier
function removeCrossoriginPlugin(): Plugin {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html: string) {
      return html
        .replace(/ crossorigin="anonymous"/g, '')
        .replace(/ crossorigin/g, '');
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    removeCrossoriginPlugin()
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});

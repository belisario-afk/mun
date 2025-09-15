import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages under https://<user>.github.io/mun/ needs this base
  base: '/mun/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        navigateFallback: '/mun/index.html'
      },
      manifest: {
        name: 'Phantom Console',
        short_name: 'Phantom',
        start_url: '/mun/',
        scope: '/mun/',
        display: 'standalone',
        background_color: '#0b1016',
        theme_color: '#0b1016',
        icons: [
          // Add real icons in public/ if you have them
          // { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          // { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    sourcemap: true
  }
});
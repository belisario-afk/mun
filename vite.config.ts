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
      // Workbox config: use index.html as SPA fallback within the /mun/ scope
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{html,js,css,ico,png,svg,webp,woff2}']
      },
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Phantom Console',
        short_name: 'Phantom',
        start_url: '/mun/',
        scope: '/mun/',
        display: 'standalone',
        background_color: '#0b1016',
        theme_color: '#0b1016',
        icons: [
          // Place these files under public/icons/ if you want real PWA icons
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  build: {
    sourcemap: true
  }
});
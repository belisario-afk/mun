import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = '/mun';

  const pwa = VitePWA({
    base,
    includeAssets: ['robots.txt', 'brand/phantom-z-neutral.svg', 'brand/phantom-z-chrome.svg'],
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    workbox: {
      navigateFallback: `${base}/index.html`,
      runtimeCaching: [
        {
          urlPattern: ({ request }) =>
            request.destination === 'script' ||
            request.destination === 'style' ||
            request.destination === 'image' ||
            request.destination === 'font',
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'assets-swr',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 }
          }
        },
        {
          urlPattern: ({ url }) => url.pathname.startsWith(base + '/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-nf',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }
          }
        },
        {
          urlPattern: ({ url }) =>
            url.hostname.includes('accounts.spotify.com') ||
            url.hostname.includes('api.spotify.com') ||
            url.hostname.includes('openai') ||
            url.hostname.includes('azure') ||
            url.hostname.includes('elevenlabs') ||
            url.hostname.includes('googleapis.com'),
          handler: 'NetworkOnly',
          options: {
            cacheName: 'apis-no-cache'
          }
        }
      ]
    },
    manifest: {
      id: '/mun/',
      name: 'Phantom Console (Stealth Cockpit Stereo)',
      short_name: 'Phantom',
      description:
        'Cinematic 3D cockpit/HUD audio dashboard with Spotify, Radio/Local DSP, PWA car-dock, AI copilot, and voice.',
      start_url: '/mun/',
      scope: '/mun/',
      display: 'standalone',
      orientation: 'landscape',
      background_color: '#000000',
      theme_color: '#0b1016',
      icons: [
        { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
        { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
      ]
    }
  });

  return {
    base,
    plugins: [react(), topLevelAwait(), pwa],
    build: {
      sourcemap: mode !== 'production',
      target: 'es2020',
      cssCodeSplit: true
    },
    define: {
      __APP_BASE__: JSON.stringify(base),
      __AI_PROVIDER__: JSON.stringify(env.VITE_AI_PROVIDER || 'mini')
    },
    server: {
      port: 5173,
      strictPort: true
    },
    preview: {
      port: 5173
    }
  };
});
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// LandGrab Collaborated build config.
// Phase 1: vite-plugin-pwa makes the game installable on iPhone (Add to Home
// Screen) with an app icon, full-screen launch, and an offline app shell.
export default defineConfig({
  server: {
    host: true, // expose on the local network so you can test on a phone
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // We register the SW ourselves in src/pwa.js so we can poll for updates
      // (long-open tabs + resumed Home-Screen apps auto-refresh, no cache clear).
      injectRegister: false,
      includeAssets: [
        'favicon.svg',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'LandGrab Collaborated',
        short_name: 'LandGrab',
        description: 'Claim plots of land on a shared retro pixel-art canvas.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#2A1E10', // --soil
        theme_color: '#3B2A1A', // --dirt
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // A new SW activates immediately AND claims already-open pages, so the
        // auto-update reload fires without the user navigating or clearing cache.
        skipWaiting: true,
        clientsClaim: true,
        // Drop old precaches so stale assets can't be served after an update.
        cleanupOutdatedCaches: true,
        // Precache the built app shell for offline launch.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Google Fonts: cache-first so the pixel fonts work offline after first load.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});

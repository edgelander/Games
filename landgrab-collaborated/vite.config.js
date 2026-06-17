import { defineConfig } from 'vite';

// LandGrab Collaborated build config.
// Phase 1 will add vite-plugin-pwa here for the installable iPhone version.
export default defineConfig({
  server: {
    host: true, // expose on the local network so you can test on a phone
  },
});

// Service-worker registration with aggressive auto-update.
//
// vite-plugin-pwa builds the SW with skipWaiting + clientsClaim (registerType
// 'autoUpdate'), so a new SW activates and takes over immediately, and this
// registration reloads the page once it does. The extra piece here is *checking*
// for a new version often enough that users never have to clear their cache:
//   - every 60s while a tab/app stays open, and
//   - whenever the app returns to the foreground (covers reopening an iOS
//     Home-Screen app, which resumes instead of reloading).
import { registerSW } from 'virtual:pwa-register';

let swRegistration = null;

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    swRegistration = registration || null;
    if (swRegistration) {
      setInterval(() => swRegistration.update(), 60 * 1000);
    }
  },
});

// Re-check the moment the app is shown again (tab refocus / PWA resume).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && swRegistration) {
    swRegistration.update();
  }
});

export { updateSW };

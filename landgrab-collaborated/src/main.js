// LandGrab Collaborated — entry point.
// Wires the modules together and renders the initial state.
// (style.css is loaded via the <link> tag in index.html.)
import { updateBadge, updateWallet, updatePrice, showToast } from './ui.js';
import { initInteractions } from './interactions.js';
import { initUpload } from './upload.js';
import { initPurchase } from './purchase.js';
import { loadPlots, subscribeToPlots, relayoutPlots } from './plots.js';
import { initIdentity, onBalanceChange, subscribeBalance } from './identity.js';
import { formatCoins } from './config.js';
import { initLeaderboard, renderLeaderboard } from './leaderboard.js';
import { initForest, relayoutForest } from './forest.js';
import './pwa.js'; // registers the service worker + auto-update polling

// Tell the inline self-heal bootstrap (index.html) that the app shell booted, so
// it doesn't clear caches + reload thinking we're stuck on a stale bundle.
window.__lgBooted = true;

initInteractions();
initUpload();
initPurchase();

// Keep the wallet chip in sync whenever the balance changes.
onBalanceChange(updateWallet);

// Establish the player (nickname/wallet), then load the shared board and keep
// it live as other players claim and overtake plots.
async function start() {
  initForest(); // plant the forest before plots load so claimed land starts cleared
  await initIdentity();
  updateWallet();
  await loadPlots();
  updateBadge();
  initLeaderboard();
  subscribeToPlots(() => {
    updateBadge();
    renderLeaderboard();
    updatePrice(); // a plot arriving/leaving changes the count → keep the live price in sync
  });
  // Authoritative wallet feed: when someone grabs our land we're paid the scaled
  // takeover fee server-side; this picks up the exact credit and celebrates it.
  subscribeBalance((earned) => {
    showToast(`🪙 Someone grabbed your land — you earned 🪙${formatCoins(earned)}!`);
  });
}
start();

// Keep prices and committed plots positioned correctly on resize.
window.addEventListener('resize', () => {
  relayoutPlots();
  relayoutForest();
  updatePrice();
});

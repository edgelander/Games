// LandGrab Collaborated — entry point.
// Wires the modules together and renders the initial state.
// (style.css is loaded via the <link> tag in index.html.)
import { updateBadge, updateWallet, updatePrice } from './ui.js';
import { initInteractions } from './interactions.js';
import { initUpload } from './upload.js';
import { initPurchase } from './purchase.js';
import { loadPlots, subscribeToPlots, relayoutPlots } from './plots.js';
import { initIdentity, onBalanceChange } from './identity.js';
import { initLeaderboard, renderLeaderboard } from './leaderboard.js';

initInteractions();
initUpload();
initPurchase();

// Keep the wallet chip in sync whenever the balance changes.
onBalanceChange(updateWallet);

// Establish the player (nickname/wallet), then load the shared board and keep
// it live as other players claim and overtake plots.
async function start() {
  await initIdentity();
  updateWallet();
  await loadPlots();
  updateBadge();
  initLeaderboard();
  subscribeToPlots(() => {
    updateBadge();
    renderLeaderboard();
  });
}
start();

// Keep prices and committed plots positioned correctly on resize.
window.addEventListener('resize', () => {
  relayoutPlots();
  updatePrice();
});

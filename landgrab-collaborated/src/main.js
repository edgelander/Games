// LandGrab Collaborated — entry point.
// Wires the modules together and renders the initial state.
// (style.css is loaded via the <link> tag in index.html.)
import { updateBadge, updateWallet, updatePrice, showToast } from './ui.js';
import { initInteractions } from './interactions.js';
import { initUpload } from './upload.js';
import { initPurchase } from './purchase.js';
import { loadPlots, subscribeToPlots, relayoutPlots } from './plots.js';
import { initIdentity, onBalanceChange, currentPlayer, applyCredit } from './identity.js';
import { initLeaderboard, renderLeaderboard } from './leaderboard.js';
import { initForest, relayoutForest } from './forest.js';
import './pwa.js'; // registers the service worker + auto-update polling

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
  subscribeToPlots(
    () => {
      updateBadge();
      renderLeaderboard();
    },
    // When one of OUR plots is grabbed, the buyer's payout already credited us
    // server-side — mirror it locally and celebrate the income.
    (row) => {
      if (row.owner_id !== currentPlayer.id) return;
      const paid = Number(row.price_paid) || 0;
      if (paid <= 0) return;
      applyCredit(paid);
      updateWallet();
      showToast(`🪙 Someone grabbed your land — you earned 🪙${Math.round(paid)}!`);
    },
  );
}
start();

// Keep prices and committed plots positioned correctly on resize.
window.addEventListener('resize', () => {
  relayoutPlots();
  relayoutForest();
  updatePrice();
});

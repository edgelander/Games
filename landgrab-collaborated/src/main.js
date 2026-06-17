// LandGrab Collaborated — entry point.
// Wires the modules together and renders the initial state.
// (style.css is loaded via the <link> tag in index.html.)
import { updateBadge, updatePrice } from './ui.js';
import { initInteractions } from './interactions.js';
import { initUpload } from './upload.js';
import { initPurchase } from './purchase.js';
import { loadPlots, subscribeToPlots, relayoutPlots } from './plots.js';

initInteractions();
initUpload();
initPurchase();

// Load the shared board, then keep it live as other players claim plots.
async function start() {
  await loadPlots();
  updateBadge();
  subscribeToPlots(updateBadge);
}
start();

// Keep prices and committed plots positioned correctly on resize.
window.addEventListener('resize', () => {
  relayoutPlots();
  updatePrice();
});

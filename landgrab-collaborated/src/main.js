// LandGrab Collaborated — entry point.
// Wires the modules together and renders the initial state.
// (style.css is loaded via the <link> tag in index.html.)
import { updateBadge, updatePrice } from './ui.js';
import { initInteractions } from './interactions.js';
import { initUpload } from './upload.js';
import { initPurchase } from './purchase.js';

initInteractions();
initUpload();
initPurchase();

// Initial render.
updateBadge();

// Keep the price accurate if the window is resized.
window.addEventListener('resize', updatePrice);

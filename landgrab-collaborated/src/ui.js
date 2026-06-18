// Small UI helpers that read state and update the screen.
import { state } from './state.js';
import { getBasePrice, placementCost } from './pricing.js';
import { getPlotCount, findContested, markContested } from './plots.js';
import { getBalance, currentPlayer } from './identity.js';
import {
  canvas, stagingTile, buyBtn, countDisplay, baseDisplay, coinDisplay, nameDisplay,
  stagingImg, stagingPdf, hintText, sPrice, sBalance, successMsg, toast,
} from './dom.js';

// Header badge: plots on the board (shared count) + current base land price.
export function updateBadge() {
  const count = getPlotCount();
  countDisplay.textContent = count;
  baseDisplay.textContent = '🪙' + getBasePrice(count);
}

// Header wallet chip: coin balance + nickname.
export function updateWallet() {
  coinDisplay.textContent = Math.round(getBalance());
  if (currentPlayer.name) nameDisplay.textContent = currentPlayer.name;
}

// The staging tile's position/size as fractions of the canvas (+ coverage).
export function getTileRectFraction() {
  const cr = canvas.getBoundingClientRect();
  return {
    x: (parseFloat(stagingTile.style.left) || 0) / cr.width,
    y: (parseFloat(stagingTile.style.top) || 0) / cr.height,
    width: stagingTile.offsetWidth / cr.width,
    height: stagingTile.offsetHeight / cr.height,
    coverage: Math.min((stagingTile.offsetWidth * stagingTile.offsetHeight) /
      (canvas.offsetWidth * canvas.offsetHeight), 1),
  };
}

// Recompute cost (land + overtake), preview contested plots, reflect on BUY.
export function updatePrice() {
  if (!stagingTile.classList.contains('active')) return;
  const rect = getTileRectFraction();
  const contested = findContested(rect);
  markContested(contested);

  const cost = placementCost(getPlotCount(), rect.coverage, contested.map((p) => p.price_paid));
  state.currentPrice = cost.total;

  const afford = getBalance() >= cost.total;
  buyBtn.disabled = !afford;
  buyBtn.classList.toggle('pricey', cost.total >= 500 && afford);
  buyBtn.classList.toggle('cant-afford', !afford);
  buyBtn.textContent = afford ? `CLAIM — 🪙${cost.total}` : `NEED 🪙${cost.total}`;

  hintText.textContent = contested.length
    ? `Overtaking ${contested.length} plot(s): land 🪙${cost.land} + takeover 🪙${cost.overtake}`
    : 'Drag · ⛏ to resize';
}

// Put the staging tile back to its idle, hidden state after a purchase.
export function resetStaging() {
  markContested([]);
  stagingTile.classList.remove('active');
  stagingTile.style.opacity = ''; // undo the demolish-time hide
  stagingImg.src = '';
  stagingImg.style.display = 'none';
  stagingPdf.style.display = 'flex';
  buyBtn.style.display = 'none';
  buyBtn.classList.remove('cant-afford', 'pricey');
  hintText.textContent = '';
  state.currentFile = null;
}

// Brief, non-blocking notice (auto-fades). Used for live economy events like
// getting paid when your land is grabbed.
let toastTimer;
export function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}

// Show the "LAND ACQUIRED!" overlay with the price paid + remaining balance.
export function showSuccess(price, balance) {
  sPrice.textContent = 'Cost: 🪙' + Math.round(price);
  sBalance.textContent = 'Balance: 🪙' + Math.round(balance);
  successMsg.classList.add('visible');
}

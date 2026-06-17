// Small UI helpers that read state and update the screen.
import { state } from './state.js';
import { getBasePrice, calcPrice } from './pricing.js';
import {
  canvas, stagingTile, buyBtn, countDisplay, baseDisplay,
  stagingImg, stagingPdf, hintText, sPrice, successMsg,
} from './dom.js';

// Header badge: plots sold + current base price.
export function updateBadge() {
  countDisplay.textContent = state.totalUploads;
  baseDisplay.textContent = '$' + getBasePrice(state.totalUploads).toFixed(2);
}

// Fraction of the canvas (0..1) the staging tile currently covers.
export function getTileArea() {
  return Math.min(
    (stagingTile.offsetWidth * stagingTile.offsetHeight) /
      (canvas.offsetWidth * canvas.offsetHeight),
    1,
  );
}

// Recompute the staging-tile price and reflect it on the BUY button.
export function updatePrice() {
  state.currentPrice = calcPrice(state.totalUploads, getTileArea());
  buyBtn.textContent = 'BUY PLOT — $' + state.currentPrice.toFixed(2);
  buyBtn.classList.toggle('pricey', state.currentPrice >= 20);
}

// Put the staging tile back to its idle, hidden state after a purchase.
export function resetStaging() {
  stagingTile.classList.remove('active');
  stagingImg.src = '';
  stagingImg.style.display = 'none';
  stagingPdf.style.display = 'flex';
  buyBtn.style.display = 'none';
  hintText.textContent = '';
}

// Show the "LAND ACQUIRED!" overlay with the price paid.
export function showSuccess(price) {
  sPrice.textContent = 'Cost: $' + price.toFixed(2);
  successMsg.classList.add('visible');
}

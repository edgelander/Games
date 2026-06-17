// Committing the staging tile into a permanent, shared plot on the land.
import { state } from './state.js';
import { isSupabaseConfigured } from './supabase.js';
import { savePlot, uploadImage } from './plots.js';
import {
  canvas, stagingTile, stagingImg, buyBtn, successMsg, btnAnother, btnStay, fileInput,
} from './dom.js';
import { updateBadge, resetStaging, showSuccess } from './ui.js';

// Snapshot the staging tile, upload its image, and save it to the shared board.
async function buyPlot() {
  if (!stagingTile.classList.contains('active')) return;

  const price = state.currentPrice;
  buyBtn.disabled = true;
  const originalLabel = buyBtn.textContent;
  buyBtn.textContent = 'SAVING…';

  // Store position/size as fractions of the canvas so it renders the same
  // on any screen the other player is using.
  const cr = canvas.getBoundingClientRect();
  const plot = {
    x: (parseFloat(stagingTile.style.left) || 0) / cr.width,
    y: (parseFloat(stagingTile.style.top) || 0) / cr.height,
    width: stagingTile.offsetWidth / cr.width,
    height: stagingTile.offsetHeight / cr.height,
    is_image: state.isImage,
    image_url: null,
    price_paid: price,
  };

  try {
    if (state.isImage) {
      // Upload the real file to shared storage; fall back to the local
      // preview when running without Supabase configured.
      plot.image_url = isSupabaseConfigured
        ? await uploadImage(state.currentFile)
        : stagingImg.src;
    }

    await savePlot(plot);

    resetStaging();
    showSuccess(price);
    updateBadge();
  } catch (e) {
    console.error('[LandGrab] Buy failed:', e);
    alert('Could not stake your plot: ' + (e.message || e));
    buyBtn.textContent = originalLabel;
  } finally {
    buyBtn.disabled = false;
  }
}

// Wire up the BUY button and the success-overlay buttons.
export function initPurchase() {
  buyBtn.addEventListener('click', buyPlot);

  // "Grab another" — close overlay, open the file picker again.
  btnAnother.addEventListener('click', () => {
    successMsg.classList.remove('visible');
    fileInput.click();
  });

  // "No thanks" — just close the overlay; the land stays as-is.
  btnStay.addEventListener('click', () => {
    successMsg.classList.remove('visible');
  });
}

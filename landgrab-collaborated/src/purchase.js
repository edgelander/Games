// Committing the staging tile into a permanent, owned plot — including the
// pay-to-overtake step that covers any plots you place on top of.
import { state } from './state.js';
import { isSupabaseConfigured } from './supabase.js';
import { savePlot, uploadImage, findContested, overtake, getPlotCount } from './plots.js';
import { placementCost } from './pricing.js';
import { currentPlayer, getBalance, spend } from './identity.js';
import { WORLD_ID } from './config.js';
import {
  stagingTile, stagingImg, buyBtn, successMsg, btnAnother, btnStay, fileInput,
} from './dom.js';
import {
  updateBadge, updateWallet, resetStaging, showSuccess, getTileRectFraction,
} from './ui.js';
import { renderLeaderboard } from './leaderboard.js';

// Snapshot the staging tile, pay (land + overtake), and commit it to the board.
async function buyPlot() {
  if (!stagingTile.classList.contains('active')) return;

  const rect = getTileRectFraction();
  const contested = findContested(rect);
  const cost = placementCost(getPlotCount(), rect.coverage, contested.map((p) => p.price_paid));

  if (getBalance() < cost.total) {
    alert(`Not enough coins — you need 🪙${cost.total} but have 🪙${Math.round(getBalance())}.`);
    return;
  }

  buyBtn.disabled = true;
  const originalLabel = buyBtn.textContent;
  buyBtn.textContent = 'SAVING…';

  const plot = {
    x: rect.x, y: rect.y, width: rect.width, height: rect.height,
    is_image: state.isImage,
    image_url: null,
    price_paid: cost.total, // the plot's new value — overtaking it later costs more
    owner_id: currentPlayer.id,
    owner_name: currentPlayer.name,
    owner_color: currentPlayer.color,
    world_id: WORLD_ID,
    active: true,
  };

  try {
    if (state.isImage) {
      plot.image_url = isSupabaseConfigured
        ? await uploadImage(state.currentFile)
        : stagingImg.src;
    }

    await savePlot(plot);      // render + persist our new plot
    await overtake(contested); // cover the plots underneath
    const balance = await spend(cost.total);

    resetStaging();
    showSuccess(cost.total, balance);
    updateBadge();
    updateWallet();
    renderLeaderboard();
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

  btnAnother.addEventListener('click', () => {
    successMsg.classList.remove('visible');
    fileInput.click();
  });

  btnStay.addEventListener('click', () => {
    successMsg.classList.remove('visible');
  });
}

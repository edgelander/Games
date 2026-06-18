// Committing the staging tile into a permanent, owned plot — including the
// pay-to-overtake step that covers any plots you place on top of.
import { state } from './state.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { savePlot, uploadImage, findContested, overtake, getPlotCount } from './plots.js';
import { bulldozeForest } from './forest.js';
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

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Snapshot the staging tile, pay (land + overtake), and commit it to the board.
async function buyPlot() {
  if (!stagingTile.classList.contains('active')) return;

  const rect = getTileRectFraction();
  const contested = findContested(rect);
  // You're never charged to cover your OWN land — only rivals' plots cost a
  // takeover fee (which is then paid out to those rivals, see below).
  const rivals = contested.filter((p) => p.owner_id !== currentPlayer.id);
  const cost = placementCost(getPlotCount(), rect.coverage, rivals.map((p) => p.price_paid));

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

    // 1. Demolish: hide the preview so the forest underneath shows, then
    //    bulldoze the footprint (trees topple + dust) before the photo lands.
    stagingTile.style.opacity = '0';
    await bulldozeForest(rect);

    // 2. Place: the photo drops into the cleared ground.
    const saved = await savePlot(plot); // render + persist our new plot
    saved?.el?.classList.add('dropping');
    await overtake(contested);          // cover the plots underneath
    const balance = await spend(cost.total);
    await payOvertakenOwners(rivals);   // the takeover fee goes to the rivals we covered
    resetStaging();

    // 3. Sign: let the placed photo be seen, then pop the success overlay.
    await delay(400);
    showSuccess(cost.total, balance);
    updateBadge();
    updateWallet();
    renderLeaderboard();
  } catch (e) {
    console.error('[LandGrab] Buy failed:', e);
    alert('Could not stake your plot: ' + (e.message || e));
    buyBtn.textContent = originalLabel;
    stagingTile.style.opacity = ''; // bring the preview back so they can retry
  } finally {
    buyBtn.disabled = false;
  }
}

// Pay each overtaken rival the value of the plot(s) we just covered — the
// takeover fee the buyer paid flows to the victims instead of evaporating.
// Aggregated per owner so one tile over several of a rival's plots is one credit.
// Non-fatal: the buyer's purchase already committed, so a failed payout is only
// logged. (Each victim's own client mirrors the credit live from realtime.)
async function payOvertakenOwners(rivals) {
  if (!isSupabaseConfigured || rivals.length === 0) return;
  const byOwner = new Map();
  for (const p of rivals) {
    if (!p.owner_id) continue;
    byOwner.set(p.owner_id, (byOwner.get(p.owner_id) || 0) + (Number(p.price_paid) || 0));
  }
  await Promise.all(
    [...byOwner].map(([p_id, p_amount]) =>
      supabase.rpc('credit_balance', { p_id, p_amount }).then(({ error }) => {
        if (error) console.error('[LandGrab] Payout to', p_id, 'failed:', error.message);
      }),
    ),
  );
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

// Committing the staging tile into a permanent, locked plot on the land.
import { state, saveUploads } from './state.js';
import {
  canvas, stagingTile, stagingImg, buyBtn, successMsg,
  btnAnother, btnStay, fileInput,
} from './dom.js';
import { updateBadge, resetStaging, showSuccess } from './ui.js';

const PDF_SVG =
  '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<rect width="48" height="48" rx="2" fill="#C0392B"/>' +
  '<path d="M12 14h16l8 8v12H12V14z" fill="#fff" opacity=".12"/>' +
  '<path d="M28 14v8h8" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<path d="M12 14h16l8 8v12H12V14z" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<text x="24" y="30" text-anchor="middle" fill="#fff" font-size="7" font-family="Arial" font-weight="bold">PDF</text>' +
  '</svg>';

// Snapshot the staging tile and drop a permanent committed plot in its place.
function buyPlot() {
  if (!stagingTile.classList.contains('active')) return;

  const x = parseFloat(stagingTile.style.left) || 0;
  const y = parseFloat(stagingTile.style.top) || 0;
  const w = stagingTile.offsetWidth;
  const h = stagingTile.offsetHeight;

  const plot = document.createElement('div');
  plot.className = 'committed-plot';
  plot.style.left = x + 'px';
  plot.style.top = y + 'px';
  plot.style.width = w + 'px';
  plot.style.height = h + 'px';

  if (state.isImage && stagingImg.src) {
    const img = document.createElement('img');
    img.src = stagingImg.src;
    plot.appendChild(img);
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'pdf-icon-wrap';
    wrap.innerHTML = PDF_SVG;
    plot.appendChild(wrap);
  }

  canvas.appendChild(plot);

  // Reset the staging tile and record the sale.
  resetStaging();
  state.totalUploads++;
  saveUploads();
  showSuccess(state.currentPrice);
  updateBadge();
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

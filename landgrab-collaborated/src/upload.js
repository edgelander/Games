// Loading a file (image or PDF) into the draggable staging tile.
import { state } from './state.js';
import {
  canvas, fileInput, uploadBtn, stagingTile, stagingImg, stagingPdf,
  buyBtn, hintText, emptyHint,
} from './dom.js';
import { updatePrice } from './ui.js';

// Size the staging tile (clamped to the canvas) and center it.
function sizeAndCenterTile(w, h) {
  const cr = canvas.getBoundingClientRect();
  w = Math.min(w, cr.width);
  h = Math.min(h, cr.height);
  stagingTile.style.width = Math.round(w) + 'px';
  stagingTile.style.height = Math.round(h) + 'px';
  stagingTile.style.left = Math.round((cr.width - w) / 2) + 'px';
  stagingTile.style.top = Math.round((cr.height - h) / 2) + 'px';
}

// Read the chosen file and drop it into the center of the canvas as a
// resizable staging tile, ready to position and buy.
function loadFile(f) {
  emptyHint.style.display = 'none';
  state.isImage = !!(f.type && f.type.indexOf('image') === 0);
  state.currentFile = f; // kept so we can upload it when the plot is bought

  const init = Math.max(canvas.getBoundingClientRect().width * 0.12, 64);

  // Show something immediately as a square; images resize to their true aspect
  // ratio as soon as we can read the photo's natural dimensions (below).
  state.aspectRatio = 1;
  sizeAndCenterTile(init, init);
  stagingTile.style.transform = 'none';

  if (state.isImage) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      stagingImg.src = ev.target.result;
      stagingImg.style.display = 'block';
      stagingPdf.style.display = 'none';

      // Lock the tile to the photo's real proportions so it's never stretched
      // or letterboxed — the box becomes the same shape as the picture.
      const probe = new Image();
      probe.onload = () => {
        state.aspectRatio = (probe.naturalWidth / probe.naturalHeight) || 1;
        const cr = canvas.getBoundingClientRect();
        let w = init;
        let h = w / state.aspectRatio;
        const maxW = cr.width * 0.9;
        const maxH = cr.height * 0.8;
        if (h > maxH) { h = maxH; w = h * state.aspectRatio; }
        if (w > maxW) { w = maxW; h = w / state.aspectRatio; }
        sizeAndCenterTile(w, h);
        updatePrice();
      };
      probe.src = ev.target.result;
    };
    reader.readAsDataURL(f);
  } else {
    stagingImg.style.display = 'none';
    stagingImg.src = '';
    stagingPdf.style.display = 'flex';
  }

  stagingTile.classList.add('active');
  buyBtn.style.display = 'inline-block';
  hintText.textContent = 'Drag · ⛏ to resize';
  updatePrice();
  fileInput.value = '';
}

// Wire up the file picker button, the hidden input, and drag-and-drop.
export function initUpload() {
  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
  });

  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  });
}

// Exported so "Grab another plot" can re-open the picker.
export { loadFile };

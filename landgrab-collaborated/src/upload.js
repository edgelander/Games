// Loading a file (image or PDF) into the draggable staging tile.
import { state } from './state.js';
import {
  canvas, fileInput, uploadBtn, stagingTile, stagingImg, stagingPdf,
  buyBtn, hintText, emptyHint,
} from './dom.js';
import { updatePrice } from './ui.js';

// Read the chosen file and drop it into the center of the canvas as a
// resizable staging tile, ready to position and buy.
function loadFile(f) {
  emptyHint.style.display = 'none';
  state.isImage = !!(f.type && f.type.indexOf('image') === 0);

  const cr = canvas.getBoundingClientRect();
  const init = Math.max(cr.width * 0.12, 64);

  // Center the staging tile.
  stagingTile.style.width = init + 'px';
  stagingTile.style.height = init + 'px';
  stagingTile.style.left = Math.round((cr.width - init) / 2) + 'px';
  stagingTile.style.top = Math.round((cr.height - init) / 2) + 'px';
  stagingTile.style.transform = 'none';

  if (state.isImage) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      stagingImg.src = ev.target.result;
      stagingImg.style.display = 'block';
      stagingPdf.style.display = 'none';
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

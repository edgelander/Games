// A dense forest of little 🌲 behind the board. As plots are placed, the trees
// in their footprint get "cleared" (bulldozed) with a quick topple + fade, so
// developed land is bare while the rest of the board stays wooded. The forest
// only ever shrinks — cleared land stays cleared.
import { canvas } from './dom.js';

const CELL = 22; // grid spacing in px — small + dense

let layer = null;
const trees = []; // { el, fx, fy, cleared } — fx/fy are the tree's fractional center

// Build (or rebuild) the forest grid to fill the current canvas size.
export function initForest() {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'forest';
    canvas.appendChild(layer);
  }
  layer.innerHTML = '';
  trees.length = 0;

  const cr = canvas.getBoundingClientRect();
  if (!cr.width || !cr.height) return;
  const cols = Math.ceil(cr.width / CELL);
  const rows = Math.ceil(cr.height / CELL);

  const frag = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Jitter + size variation so the rows don't read as a rigid grid.
      const px = c * CELL + CELL / 2 + (Math.random() - 0.5) * CELL * 0.7;
      const py = r * CELL + CELL / 2 + (Math.random() - 0.5) * CELL * 0.7;
      const el = document.createElement('span');
      el.className = 'tree';
      el.textContent = '🌲';
      el.style.left = px + 'px';
      el.style.top = py + 'px';
      el.style.fontSize = (0.8 + Math.random() * 0.4).toFixed(2) + 'rem';
      frag.appendChild(el);
      trees.push({ el, fx: px / cr.width, fy: py / cr.height, cleared: false });
    }
  }
  layer.appendChild(frag);
}

// Reposition existing trees on resize (keeps each tree's cleared state).
export function relayoutForest() {
  const cr = canvas.getBoundingClientRect();
  if (!cr.width || !cr.height) return;
  for (const t of trees) {
    t.el.style.left = t.fx * cr.width + 'px';
    t.el.style.top = t.fy * cr.height + 'px';
  }
}

// Bulldoze every standing tree whose center falls inside the given plot
// rectangle (fractions of the canvas). Called as each plot is rendered.
export function clearForestUnder(rect) {
  if (!rect) return;
  const x1 = rect.x + rect.width;
  const y1 = rect.y + rect.height;
  for (const t of trees) {
    if (t.cleared) continue;
    if (t.fx >= rect.x && t.fx <= x1 && t.fy >= rect.y && t.fy <= y1) {
      t.cleared = true;
      t.el.classList.add('cleared');
    }
  }
}

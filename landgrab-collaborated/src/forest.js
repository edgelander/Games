// A dense forest of little 🌲 behind the board. As plots are placed, the trees
// in their footprint get "cleared" (bulldozed) with a quick topple + fade, so
// developed land is bare while the rest of the board stays wooded. The forest
// only ever shrinks — cleared land stays cleared.
import { canvas } from './dom.js';

const CELL = 22; // grid spacing in px — small + dense

let layer = null;
const trees = []; // { el, fx, fy, cleared } — fx/fy are the tree's fractional center

// Deterministic pseudo-random in [0,1) seeded by a cell's integer (c, r) coords
// (+ a salt to get independent streams). Keyed to the physical cell — NOT a
// running index — so the same cell yields the same tree on every load and on
// every device, regardless of how many columns/rows the viewport produces.
function cellRand(c, r, salt) {
  let h = (Math.imul(c, 374761393) ^ Math.imul(r, 668265263) ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

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
      // Deterministic jitter + size variation so the rows don't read as a rigid
      // grid, yet the forest is identical across reloads and web vs PWA.
      const px = c * CELL + CELL / 2 + (cellRand(c, r, 1) - 0.5) * CELL * 0.7;
      const py = r * CELL + CELL / 2 + (cellRand(c, r, 2) - 0.5) * CELL * 0.7;
      const el = document.createElement('span');
      el.className = 'tree';
      el.textContent = '🌲';
      el.style.left = px + 'px';
      el.style.top = py + 'px';
      el.style.fontSize = (0.8 + cellRand(c, r, 3) * 0.4).toFixed(2) + 'rem';
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

// Animated version for the local player's own claim: topple the footprint's
// trees AND kick up dust puffs, then resolve once the demolition has played out
// (so the caller can place the photo after the land is visibly cleared).
const DEMOLISH_MS = 550;
export function bulldozeForest(rect) {
  clearForestUnder(rect); // topple the standing trees (reuses the .cleared CSS)

  if (layer && rect) {
    const cr = canvas.getBoundingClientRect();
    const w = rect.width * cr.width;
    const h = rect.height * cr.height;
    const count = Math.max(5, Math.min(12, Math.round((w * h) / 3000)));
    for (let i = 0; i < count; i++) {
      const puff = document.createElement('span');
      puff.className = 'dust';
      puff.textContent = '💨';
      puff.style.left = (rect.x + Math.random() * rect.width) * cr.width + 'px';
      puff.style.top = (rect.y + Math.random() * rect.height) * cr.height + 'px';
      puff.style.fontSize = (0.9 + Math.random() * 0.7).toFixed(2) + 'rem';
      puff.style.animationDelay = (Math.random() * 0.15).toFixed(2) + 's';
      puff.addEventListener('animationend', () => puff.remove());
      layer.appendChild(puff);
    }
  }

  return new Promise((resolve) => setTimeout(resolve, DEMOLISH_MS));
}

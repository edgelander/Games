// Dragging and resizing the staging tile (mouse + touch).
import { stagingTile, stagingRes, canvas } from './dom.js';
import { updatePrice } from './ui.js';

let dragging = false, dragSX, dragSY, tileSX, tileSY;
let resizing = false, resSX, resSY, resSW, resSH;

// Normalise mouse/touch into a single {x, y} point.
function getPoint(e) {
  return e.touches
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
    : { x: e.clientX, y: e.clientY };
}

function startDrag(e) {
  if (stagingRes.contains(e.target)) return; // resize handle has its own handler
  e.preventDefault();
  dragging = true;
  const pt = getPoint(e);
  dragSX = pt.x; dragSY = pt.y;
  tileSX = parseFloat(stagingTile.style.left) || 0;
  tileSY = parseFloat(stagingTile.style.top) || 0;
}

function startResize(e) {
  e.stopPropagation();
  e.preventDefault();
  resizing = true;
  const pt = getPoint(e);
  resSX = pt.x; resSY = pt.y;
  resSW = stagingTile.offsetWidth;
  resSH = stagingTile.offsetHeight;
}

function onMove(e) {
  if (!dragging && !resizing) return;
  e.preventDefault();
  const pt = getPoint(e);
  if (dragging) {
    const cr = canvas.getBoundingClientRect();
    stagingTile.style.left =
      Math.max(0, Math.min(cr.width - stagingTile.offsetWidth, tileSX + pt.x - dragSX)) + 'px';
    stagingTile.style.top =
      Math.max(0, Math.min(cr.height - stagingTile.offsetHeight, tileSY + pt.y - dragSY)) + 'px';
    updatePrice(); // moving changes which plots you'd overtake
  }
  if (resizing) {
    const cr = canvas.getBoundingClientRect();
    const tl = stagingTile.getBoundingClientRect();
    stagingTile.style.width =
      Math.min(cr.right - tl.left, Math.max(48, resSW + pt.x - resSX)) + 'px';
    stagingTile.style.height =
      Math.min(cr.bottom - tl.top, Math.max(48, resSH + pt.y - resSY)) + 'px';
    updatePrice();
  }
}

function endGesture() {
  dragging = resizing = false;
}

// Wire up all the drag/resize listeners. Called once at startup.
export function initInteractions() {
  stagingTile.addEventListener('mousedown', startDrag);
  stagingTile.addEventListener('touchstart', startDrag, { passive: false });
  stagingRes.addEventListener('mousedown', startResize);
  stagingRes.addEventListener('touchstart', startResize, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', endGesture);
  document.addEventListener('touchend', endGesture);
}

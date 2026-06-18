// Shared plots: loading, saving, image upload, live updates, rendering, and the
// pay-to-overtake mechanic.
//
// Positions are stored as FRACTIONS of the canvas (0..1) so a plot claimed on a
// phone lands in the same relative place on a laptop. Each plot carries its
// owner (id/name/color) and a current value (`price_paid`); covering a plot
// costs more than that value (see pricing.placementCost).
import { supabase, isSupabaseConfigured } from './supabase.js';
import { canvas, emptyHint } from './dom.js';
import { WORLD_ID, textColorFor } from './config.js';
import { compressImage } from './image.js';
import { clearForestUnder } from './forest.js';

const PDF_SVG =
  '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<rect width="48" height="48" rx="2" fill="#C0392B"/>' +
  '<path d="M12 14h16l8 8v12H12V14z" fill="#fff" opacity=".12"/>' +
  '<path d="M28 14v8h8" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<path d="M12 14h16l8 8v12H12V14z" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<text x="24" y="30" text-anchor="middle" fill="#fff" font-size="7" font-family="Arial" font-weight="bold">PDF</text>' +
  '</svg>';

// Active plots currently on the board (each carries its DOM element).
const plots = [];
const renderedIds = new Set();
let contestedEls = [];

// Active plot count drives the pricing base.
export function getPlotCount() {
  return plots.length;
}

function positionElement(el, plot) {
  const cr = canvas.getBoundingClientRect();
  el.style.left = plot.x * cr.width + 'px';
  el.style.top = plot.y * cr.height + 'px';
  el.style.width = plot.width * cr.width + 'px';
  el.style.height = plot.height * cr.height + 'px';
}

// Draw a single plot (ignores duplicates by id and inactive/overtaken plots).
export function renderPlot(plot) {
  if (plot.active === false) return;
  if (plot.id != null && renderedIds.has(plot.id)) return;
  if (plot.id != null) renderedIds.add(plot.id);

  const el = document.createElement('div');
  el.className = 'committed-plot';
  if (plot.owner_color) el.style.borderColor = plot.owner_color;
  positionElement(el, plot);

  // The photo/PDF lives in its own region so the nameplate below never covers it.
  const photo = document.createElement('div');
  photo.className = 'plot-photo';
  if (plot.is_image && plot.image_url) {
    const img = document.createElement('img');
    img.src = plot.image_url;
    photo.appendChild(img);
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'pdf-icon-wrap';
    wrap.innerHTML = PDF_SVG;
    photo.appendChild(wrap);
  }
  el.appendChild(photo);

  if (plot.owner_name) {
    const tag = document.createElement('div');
    tag.className = 'owner-tag';
    if (plot.owner_color) {
      tag.style.background = plot.owner_color;
      tag.style.color = textColorFor(plot.owner_color);
    }
    tag.textContent = plot.owner_name;
    el.appendChild(tag);
  }

  canvas.appendChild(el);
  plot.el = el;
  plots.push(plot);
  emptyHint.style.display = 'none';

  // Clear (bulldoze) the forest under this plot's footprint.
  clearForestUnder({ x: plot.x, y: plot.y, width: plot.width, height: plot.height });
}

export function relayoutPlots() {
  for (const plot of plots) positionElement(plot.el, plot);
}

// ── Pay-to-overtake helpers ────────────────────────────────────────────────

// Active plots FULLY covered by the given tile (fractions of canvas) — a plot is
// only overtaken once the new tile completely contains it, so partially covered
// photos stay on the board until they're entirely buried.
export function findContested(tile) {
  return plots.filter((p) =>
    p.x >= tile.x && p.y >= tile.y &&
    p.x + p.width <= tile.x + tile.width &&
    p.y + p.height <= tile.y + tile.height,
  );
}

// Outline the plots that would be overtaken right now (called while dragging).
export function markContested(list) {
  for (const el of contestedEls) el.classList.remove('contested');
  contestedEls = list.map((p) => p.el).filter(Boolean);
  for (const el of contestedEls) el.classList.add('contested');
}

// Remove overtaken plots from the board and flag them inactive in the DB.
export async function overtake(list) {
  if (list.length === 0) return;
  const ids = [];
  for (const p of list) {
    if (p.el) p.el.remove();
    const i = plots.indexOf(p);
    if (i !== -1) plots.splice(i, 1);
    if (p.id != null) ids.push(p.id);
  }
  if (isSupabaseConfigured && ids.length) {
    await supabase.from('plots').update({ active: false }).in('id', ids);
  }
}

// ── Ownership / leaderboard ────────────────────────────────────────────────

export function getActiveOwnedValue(ownerId) {
  return plots.reduce((sum, p) => (p.owner_id === ownerId ? sum + (p.price_paid || 0) : sum), 0);
}

// Aggregate active plots into a ranked leaderboard (by total value held).
export function getLeaderboard() {
  const byOwner = new Map();
  for (const p of plots) {
    if (!p.owner_id) continue;
    const e = byOwner.get(p.owner_id) || {
      owner_id: p.owner_id, name: p.owner_name, color: p.owner_color, worth: 0, count: 0,
    };
    e.worth += p.price_paid || 0;
    e.count += 1;
    byOwner.set(p.owner_id, e);
  }
  return [...byOwner.values()].sort((a, b) => b.worth - a.worth || b.count - a.count);
}

// ── Persistence + realtime ─────────────────────────────────────────────────

export async function uploadImage(file) {
  const { blob, ext } = await compressImage(file); // shrink before upload
  const path = crypto.randomUUID() + '.' + ext;
  const { error } = await supabase.storage
    .from('plots')
    .upload(path, blob, { contentType: blob.type || undefined });
  if (error) throw error;
  return supabase.storage.from('plots').getPublicUrl(path).data.publicUrl;
}

// Persist a claimed plot. Returns the saved row (or a local stand-in offline).
export async function savePlot(plot) {
  if (!isSupabaseConfigured) {
    const local = { ...plot, id: 'local-' + Date.now() };
    renderPlot(local);
    return local;
  }
  const { data, error } = await supabase.from('plots').insert(plot).select().single();
  if (error) throw error;
  renderPlot(data); // show ours right away; realtime skips the duplicate
  return data;
}

// Load every active plot in this world once at startup.
export async function loadPlots() {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase
    .from('plots')
    .select('*')
    .eq('world_id', WORLD_ID)
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[LandGrab] Failed to load plots:', error.message);
    return;
  }
  data.forEach(renderPlot);
}

// Listen for plots added (INSERT) and overtaken (UPDATE → active=false).
// `onOvertaken(row)` fires with the full overtaken row so callers can tell when
// it was THEIR plot (row.owner_id) and what it paid out (row.price_paid).
export function subscribeToPlots(onChange, onOvertaken) {
  if (!isSupabaseConfigured) return;
  supabase
    .channel('plots-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'plots', filter: `world_id=eq.${WORLD_ID}` },
      (payload) => {
        renderPlot(payload.new);
        if (onChange) onChange();
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'plots', filter: `world_id=eq.${WORLD_ID}` },
      (payload) => {
        if (payload.new.active === false) {
          removeById(payload.new.id);
          if (onOvertaken) onOvertaken(payload.new);
        }
        if (onChange) onChange();
      },
    )
    .subscribe();
}

// Remove a plot from the board by id (used when someone overtakes it).
function removeById(id) {
  const i = plots.findIndex((p) => p.id === id);
  if (i === -1) return;
  if (plots[i].el) plots[i].el.remove();
  plots.splice(i, 1);
}

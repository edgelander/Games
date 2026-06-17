// Shared plots: loading, saving, image upload, live updates, and rendering.
//
// Positions are stored as FRACTIONS of the canvas (0..1) rather than pixels,
// so a plot claimed on a phone lands in the same relative place on a laptop.
import { supabase, isSupabaseConfigured } from './supabase.js';
import { canvas, emptyHint } from './dom.js';

const PDF_SVG =
  '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<rect width="48" height="48" rx="2" fill="#C0392B"/>' +
  '<path d="M12 14h16l8 8v12H12V14z" fill="#fff" opacity=".12"/>' +
  '<path d="M28 14v8h8" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<path d="M12 14h16l8 8v12H12V14z" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<text x="24" y="30" text-anchor="middle" fill="#fff" font-size="7" font-family="Arial" font-weight="bold">PDF</text>' +
  '</svg>';

// In-memory list of plots currently on the board (each carries its DOM element).
const plots = [];
const renderedIds = new Set();

// How many plots have been claimed — drives the pricing base.
export function getPlotCount() {
  return plots.length;
}

// Convert a plot's stored fractions into pixel position/size for this screen.
function positionElement(el, plot) {
  const cr = canvas.getBoundingClientRect();
  el.style.left = plot.x * cr.width + 'px';
  el.style.top = plot.y * cr.height + 'px';
  el.style.width = plot.width * cr.width + 'px';
  el.style.height = plot.height * cr.height + 'px';
}

// Draw a single plot onto the canvas (ignores duplicates by id).
export function renderPlot(plot) {
  if (plot.id != null && renderedIds.has(plot.id)) return;
  if (plot.id != null) renderedIds.add(plot.id);

  const el = document.createElement('div');
  el.className = 'committed-plot';
  positionElement(el, plot);

  if (plot.is_image && plot.image_url) {
    const img = document.createElement('img');
    img.src = plot.image_url;
    el.appendChild(img);
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'pdf-icon-wrap';
    wrap.innerHTML = PDF_SVG;
    el.appendChild(wrap);
  }

  canvas.appendChild(el);
  plot.el = el;
  plots.push(plot);
  emptyHint.style.display = 'none';
}

// Reposition every plot — call this when the window/canvas resizes.
export function relayoutPlots() {
  for (const plot of plots) positionElement(plot.el, plot);
}

// Upload an image file to storage and return its public URL.
export async function uploadImage(file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = crypto.randomUUID() + '.' + ext;
  const { error } = await supabase.storage.from('plots').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('plots').getPublicUrl(path).data.publicUrl;
}

// Persist a claimed plot. Returns the saved row (or a local stand-in offline).
export async function savePlot(plot) {
  if (!isSupabaseConfigured) {
    // Local-only fallback: render immediately, no sharing.
    const local = { ...plot, id: 'local-' + Date.now() };
    renderPlot(local);
    return local;
  }
  const { data, error } = await supabase.from('plots').insert(plot).select().single();
  if (error) throw error;
  renderPlot(data); // show ours right away; realtime will skip the duplicate
  return data;
}

// Load every existing plot once at startup.
export async function loadPlots() {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase
    .from('plots')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[LandGrab] Failed to load plots:', error.message);
    return;
  }
  data.forEach(renderPlot);
}

// Listen for plots added by other players and draw them live.
export function subscribeToPlots(onChange) {
  if (!isSupabaseConfigured) return;
  supabase
    .channel('plots-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'plots' },
      (payload) => {
        renderPlot(payload.new);
        if (onChange) onChange();
      },
    )
    .subscribe();
}

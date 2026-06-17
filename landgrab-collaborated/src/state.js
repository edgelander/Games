// Shared game state.
//
// `totalUploads` is persisted to localStorage (single-player baseline).
// In Phase 2 this becomes a count read from the shared database instead.
const STORAGE_KEY = 'lg_uploads';

export const state = {
  totalUploads: parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10),
  currentPrice: 2.0, // price of the staging tile at its current size
  isImage: false,    // true = uploaded an image, false = a PDF
};

// Save the running plot count so it survives a page reload.
export function saveUploads() {
  localStorage.setItem(STORAGE_KEY, String(state.totalUploads));
}

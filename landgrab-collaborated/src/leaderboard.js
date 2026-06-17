// Live leaderboard: ranks players by the total value of the land they currently
// hold (sum of price_paid across their active plots). Recomputed from the
// in-memory board whenever plots change.
import { getLeaderboard } from './plots.js';
import { currentPlayer } from './identity.js';
import { lbToggle, lbClose, lbPanel, lbList } from './dom.js';

export function renderLeaderboard() {
  const rows = getLeaderboard();
  lbList.innerHTML = '';
  if (rows.length === 0) {
    lbList.innerHTML = '<li class="lb-empty">No land claimed yet.</li>';
    return;
  }
  rows.forEach((r, i) => {
    const li = document.createElement('li');
    if (r.owner_id === currentPlayer.id) li.classList.add('me');
    li.innerHTML =
      `<span class="lb-rank">${i + 1}</span>` +
      `<span class="lb-dot" style="background:${r.color || '#9A8A6A'}"></span>` +
      `<span class="lb-name">${escapeHtml(r.name || 'Anon')}</span>` +
      `<span class="lb-worth">🪙${Math.round(r.worth)}</span>`;
    lbList.appendChild(li);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function initLeaderboard() {
  const close = () => lbPanel.classList.remove('open');
  lbToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    lbPanel.classList.toggle('open');
  });
  lbClose.addEventListener('click', close);
  // Tap anywhere outside the open panel closes it too.
  document.addEventListener('click', (e) => {
    if (lbPanel.classList.contains('open') && !lbPanel.contains(e.target) && e.target !== lbToggle) {
      close();
    }
  });
  renderLeaderboard();
}

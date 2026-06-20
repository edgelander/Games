// Central, tunable game constants — the "one place" for balancing v1.
export const WORLD_ID = 'global'; // single shared world for now; rooms come later
export const STARTING_BALANCE = 1000; // coins every new player starts with

// Per-player colors, assigned by hashing the player id so a player keeps the
// same color across sessions and looks distinct on the board + leaderboard.
export const PLAYER_COLORS = [
  '#F5C842', '#5C9E3A', '#C0392B', '#3AA0C9',
  '#B35CC9', '#E0852F', '#4AD0C0', '#D94F8A',
];

export function colorForId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PLAYER_COLORS[h % PLAYER_COLORS.length];
}

// Pick a legible text color (black or white) for text drawn ON a given color,
// using YIQ brightness — light backgrounds (yellow/teal) get black text, dark
// ones (red/purple/blue) get white.
export function textColorFor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#000';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 140 ? '#000' : '#fff';
}

// Format a whole-coin amount with thousands separators (e.g. 215443 -> "215,443").
export function formatCoins(n) {
  return Math.round(Number(n) || 0).toLocaleString('en-US');
}

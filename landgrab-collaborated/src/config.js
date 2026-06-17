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

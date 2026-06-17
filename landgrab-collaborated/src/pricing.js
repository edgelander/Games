// Pure pricing math — no DOM, no side effects. Easy to test and to move
// server-side in Phase 2 (where pricing becomes authoritative for everyone).

// Base price starts at $2.00 and rises $0.10 for every 500 plots sold.
export function getBasePrice(totalUploads) {
  return 2.0 + Math.floor(totalUploads / 500) * 0.1;
}

// Price scales with how much of the canvas the plot covers (pct = 0..1),
// curving from the base price up toward $30 at full coverage.
export function calcPrice(totalUploads, pct) {
  const b = getBasePrice(totalUploads);
  return Math.round(b * Math.pow(30 / b, pct) * 100) / 100;
}

// Total cost to place a plot: the land price for the area it covers, PLUS the
// full current value of every plot it overtakes. So you always pay strictly
// more than the land you're covering is worth. `contestedValues` is the list of
// price_paid values of the plots being overtaken.
export function placementCost(totalUploads, pct, contestedValues = []) {
  const land = calcPrice(totalUploads, pct);
  const overtake = contestedValues.reduce((sum, v) => sum + (Number(v) || 0), 0);
  return {
    land,
    overtake: Math.round(overtake * 100) / 100,
    total: Math.round((land + overtake) * 100) / 100,
  };
}

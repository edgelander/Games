// Pure pricing math — no DOM, no side effects. Easy to test and to move
// server-side later. All prices are WHOLE coins (the in-game currency); there
// are no cents.

// Economy is balanced around the 1000-coin starting balance (config.STARTING_BALANCE):
//  - a tiny plot starts at MIN_LAND (cheap), but that floor COMPOUNDS as the board
//    fills: every plot already on the board makes the next small photo ~GROWTH×
//    pricier, climbing from MIN_LAND up to the FULL_LAND cap over PLOTS_TO_MAX
//    plots. So early claimers get cheap land and waiting gets expensive fast.
//  - FULL_LAND (1,000,000 — a thousand times the 1000 start) is both the price to
//    cover the whole board AND the ceiling the small-photo price compounds toward;
//    once the board is that full, essentially everything costs a million. Owning
//    the board is a monopoly-endgame prize, unattainable on starting coins.
const MIN_LAND = 100;          // a tiny plot starts here (compounds up from here)
const FULL_LAND = 1000000;     // whole-board price AND the compounding cap — monopoly only
const PLOTS_TO_MAX = 150;      // plots on the board for the small-photo price to reach FULL_LAND
// Per-plot compound factor (~1.063): MIN_LAND × GROWTH^PLOTS_TO_MAX === FULL_LAND.
const GROWTH = Math.pow(FULL_LAND / MIN_LAND, 1 / PLOTS_TO_MAX);

// Base land price (the floor for a tiny plot) — compounds with how many plots are
// already on the board, capped at FULL_LAND. Whole coins.
export function getBasePrice(totalUploads) {
  return Math.min(Math.round(MIN_LAND * Math.pow(GROWTH, totalUploads)), FULL_LAND);
}

// Price scales with how much of the canvas the plot covers (pct = 0..1),
// curving from the base price up toward FULL_LAND at full coverage. Whole coins.
export function calcPrice(totalUploads, pct) {
  const b = getBasePrice(totalUploads);
  return Math.min(FULL_LAND, Math.max(1, Math.round(b * Math.pow(FULL_LAND / b, pct))));
}

// Total cost to place a plot: the land price for the area it covers, PLUS the
// full current value of every plot it overtakes. So you always pay strictly
// more than the land you're covering is worth. `contestedValues` is the list of
// price_paid values of the plots being overtaken. All whole coins.
export function placementCost(totalUploads, pct, contestedValues = []) {
  const land = calcPrice(totalUploads, pct);
  const overtake = Math.round(contestedValues.reduce((sum, v) => sum + (Number(v) || 0), 0));
  return {
    land,
    overtake,
    total: land + overtake,
  };
}

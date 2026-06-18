// Pure pricing math — no DOM, no side effects. Easy to test and to move
// server-side later. All prices are WHOLE coins (the in-game currency); there
// are no cents.

// Economy is balanced around the 1000-coin starting balance (config.STARTING_BALANCE):
//  - a tiny plot costs MIN_LAND, so a new player can claim plenty of small plots;
//  - the price curves up EXPONENTIALLY toward FULL_LAND for covering the whole
//    board. FULL_LAND is set wildly above the starting balance (100× the 1000
//    start) so blanketing the board is a monopoly-endgame prize — unattainable on
//    starting coins and only reachable by a player who has dominated the board and
//    amassed a fortune (e.g. half the board already costs your entire 1000 start).
const MIN_LAND = 10;        // a tiny plot
const FULL_LAND = 100000;   // covering the ENTIRE board — wildly unattainable; monopoly only
const INFLATE_EVERY = 100;  // +1 coin to the base land price per this many plots sold

// Base land price (the floor for a tiny plot), drifting up slowly as the board fills.
export function getBasePrice(totalUploads) {
  return MIN_LAND + Math.floor(totalUploads / INFLATE_EVERY);
}

// Price scales with how much of the canvas the plot covers (pct = 0..1),
// curving from the base price up toward FULL_LAND at full coverage. Whole coins.
export function calcPrice(totalUploads, pct) {
  const b = getBasePrice(totalUploads);
  return Math.max(1, Math.round(b * Math.pow(FULL_LAND / b, pct)));
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

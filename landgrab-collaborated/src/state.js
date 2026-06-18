// Shared runtime state for the staging tile (the plot being placed).
// The total plot count now lives in the shared board — see plots.js getPlotCount().
export const state = {
  currentPrice: 10,    // price (whole coins) of the staging tile at its current size
  isImage: false,      // true = uploaded an image, false = a PDF
  currentFile: null,   // the actual File being placed (uploaded on buy)
  aspectRatio: 1,      // width/height of the staged photo — keeps the tile in proportion
};

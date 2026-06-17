// Central place for all the page elements the game talks to.
// One lookup here means every other module shares the same references.
export const canvas      = document.getElementById('canvas');
export const fileInput   = document.getElementById('file-input');
export const uploadBtn   = document.getElementById('upload-btn');
export const stagingTile = document.getElementById('staging-tile');
export const stagingImg  = document.getElementById('staging-img');
export const stagingPdf  = document.getElementById('staging-pdf-wrap');
export const stagingRes  = document.getElementById('staging-resize');
export const buyBtn       = document.getElementById('buy-btn');
export const successMsg    = document.getElementById('success-msg');
export const btnAnother    = document.getElementById('btn-another');
export const btnStay        = document.getElementById('btn-stay');
export const countDisplay   = document.getElementById('count-display');
export const baseDisplay     = document.getElementById('base-display');
export const sPrice           = document.getElementById('s-price');
export const emptyHint        = document.getElementById('empty-hint');
export const hintText          = document.getElementById('hint-text');

// Phase 4: identity, wallet, leaderboard.
export const coinDisplay   = document.getElementById('coin-display');
export const nameDisplay   = document.getElementById('name-display');
export const sBalance      = document.getElementById('s-balance');
export const nickModal     = document.getElementById('nick-modal');
export const nickInput     = document.getElementById('nick-input');
export const nickBtn       = document.getElementById('nick-btn');
export const lbToggle      = document.getElementById('lb-toggle');
export const lbPanel       = document.getElementById('lb-panel');
export const lbList        = document.getElementById('lb-list');

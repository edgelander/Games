// Player accounts — username + PIN (Phase 5).
//
// Identity is an ACCOUNT, not a device: the row id is the normalized username,
// the PIN is verified server-side by the login() RPC. Re-entering the same
// username + PIN on any device or after a reinstall logs back into the same
// account, balance, and owned plots. Credentials are cached in localStorage so
// a normal reopen doesn't re-prompt; a reinstall clears them and the user logs
// back in. v1 is still client-trusted for balances (flagged for the money phase).
import { supabase, isSupabaseConfigured } from './supabase.js';
import { STARTING_BALANCE, colorForId } from './config.js';
import { nickModal, nickInput, nickPin, nickBtn, nickError, nameDisplay } from './dom.js';

const NAME_KEY = 'lg_username';
const PIN_KEY = 'lg_pin';
const BAL_KEY = 'lg_balance'; // local-only fallback

export const currentPlayer = { id: null, name: null, color: null };

let balance = STARTING_BALANCE;
const balanceListeners = [];

export function getBalance() {
  return balance;
}
export function onBalanceChange(fn) {
  balanceListeners.push(fn);
}
function emitBalance() {
  for (const fn of balanceListeners) fn(balance);
}

const normalize = (name) => name.trim().toLowerCase();

// Deduct coins for a purchase and persist. Returns the new balance.
export async function spend(amount) {
  balance = Math.max(0, Math.round((balance - amount) * 100) / 100);
  emitBalance();
  if (isSupabaseConfigured) {
    await supabase.from('players').update({ balance }).eq('id', currentPlayer.id);
  } else {
    localStorage.setItem(BAL_KEY, String(balance));
  }
  return balance;
}

// Mirror a credit that already happened server-side (the buyer's credit_balance
// RPC pays us when our plot is overtaken). This only updates the LOCAL balance so
// the wallet/leaderboard react immediately — no DB write, or we'd double-count.
// On next login the authoritative players.balance confirms the amount.
export function applyCredit(amount) {
  const amt = Number(amount) || 0;
  if (amt <= 0) return balance;
  balance = Math.round((balance + amt) * 100) / 100;
  emitBalance();
  if (!isSupabaseConfigured) localStorage.setItem(BAL_KEY, String(balance));
  return balance;
}

// Show the login card and resolve with { username, pin }.
function askLogin(errorMsg) {
  return new Promise((resolve) => {
    nickError.textContent = errorMsg || '';
    nickModal.classList.add('visible');

    const submit = () => {
      const username = (nickInput.value || '').trim().slice(0, 24);
      const pin = (nickPin.value || '').trim();
      if (username.length < 1) { nickError.textContent = 'Enter a username.'; return; }
      if (pin.length < 4) { nickError.textContent = 'PIN must be at least 4 characters.'; return; }
      cleanup();
      resolve({ username, pin });
    };
    const onKey = (e) => { if (e.key === 'Enter') submit(); };
    function cleanup() {
      nickBtn.removeEventListener('click', submit);
      nickInput.removeEventListener('keydown', onKey);
      nickPin.removeEventListener('keydown', onKey);
    }
    nickBtn.addEventListener('click', submit);
    nickInput.addEventListener('keydown', onKey);
    nickPin.addEventListener('keydown', onKey);
  });
}

// Attempt a login/create. Returns true on success, or { error } on failure.
async function tryLogin(username, pin) {
  const id = normalize(username);
  const color = colorForId(id);

  if (!isSupabaseConfigured) {
    // Local-only mode: no real accounts, just remember the name.
    currentPlayer.id = id;
    currentPlayer.name = username;
    currentPlayer.color = color;
    balance = Number(localStorage.getItem(BAL_KEY) ?? STARTING_BALANCE);
    return true;
  }

  const { data, error } = await supabase.rpc('login', {
    p_username: username, p_pin: pin, p_color: color,
  });
  if (error) return { error: error.message || 'Login failed.' };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: 'Login failed.' };

  currentPlayer.id = row.id;
  currentPlayer.name = row.name;
  currentPlayer.color = row.color;
  balance = Number(row.balance);
  return true;
}

function friendly(msg) {
  if (/wrong pin/i.test(msg)) return 'Wrong PIN for that name. Try again, or pick another name.';
  if (/pin too short/i.test(msg)) return 'PIN must be at least 4 characters.';
  return msg;
}

// Tapping the name chip logs out / switches account.
function wireLogout() {
  const chip = nameDisplay.parentElement || nameDisplay;
  chip.style.cursor = 'pointer';
  chip.title = 'Log out / switch account';
  chip.addEventListener('click', () => {
    if (confirm('Log out and switch account?')) {
      localStorage.removeItem(NAME_KEY);
      localStorage.removeItem(PIN_KEY);
      location.reload();
    }
  });
}

// Establish the account before the board loads: auto-login from saved creds,
// otherwise prompt until a valid login/sign-up succeeds.
export async function initIdentity() {
  let username = localStorage.getItem(NAME_KEY);
  let pin = localStorage.getItem(PIN_KEY);
  let result = false;

  if (username && pin) {
    result = await tryLogin(username, pin);
  }

  while (result !== true) {
    const creds = await askLogin(result && result.error ? friendly(result.error) : '');
    result = await tryLogin(creds.username, creds.pin);
    if (result === true) {
      username = creds.username;
      pin = creds.pin;
      localStorage.setItem(NAME_KEY, username);
      localStorage.setItem(PIN_KEY, pin);
    }
  }

  nickModal.classList.remove('visible');
  wireLogout();
  emitBalance();
}

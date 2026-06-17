// Player identity + coin wallet.
//
// Each device is one player: a uuid + nickname + color saved in localStorage,
// mirrored to the shared `players` table (so the leaderboard and other players
// can see names). The coin balance lives on the players row when Supabase is
// configured, otherwise locally. v1 is client-trusted — the real-money phase
// will move balance changes to a server-authoritative RPC.
import { supabase, isSupabaseConfigured } from './supabase.js';
import { STARTING_BALANCE, colorForId } from './config.js';
import { nickModal, nickInput, nickBtn } from './dom.js';

const ID_KEY = 'lg_player_id';
const NAME_KEY = 'lg_player_name';
const BAL_KEY = 'lg_balance'; // only used in local-only mode

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

// Show the first-run nickname modal and resolve once a name is entered.
function askNickname(defaultName) {
  return new Promise((resolve) => {
    nickInput.value = defaultName || '';
    nickModal.classList.add('visible');
    const submit = () => {
      const name = (nickInput.value || '').trim().slice(0, 24) || 'Anon';
      nickModal.classList.remove('visible');
      nickBtn.removeEventListener('click', submit);
      resolve(name);
    };
    nickBtn.addEventListener('click', submit);
    nickInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  });
}

// Establish the current player before the board loads. Prompts for a nickname
// on first visit, then creates/loads the shared players row.
export async function initIdentity() {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
  }
  let name = localStorage.getItem(NAME_KEY);
  if (!name) {
    name = await askNickname('');
    localStorage.setItem(NAME_KEY, name);
  }
  const color = colorForId(id);
  currentPlayer.id = id;
  currentPlayer.name = name;
  currentPlayer.color = color;

  if (isSupabaseConfigured) {
    // Load existing row or create one with the starting balance.
    const { data } = await supabase.from('players').select('balance').eq('id', id).maybeSingle();
    if (data) {
      balance = Number(data.balance);
      await supabase.from('players').update({ name, color }).eq('id', id);
    } else {
      balance = STARTING_BALANCE;
      await supabase.from('players').insert({ id, name, color, balance });
    }
  } else {
    balance = Number(localStorage.getItem(BAL_KEY) ?? STARTING_BALANCE);
  }
  emitBalance();
}

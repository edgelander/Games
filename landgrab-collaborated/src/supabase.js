// Supabase client — the shared backend that lets plots persist and sync
// between players. Keys come from environment variables (see .env.example).
//
// Until you add those keys to .env.local, the game still runs but in
// "local-only" mode (plots won't be shared or saved across devices).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;

if (!isSupabaseConfigured) {
  console.warn(
    '[LandGrab] Supabase not configured — running in local-only mode. ' +
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local for the shared canvas.',
  );
}

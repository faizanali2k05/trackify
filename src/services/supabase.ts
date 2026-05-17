/**
 * Supabase client stub.
 *
 * Spendify is offline-first: the local Zustand+MMKV stores are the source of truth
 * for the UI. This module is where the Supabase client gets wired once the user
 * provides keys via env. Background sync hooks should read from local state,
 * push deltas here, and reconcile via Realtime.
 *
 * To activate:
 *   1. `npm install @supabase/supabase-js`
 *   2. set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   3. uncomment the createClient call below
 */

// import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// export const supabase: SupabaseClient | null = isSupabaseConfigured
//   ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
//       auth: { persistSession: true, autoRefreshToken: true },
//     })
//   : null;

export const supabase = null;

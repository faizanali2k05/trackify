/**
 * Supabase client for Trackify.
 *
 * Trackify is offline-first: the local Zustand stores are the source of truth for
 * the UI. Supabase adds cloud auth, sync, and Realtime on top. The app runs fully
 * without it — `supabase` is `null` until you provide credentials.
 *
 * To activate (you only need two values from your Supabase project → Settings → API):
 *   1. Run `database.sql` (repo root) in the Supabase SQL Editor — creates tables + RLS.
 *   2. Put these in your `.env` (both are PUBLIC, safe to ship in the app):
 *        EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *        EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
 *   3. Restart `expo start`.
 *
 * Row Level Security in database.sql guarantees each user can only read/write their
 * own rows, so shipping the anon key is safe.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * The client, or `null` when credentials are absent. Always guard usage:
 *   `if (supabase) { ... }` — so the app keeps working in pure offline mode.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // RN has no URL bar, so there is no OAuth redirect to detect.
        detectSessionInUrl: false,
      },
    })
  : null;

/** Convenience: the current signed-in user id, or null. */
export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env;
// VITE_* wins; NEXT_PUBLIC_* are what Vercel's Supabase integration sets automatically.
const url = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const anonKey = (
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ""
).trim();

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** True when both Supabase env vars are present and well-formed. */
export const isSupabaseConfigured = isValidUrl(url) && anonKey.length > 20;

export const SUPABASE_URL = isSupabaseConfigured ? url.replace(/\/+$/, "") : "";
export const SUPABASE_ANON_KEY = isSupabaseConfigured ? anonKey : "";

/**
 * The browser Supabase client, or `null` when the site runs without Supabase
 * (the public site then uses its built-in default content).
 *
 * Only the public anon key is used here. Never put a service-role key in a
 * VITE_ variable: everything prefixed VITE_ is shipped to the browser.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Use in admin code paths, where Supabase is required. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("supabase_not_configured");
  }
  return supabase;
}

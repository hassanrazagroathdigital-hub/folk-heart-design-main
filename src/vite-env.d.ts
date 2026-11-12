/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcd1234.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon / publishable key. Safe to expose; RLS is the security boundary. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Set automatically by Vercel's Supabase integration (fallbacks for the above). */
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

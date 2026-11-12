import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DEFAULT_SETTINGS } from "./defaults";
import {
  fetchPublicCategories,
  fetchPublicFaqs,
  fetchPublicProducts,
  fetchPublicSettings,
  mergeSettings,
} from "./queries";
import type { SiteSettings } from "./types";

/** React Query keys. Admin mutations invalidate these so the public site updates. */
export const cmsKeys = {
  all: ["cms"] as const,
  categories: ["cms", "categories"] as const,
  products: ["cms", "products"] as const,
  faqs: ["cms", "faqs"] as const,
  settings: ["cms", "settings"] as const,
};

const PUBLIC_QUERY = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 0, // fetchers never throw; they fall back to defaults instead
} as const;

export function usePublicCategories() {
  return useQuery({ queryKey: cmsKeys.categories, queryFn: fetchPublicCategories, ...PUBLIC_QUERY });
}

export function usePublicProducts() {
  return useQuery({ queryKey: cmsKeys.products, queryFn: fetchPublicProducts, ...PUBLIC_QUERY });
}

export function usePublicFaqs() {
  return useQuery({ queryKey: cmsKeys.faqs, queryFn: fetchPublicFaqs, ...PUBLIC_QUERY });
}

const SETTINGS_CACHE_KEY = "cms:settings:v1";

function readCachedSettings(): SiteSettings | undefined {
  try {
    const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
    return raw ? mergeSettings(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedSettings(settings: SiteSettings) {
  try {
    window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable — fine, it's only a render cache */
  }
}

/**
 * Global site settings, always returning a complete object.
 * The last fetched value is kept in localStorage purely as a render cache so
 * returning visitors don't see default text flash before the fetch finishes;
 * the database stays the source of truth and is re-fetched on every load.
 */
export function useSiteSettings(): SiteSettings {
  const { data } = useQuery({
    queryKey: cmsKeys.settings,
    queryFn: async () => {
      const settings = await fetchPublicSettings();
      if (isSupabaseConfigured) writeCachedSettings(settings);
      return settings;
    },
    placeholderData: () => (isSupabaseConfigured ? readCachedSettings() : undefined),
    ...PUBLIC_QUERY,
  });
  return data ?? DEFAULT_SETTINGS;
}

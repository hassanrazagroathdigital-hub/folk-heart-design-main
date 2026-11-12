/**
 * Public read queries. Every function here:
 *  - returns only published content (RLS enforces this too),
 *  - never throws: on missing config or errors it falls back to built-in content,
 *  - uses built-in defaults for a collection only when the database has never
 *    had any records in it (so unpublishing everything really hides everything).
 */
import { supabase } from "@/lib/supabase/client";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_FAQS,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
} from "./defaults";
import type {
  Category,
  Faq,
  Product,
  PublicCategory,
  PublicFaq,
  PublicProduct,
  SiteSettings,
} from "./types";
import { deepMerge } from "./utils";

export type ContentStatus = { products: boolean; categories: boolean; faqs: boolean };

let statusCache: { at: number; promise: Promise<ContentStatus | null> } | null = null;

/** Whether each collection has any rows at all (published or not). Cached for 60s. */
async function getContentStatus(): Promise<ContentStatus | null> {
  if (!supabase) return null;
  if (statusCache && Date.now() - statusCache.at < 60_000) return statusCache.promise;
  const promise = (async () => {
    const { data, error } = await supabase.rpc("cms_content_status");
    if (error) throw error;
    return data as ContentStatus;
  })().catch((err) => {
    statusCache = null;
    warn("content status", err);
    return null;
  });
  statusCache = { at: Date.now(), promise };
  return promise;
}

export function resetContentStatusCache() {
  statusCache = null;
}

function warn(what: string, err: unknown) {
  if (import.meta.env.DEV) console.warn(`[cms] could not load ${what}; using built-in content`, err);
}

/** Resolve rows vs. defaults per the fallback rules above. */
async function resolve<T>(
  rows: T[],
  key: keyof ContentStatus,
  defaults: T[],
): Promise<T[]> {
  if (rows.length > 0) return rows;
  const status = await getContentStatus();
  // status null → couldn't tell; be safe and show defaults rather than an empty shop.
  if (!status || !status[key]) return defaults;
  return [];
}

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  if (!supabase) return DEFAULT_CATEGORIES;
  try {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    const rows = (data as Category[]).map<PublicCategory>((c) => ({ ...c, _source: "database" }));
    return resolve(rows, "categories", DEFAULT_CATEGORIES);
  } catch (err) {
    warn("categories", err);
    return DEFAULT_CATEGORIES;
  }
}

type ProductRow = Product & { category: Pick<Category, "name" | "slug" | "published"> | null };

export async function fetchPublicProducts(): Promise<PublicProduct[]> {
  if (!supabase) return DEFAULT_PRODUCTS;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:product_categories(name, slug, published)")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data as ProductRow[]).map<PublicProduct>(({ category, ...p }) => ({
      ...p,
      gallery_images: p.gallery_images ?? [],
      price: p.price === null ? null : Number(p.price),
      sale_price: p.sale_price === null ? null : Number(p.sale_price),
      category_name: category?.published ? category.name : null,
      category_slug: category?.published ? category.slug : null,
      _source: "database",
    }));
    return resolve(rows, "products", DEFAULT_PRODUCTS);
  } catch (err) {
    warn("products", err);
    return DEFAULT_PRODUCTS;
  }
}

export async function fetchPublicFaqs(): Promise<PublicFaq[]> {
  if (!supabase) return DEFAULT_FAQS;
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const rows = (data as Faq[]).map<PublicFaq>((f) => ({ ...f, _source: "database" }));
    return resolve(rows, "faqs", DEFAULT_FAQS);
  } catch (err) {
    warn("FAQs", err);
    return DEFAULT_FAQS;
  }
}

/** Raw stored settings (no defaults merged). Admin uses this to know what's saved. */
export async function fetchStoredSettings(): Promise<Partial<SiteSettings>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error) throw error;
  return (data?.data as Partial<SiteSettings>) ?? {};
}

export function mergeSettings(stored: unknown): SiteSettings {
  const merged = deepMerge(DEFAULT_SETTINGS, stored);
  // Story members is an array: if stored but empty/invalid, keep it as stored (admin intent),
  // but make sure each member has every field.
  merged.story.members = (Array.isArray(merged.story.members) ? merged.story.members : []).map((m) => ({
    heading: "",
    body: "",
    image_url: "",
    image_alt: "",
    ...(m ?? {}),
  }));
  return merged;
}

export async function fetchPublicSettings(): Promise<SiteSettings> {
  if (!supabase) return DEFAULT_SETTINGS;
  try {
    return mergeSettings(await fetchStoredSettings());
  } catch (err) {
    warn("site settings", err);
    return DEFAULT_SETTINGS;
  }
}

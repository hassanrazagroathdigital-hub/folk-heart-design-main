/**
 * Public fallback rules, using a mocked Supabase client:
 *  - DB rows are used as-is (never mixed with defaults)
 *  - empty table that has never had rows → defaults
 *  - empty result but rows exist (all unpublished) → empty, not defaults
 *  - query error → defaults, no throw
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data: unknown; error: unknown };
const state: { tables: Record<string, Result>; status: Result; rpcCalls: string[] } = {
  tables: {},
  status: { data: { products: false, categories: false, faqs: false }, error: null },
  rpcCalls: [],
};

function builder(table: string) {
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "in", "neq", "limit"]) chain[m] = () => chain;
  chain.maybeSingle = () => Promise.resolve(state.tables[table] ?? { data: null, error: null });
  chain.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(state.tables[table] ?? { data: [], error: null }).then(resolve, reject);
  return chain;
}

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (t: string) => builder(t),
    rpc: (fn: string) => {
      state.rpcCalls.push(fn);
      return Promise.resolve(state.status);
    },
  },
  requireSupabase: () => {
    throw new Error("not used");
  },
}));

const { fetchPublicProducts, fetchPublicFaqs, fetchPublicSettings, resetContentStatusCache } = await import("@/lib/cms/queries");
const { DEFAULT_PRODUCTS, DEFAULT_FAQS, DEFAULT_SETTINGS } = await import("@/lib/cms/defaults");

const row = {
  id: "3f2b8a7e-1c2d-4e5f-9a0b-123456789abc",
  name: "From DB",
  slug: "from-db",
  description: "",
  category_id: null,
  featured_image: "https://x.supabase.co/storage/v1/object/public/cms-media/products/a.webp",
  gallery_images: [],
  price: "45.00",
  sale_price: null,
  sku: null,
  quantity: 1,
  stock_status: "available",
  featured: false,
  sort_order: 10,
  published: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  category: { name: "Quilts", slug: "quilts", published: true },
};

beforeEach(() => {
  state.tables = {};
  state.status = { data: { products: false, categories: false, faqs: false }, error: null };
  state.rpcCalls = [];
  resetContentStatusCache();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("public content fallback", () => {
  it("uses database rows only, never mixed with defaults", async () => {
    state.tables.products = { data: [row], error: null };
    const out = await fetchPublicProducts();
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: "From DB", _source: "database", price: 45, category_name: "Quilts" });
    expect(state.rpcCalls).toEqual([]);
  });

  it("uses defaults when the table has never had rows", async () => {
    state.tables.products = { data: [], error: null };
    const out = await fetchPublicProducts();
    expect(out).toBe(DEFAULT_PRODUCTS);
  });

  it("shows nothing (not defaults) when rows exist but none are published", async () => {
    state.tables.faqs = { data: [], error: null };
    state.status = { data: { products: true, categories: true, faqs: true }, error: null };
    expect(await fetchPublicFaqs()).toEqual([]);
  });

  it("falls back to defaults on a database error instead of throwing", async () => {
    state.tables.products = { data: null, error: { message: "boom" } };
    await expect(fetchPublicProducts()).resolves.toBe(DEFAULT_PRODUCTS);
    state.tables.faqs = { data: null, error: { message: "boom" } };
    await expect(fetchPublicFaqs()).resolves.toBe(DEFAULT_FAQS);
  });

  it("hides a product's category name when that category is unpublished", async () => {
    state.tables.products = { data: [{ ...row, category: { name: "Hidden", slug: "hidden", published: false } }], error: null };
    const [p] = await fetchPublicProducts();
    expect(p.category_name).toBeNull();
  });

  it("merges stored settings over defaults and survives errors", async () => {
    state.tables.site_settings = { data: { data: { hero: { headline: "New headline" } } }, error: null };
    const s = await fetchPublicSettings();
    expect(s.hero.headline).toBe("New headline");
    expect(s.hero.body).toBe(DEFAULT_SETTINGS.hero.body);

    state.tables.site_settings = { data: null, error: { message: "down" } };
    expect(await fetchPublicSettings()).toBe(DEFAULT_SETTINGS);
  });
});

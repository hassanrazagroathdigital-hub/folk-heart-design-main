import { describe, expect, it } from "vitest";
import {
  computeReorder,
  deepMerge,
  isPersistedId,
  safeHref,
  slugify,
  SLUG_PATTERN,
  toParagraphs,
  withYear,
} from "@/lib/cms/utils";
import { DEFAULT_CATEGORIES, DEFAULT_FAQS, DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from "@/lib/cms/defaults";
import { planSeed } from "@/lib/cms/seed";
import { buildStoragePath, storagePathFromUrl, validateImageFile } from "@/lib/cms/storage";
import { friendlyError } from "@/lib/cms/errors";
import { sanitizeSearch } from "@/lib/cms/admin";
import { mergeSettings } from "@/lib/cms/queries";

describe("slugify", () => {
  it("produces DB-valid slugs", () => {
    expect(slugify("Mama & Mini Bird Apron Set")).toBe("mama-and-mini-bird-apron-set");
    expect(slugify("Bug's Life Quilt")).toBe("bugs-life-quilt");
    expect(slugify("Teacher Apron — Sesame Street")).toBe("teacher-apron-sesame-street");
    expect(slugify("  Crème Brûlée!! ")).toBe("creme-brulee");
    for (const s of ["a", "Hello World", "x--y", "-lead", "trail-"]) {
      expect(slugify(s)).toMatch(SLUG_PATTERN);
    }
  });
});

describe("isPersistedId", () => {
  it("accepts UUIDs only", () => {
    expect(isPersistedId("3f2b8a7e-1c2d-4e5f-9a0b-123456789abc")).toBe(true);
    expect(isPersistedId("default:product:abc")).toBe(false);
    expect(isPersistedId(undefined)).toBe(false);
  });
});

describe("deepMerge", () => {
  it("merges nested objects, replaces arrays, ignores null/undefined", () => {
    const base = { a: { x: 1, y: 2 }, list: [1, 2], keep: "k" };
    const out = deepMerge(base, { a: { y: 3 }, list: [9], keep: null, extra: true });
    expect(out).toEqual({ a: { x: 1, y: 3 }, list: [9], keep: "k", extra: true });
    expect(base.a.y).toBe(2); // not mutated
  });

  it("fills missing settings from defaults", () => {
    const s = mergeSettings({ contact: { email: "new@example.com" }, story: { members: [{ heading: "Only" }] } });
    expect(s.contact.email).toBe("new@example.com");
    expect(s.contact.instagram_handle).toBe(DEFAULT_SETTINGS.contact.instagram_handle);
    expect(s.hero.headline).toBe(DEFAULT_SETTINGS.hero.headline);
    expect(s.story.members).toHaveLength(1);
    expect(s.story.members[0]).toEqual({ heading: "Only", body: "", image_url: "", image_alt: "" });
  });
});

describe("computeReorder", () => {
  const rows = [
    { id: "a", sort_order: 10 },
    { id: "b", sort_order: 20 },
    { id: "c", sort_order: 30 },
  ];
  it("swaps neighbours", () => {
    expect(computeReorder(rows, 1, "up")).toEqual([
      { id: "b", sort_order: 10 },
      { id: "a", sort_order: 20 },
    ]);
  });
  it("is a no-op at the edges", () => {
    expect(computeReorder(rows, 0, "up")).toEqual([]);
    expect(computeReorder(rows, 2, "down")).toEqual([]);
  });
  it("renumbers when values tie", () => {
    const tied = [
      { id: "a", sort_order: 0 },
      { id: "b", sort_order: 0 },
      { id: "c", sort_order: 0 },
    ];
    const updates = computeReorder(tied, 2, "up");
    const final = new Map(tied.map((r) => [r.id, r.sort_order]));
    for (const u of updates) final.set(u.id, u.sort_order);
    expect([...final.entries()].sort((x, y) => x[1] - y[1]).map(([id]) => id)).toEqual(["a", "c", "b"]);
  });
});

describe("small helpers", () => {
  it("withYear / toParagraphs / safeHref", () => {
    expect(withYear("© {year} X")).toBe(`© ${new Date().getFullYear()} X`);
    expect(toParagraphs("one\n\n two \n\n\nthree")).toEqual(["one", "two", "three"]);
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("https://x.com")).toBe("https://x.com");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  it("sanitizeSearch strips PostgREST syntax", () => {
    expect(sanitizeSearch("a,b(c)*%d:e")).toBe("a b c d e");
  });
});

describe("default content", () => {
  it("has valid unique slugs and non-persisted ids", () => {
    for (const list of [DEFAULT_PRODUCTS, DEFAULT_CATEGORIES]) {
      const slugs = list.map((x) => x.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of slugs) expect(s).toMatch(SLUG_PATTERN);
    }
    for (const r of [...DEFAULT_PRODUCTS, ...DEFAULT_CATEGORIES, ...DEFAULT_FAQS]) {
      expect(isPersistedId(r.id)).toBe(false);
      expect(r._source).toBe("default");
    }
  });
  it("keeps every original product, each in a known category", () => {
    expect(DEFAULT_PRODUCTS).toHaveLength(36);
    const names = new Set(DEFAULT_CATEGORIES.map((c) => c.name));
    for (const p of DEFAULT_PRODUCTS) {
      expect(names.has(p.category_name!)).toBe(true);
      expect(p.gallery_images.length).toBeGreaterThan(0);
    }
    expect(DEFAULT_PRODUCTS.filter((p) => p.stock_status === "available")).toHaveLength(5);
  });
});

describe("planSeed (non-destructive)", () => {
  it("only plans items that are missing", () => {
    const existing = {
      categorySlugs: new Set(["quilts"]),
      productSlugs: new Set([DEFAULT_PRODUCTS[0].slug]),
      faqQuestions: new Set([DEFAULT_FAQS[0].question.toLowerCase()]),
    };
    const plan = planSeed(existing);
    expect(plan.categories.map((c) => c.slug)).not.toContain("quilts");
    expect(plan.categories).toHaveLength(DEFAULT_CATEGORIES.length - 1);
    expect(plan.products).toHaveLength(DEFAULT_PRODUCTS.length - 1);
    expect(plan.faqs).toHaveLength(DEFAULT_FAQS.length - 1);
  });
  it("plans nothing when everything exists", () => {
    const plan = planSeed({
      categorySlugs: new Set(DEFAULT_CATEGORIES.map((c) => c.slug)),
      productSlugs: new Set(DEFAULT_PRODUCTS.map((p) => p.slug)),
      faqQuestions: new Set(DEFAULT_FAQS.map((f) => f.question.toLowerCase())),
    });
    expect(plan.categories.length + plan.products.length + plan.faqs.length).toBe(0);
  });
});

describe("storage helpers", () => {
  it("validates image files", () => {
    expect(validateImageFile({ name: "a.jpg", type: "image/jpeg", size: 1000 })).toBeNull();
    expect(validateImageFile({ name: "a.svg", type: "image/svg+xml", size: 1000 })).toMatch(/supported/);
    expect(validateImageFile({ name: "a.exe", type: "application/x-msdownload", size: 1000 })).toMatch(/supported/);
    expect(validateImageFile({ name: "a.png", type: "image/png", size: 0 })).toMatch(/empty/);
    expect(validateImageFile({ name: "a.png", type: "image/png", size: 100 * 1024 * 1024 })).toMatch(/too large/);
  });
  it("builds unique, safe paths and parses public URLs", () => {
    const p = buildStoragePath("products", "My Photo (1).JPG", "image/jpeg");
    expect(p).toMatch(/^products\/\d+-[a-z0-9]+-my-photo-1\.jpg$/);
    expect(storagePathFromUrl("https://x.supabase.co/storage/v1/object/public/cms-media/products/a%20b.webp?v=1")).toBe("products/a b.webp");
    expect(storagePathFromUrl("https://example.com/other.jpg")).toBeNull();
    expect(storagePathFromUrl("/assets/aprons1.jpg")).toBeNull();
  });
});

describe("friendlyError", () => {
  it("maps DB errors to readable messages without leaking details", () => {
    expect(friendlyError({ code: "23505", message: 'duplicate key value violates unique constraint "products_slug_key"' })).toMatch(/slug is already used/);
    expect(friendlyError({ code: "42501", message: "permission denied for table products" })).toMatch(/permission/);
    expect(friendlyError({ message: "rate_limited" })).toMatch(/Too many/);
    expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(/internet connection/);
    expect(friendlyError({ message: "some internal pg detail" }, "Fallback")).toBe("Fallback");
  });
});

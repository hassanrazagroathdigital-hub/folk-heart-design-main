/**
 * Optional, NON-DESTRUCTIVE import of the site's original content into Supabase.
 *
 *  - Runs only when an admin clicks "Import starter content".
 *  - Never deletes or updates existing rows.
 *  - Inserts only categories/products whose slug doesn't exist yet, and FAQs
 *    whose question text doesn't exist yet — so admin edits are preserved and
 *    it's safe to run again (e.g. after a partial failure).
 *  - Copies bundled images into the cms-media bucket so records don't depend
 *    on build-specific asset URLs.
 */
import { requireSupabase } from "@/lib/supabase/client";
import { DEFAULT_CATEGORIES, DEFAULT_FAQS, DEFAULT_PRODUCTS } from "./defaults";
import { resetContentStatusCache } from "./queries";
import { uploadImage, type MediaFolder } from "./storage";
import type { PublicCategory, PublicFaq, PublicProduct } from "./types";

export interface SeedPlan {
  categories: PublicCategory[];
  products: PublicProduct[];
  faqs: PublicFaq[];
}

export interface ExistingContent {
  categorySlugs: Set<string>;
  productSlugs: Set<string>;
  faqQuestions: Set<string>;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Pure: decide what's missing. */
export function planSeed(existing: ExistingContent): SeedPlan {
  return {
    categories: DEFAULT_CATEGORIES.filter((c) => !existing.categorySlugs.has(c.slug)),
    products: DEFAULT_PRODUCTS.filter((p) => !existing.productSlugs.has(p.slug)),
    faqs: DEFAULT_FAQS.filter((f) => !existing.faqQuestions.has(norm(f.question))),
  };
}

export async function fetchExistingContent(): Promise<ExistingContent> {
  const c = requireSupabase();
  const [cats, prods, faqs] = await Promise.all([
    c.from("product_categories").select("slug"),
    c.from("products").select("slug"),
    c.from("faqs").select("question"),
  ]);
  for (const r of [cats, prods, faqs]) if (r.error) throw r.error;
  return {
    categorySlugs: new Set((cats.data ?? []).map((r) => r.slug)),
    productSlugs: new Set((prods.data ?? []).map((r) => r.slug)),
    faqQuestions: new Set((faqs.data ?? []).map((r) => norm(r.question))),
  };
}

export interface SeedProgress {
  done: number;
  total: number;
  label: string;
}

export interface SeedReport {
  categories: number;
  products: number;
  faqs: number;
  skipped: number;
  errors: string[];
}

export async function runSeed(onProgress: (p: SeedProgress) => void): Promise<SeedReport> {
  const c = requireSupabase();
  const existing = await fetchExistingContent();
  const plan = planSeed(existing);
  const report: SeedReport = {
    categories: 0,
    products: 0,
    faqs: 0,
    skipped:
      DEFAULT_CATEGORIES.length - plan.categories.length +
      DEFAULT_PRODUCTS.length - plan.products.length +
      DEFAULT_FAQS.length - plan.faqs.length,
    errors: [],
  };
  const total = plan.categories.length + plan.products.length + (plan.faqs.length ? 1 : 0);
  let done = 0;
  const step = (label: string) => onProgress({ done, total, label });

  // Upload each bundled image once, even if several records use it.
  const uploaded = new Map<string, Promise<string>>();
  const copyImage = (src: string, folder: MediaFolder) => {
    if (!uploaded.has(src)) {
      uploaded.set(
        src,
        (async () => {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`Could not read bundled image ${src}`);
          const blob = await res.blob();
          const name = src.split("/").pop()?.split("?")[0] ?? "image.jpg";
          const file = new File([blob], name, { type: blob.type || "image/jpeg" });
          return (await uploadImage(file, folder)).url;
        })(),
      );
    }
    return uploaded.get(src)!;
  };

  for (const cat of plan.categories) {
    step(`Collection: ${cat.name}`);
    try {
      const image_url = cat.image_url ? await copyImage(cat.image_url, "collections") : null;
      const { error } = await c.from("product_categories").insert({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image_url,
        sort_order: cat.sort_order,
        published: true,
      });
      if (error && error.code !== "23505") throw error; // 23505: created meanwhile → fine
      if (!error) report.categories++;
    } catch (err) {
      report.errors.push(`Collection "${cat.name}": ${(err as Error).message}`);
    }
    done++;
  }

  // Resolve category ids by slug (including ones that already existed).
  const { data: catRows, error: catErr } = await c.from("product_categories").select("id, slug");
  if (catErr) throw catErr;
  const catId = new Map((catRows ?? []).map((r) => [r.slug, r.id as string]));

  for (const p of plan.products) {
    step(`Product: ${p.name}`);
    try {
      const gallery: string[] = [];
      for (const src of p.gallery_images) gallery.push(await copyImage(src, "products"));
      const { error } = await c.from("products").insert({
        name: p.name,
        slug: p.slug,
        description: p.description,
        category_id: p.category_slug ? catId.get(p.category_slug) ?? null : null,
        featured_image: gallery[0] ?? null,
        gallery_images: gallery,
        stock_status: p.stock_status,
        quantity: p.quantity,
        featured: false,
        sort_order: p.sort_order,
        published: true,
      });
      if (error && error.code !== "23505") throw error;
      if (!error) report.products++;
    } catch (err) {
      report.errors.push(`Product "${p.name}": ${(err as Error).message}`);
    }
    done++;
  }

  if (plan.faqs.length) {
    step("FAQs");
    const { error } = await c.from("faqs").insert(
      plan.faqs.map((f) => ({ question: f.question, answer: f.answer, sort_order: f.sort_order, published: true })),
    );
    if (error) report.errors.push(`FAQs: ${error.message}`);
    else report.faqs = plan.faqs.length;
    done++;
  }

  onProgress({ done: total, total, label: "Done" });
  resetContentStatusCache();
  return report;
}

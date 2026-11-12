/**
 * Admin data access. Everything here talks to the real database only — no
 * defaults, no fallbacks. An empty table shows an empty state in the UI.
 * RLS on the server is what actually enforces admin-only access.
 */
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { requireSupabase } from "@/lib/supabase/client";
import { cmsKeys } from "./hooks";
import { fetchStoredSettings, resetContentStatusCache } from "./queries";
import { listMedia, storagePathFromUrl } from "./storage";
import type {
  Category,
  Faq,
  Inquiry,
  InquiryStatus,
  InquiryType,
  Product,
  SettingsSection,
  SiteSettings,
} from "./types";
import { assertPersistedId } from "./utils";

export type ContentTable = "products" | "product_categories" | "faqs";
type RowFor<T extends ContentTable> = T extends "products"
  ? Product
  : T extends "product_categories"
    ? Category
    : Faq;

export const adminKeys = {
  all: ["admin"] as const,
  list: (table: ContentTable) => ["admin", "list", table] as const,
  stats: ["admin", "stats"] as const,
  inquiries: ["admin", "inquiries"] as const,
  inquiryList: (params: InquiryListParams) => ["admin", "inquiries", "list", params] as const,
  unread: ["admin", "inquiries", "unread"] as const,
  settings: ["admin", "settings"] as const,
  media: ["admin", "media"] as const,
  mediaUsage: ["admin", "media", "usage"] as const,
};

const ADMIN_QUERY = { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } as const;

// ---------------------------------------------------------------------------
// Generic content CRUD
// ---------------------------------------------------------------------------

export async function fetchAdminList<T extends ContentTable>(table: T): Promise<RowFor<T>[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RowFor<T>[];
}

export function useAdminList<T extends ContentTable>(table: T) {
  return useQuery({ queryKey: adminKeys.list(table), queryFn: () => fetchAdminList(table), ...ADMIN_QUERY });
}

/** Invalidate admin views and the public site's cached content. */
function useInvalidateContent() {
  const qc = useQueryClient();
  return () => {
    resetContentStatusCache();
    return Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "list"] }),
      qc.invalidateQueries({ queryKey: adminKeys.stats }),
      qc.invalidateQueries({ queryKey: adminKeys.mediaUsage }),
      qc.invalidateQueries({ queryKey: cmsKeys.all }),
    ]);
  };
}

export function useSaveRecord<T extends ContentTable>(table: T) {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | null; values: Partial<RowFor<T>> }) => {
      const client = requireSupabase();
      // Never send server-managed columns.
      const { id: _i, created_at: _c, updated_at: _u, ...clean } = values as Record<string, unknown>;
      if (id) {
        assertPersistedId(id);
        const { data, error } = await client.from(table).update(clean).eq("id", id).select().single();
        if (error) throw error;
        return data as RowFor<T>;
      }
      const { data, error } = await client.from(table).insert(clean).select().single();
      if (error) throw error;
      return data as RowFor<T>;
    },
    onSuccess: () => invalidate(),
  });
}

export function useDeleteRecord(table: ContentTable) {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async (id: string) => {
      assertPersistedId(id);
      const { error, count } = await requireSupabase()
        .from(table)
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw error;
      if (count === 0) throw new Error("not_authorized");
    },
    onSuccess: () => invalidate(),
  });
}

export function useReorder(table: ContentTable) {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async (updates: Array<{ id: string; sort_order: number }>) => {
      const client = requireSupabase();
      const results = await Promise.all(
        updates.map((u) => {
          assertPersistedId(u.id);
          return client.from(table).update({ sort_order: u.sort_order }).eq("id", u.id);
        }),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSettled: () => invalidate(),
  });
}

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------

export interface InquiryListParams {
  page: number;
  pageSize: number;
  status: InquiryStatus | "all" | "open";
  read: "all" | "unread" | "read";
  type: InquiryType | "all";
  search: string;
}

/** Strip characters that have meaning in PostgREST filter syntax. */
export function sanitizeSearch(term: string): string {
  return term.replace(/[,()*%\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

export async function fetchInquiries(params: InquiryListParams) {
  const client = requireSupabase();
  let q = client.from("inquiries").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (params.status === "open") q = q.in("status", ["new", "in_progress"]);
  else if (params.status !== "all") q = q.eq("status", params.status);
  if (params.read === "unread") q = q.eq("is_read", false);
  if (params.read === "read") q = q.eq("is_read", true);
  if (params.type !== "all") q = q.eq("type", params.type);
  const s = sanitizeSearch(params.search);
  if (s) {
    q = q.or(`name.ilike.*${s}*,email.ilike.*${s}*,subject.ilike.*${s}*,message.ilike.*${s}*`);
  }
  const from = (params.page - 1) * params.pageSize;
  const { data, error, count } = await q.range(from, from + params.pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as Inquiry[], total: count ?? 0 };
}

export function useInquiries(params: InquiryListParams) {
  return useQuery({
    queryKey: adminKeys.inquiryList(params),
    queryFn: () => fetchInquiries(params),
    placeholderData: keepPreviousData,
    ...ADMIN_QUERY,
  });
}

export function useUnreadInquiryCount(enabled = true) {
  return useQuery({
    queryKey: adminKeys.unread,
    enabled,
    queryFn: async () => {
      const { count, error } = await requireSupabase()
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("status", "spam");
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
    ...ADMIN_QUERY,
  });
}

function useInvalidateInquiries() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: adminKeys.inquiries }),
      qc.invalidateQueries({ queryKey: adminKeys.stats }),
    ]);
}

export function useUpdateInquiry() {
  const invalidate = useInvalidateInquiries();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Inquiry, "status" | "is_read">> }) => {
      assertPersistedId(id);
      const { data, error } = await requireSupabase()
        .from("inquiries")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Inquiry;
    },
    onSuccess: () => invalidate(),
  });
}

export function useDeleteInquiry() {
  const invalidate = useInvalidateInquiries();
  return useMutation({
    mutationFn: async (id: string) => {
      assertPersistedId(id);
      const { error, count } = await requireSupabase()
        .from("inquiries")
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw error;
      if (count === 0) throw new Error("not_authorized");
    },
    onSuccess: () => invalidate(),
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  products: { total: number; published: number; drafts: number; available: number };
  categories: { total: number; published: number };
  faqs: { total: number; published: number };
  inquiries: { total: number; unread: number; open: number };
  recentContent: Array<{ id: string; kind: "Product" | "Collection" | "FAQ"; title: string; updated_at: string; published: boolean; href: string }>;
  recentInquiries: Inquiry[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const c = requireSupabase();
  const head = { count: "exact" as const, head: true };
  const counted = async (p: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count, error } = await p;
    if (error) throw error;
    return count ?? 0;
  };
  const [
    pTotal, pPub, pAvail, cTotal, cPub, fTotal, fPub, iTotal, iUnread, iOpen,
    recentProducts, recentCats, recentFaqs, recentInq,
  ] = await Promise.all([
    counted(c.from("products").select("id", head)),
    counted(c.from("products").select("id", head).eq("published", true)),
    counted(c.from("products").select("id", head).eq("published", true).eq("stock_status", "available")),
    counted(c.from("product_categories").select("id", head)),
    counted(c.from("product_categories").select("id", head).eq("published", true)),
    counted(c.from("faqs").select("id", head)),
    counted(c.from("faqs").select("id", head).eq("published", true)),
    counted(c.from("inquiries").select("id", head).neq("status", "spam")),
    counted(c.from("inquiries").select("id", head).eq("is_read", false).neq("status", "spam")),
    counted(c.from("inquiries").select("id", head).in("status", ["new", "in_progress"])),
    c.from("products").select("id, name, updated_at, published").order("updated_at", { ascending: false }).limit(5),
    c.from("product_categories").select("id, name, updated_at, published").order("updated_at", { ascending: false }).limit(5),
    c.from("faqs").select("id, question, updated_at, published").order("updated_at", { ascending: false }).limit(5),
    c.from("inquiries").select("*").neq("status", "spam").order("created_at", { ascending: false }).limit(5),
  ]);
  for (const r of [recentProducts, recentCats, recentFaqs, recentInq]) if (r.error) throw r.error;

  const recentContent: DashboardStats["recentContent"] = [
    ...(recentProducts.data ?? []).map((r) => ({ id: r.id, kind: "Product" as const, title: r.name, updated_at: r.updated_at, published: r.published, href: "/admin/products" })),
    ...(recentCats.data ?? []).map((r) => ({ id: r.id, kind: "Collection" as const, title: r.name, updated_at: r.updated_at, published: r.published, href: "/admin/collections" })),
    ...(recentFaqs.data ?? []).map((r) => ({ id: r.id, kind: "FAQ" as const, title: r.question, updated_at: r.updated_at, published: r.published, href: "/admin/faqs" })),
  ]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 6);

  return {
    products: { total: pTotal, published: pPub, drafts: pTotal - pPub, available: pAvail },
    categories: { total: cTotal, published: cPub },
    faqs: { total: fTotal, published: fPub },
    inquiries: { total: iTotal, unread: iUnread, open: iOpen },
    recentContent,
    recentInquiries: (recentInq.data ?? []) as Inquiry[],
  };
}

export function useDashboardStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: fetchDashboardStats, ...ADMIN_QUERY });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function useStoredSettings() {
  return useQuery({ queryKey: adminKeys.settings, queryFn: fetchStoredSettings, ...ADMIN_QUERY, refetchOnWindowFocus: false });
}

/** Save one settings section. Server deep-merges it, so other sections are untouched. */
export function useSaveSettingsSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ section, values }: { section: SettingsSection; values: SiteSettings[SettingsSection] }) => {
      const { data, error } = await requireSupabase().rpc("merge_site_settings", { patch: { [section]: values } });
      if (error) throw error;
      return data as Partial<SiteSettings>;
    },
    onSuccess: (data) => {
      qc.setQueryData(adminKeys.settings, data);
      qc.invalidateQueries({ queryKey: cmsKeys.settings });
      qc.invalidateQueries({ queryKey: adminKeys.mediaUsage });
    },
  });
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export function useMediaFiles() {
  return useQuery({ queryKey: adminKeys.media, queryFn: listMedia, ...ADMIN_QUERY });
}

/** Map of storage path → human-readable list of places that use it. */
export async function fetchMediaUsage(): Promise<Record<string, string[]>> {
  const c = requireSupabase();
  const [products, categories, settings] = await Promise.all([
    c.from("products").select("name, featured_image, gallery_images"),
    c.from("product_categories").select("name, image_url"),
    fetchStoredSettings(),
  ]);
  if (products.error) throw products.error;
  if (categories.error) throw categories.error;

  const usage: Record<string, string[]> = {};
  const add = (url: string | null | undefined, where: string) => {
    const path = storagePathFromUrl(url);
    if (!path) return;
    const list = (usage[path] ??= []);
    if (!list.includes(where)) list.push(where);
  };
  for (const p of products.data ?? []) {
    add(p.featured_image, `Product: ${p.name}`);
    for (const g of p.gallery_images ?? []) add(g, `Product: ${p.name}`);
  }
  for (const cat of categories.data ?? []) add(cat.image_url, `Collection: ${cat.name}`);
  const walk = (value: unknown, trail: string) => {
    if (typeof value === "string") add(value, `Settings: ${trail}`);
    else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${trail} ${i + 1}`));
    else if (value && typeof value === "object")
      for (const [k, v] of Object.entries(value)) walk(v, trail ? `${trail} › ${k}` : k);
  };
  walk(settings, "");
  return usage;
}

export function useMediaUsage() {
  return useQuery({ queryKey: adminKeys.mediaUsage, queryFn: fetchMediaUsage, ...ADMIN_QUERY });
}

/** URL-safe slug: lowercase ASCII words joined by single hyphens (matches the DB check). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True only for ids that came from the database (UUIDs), never for built-in defaults. */
export function isPersistedId(id: unknown): id is string {
  return typeof id === "string" && UUID_PATTERN.test(id);
}

export function assertPersistedId(id: unknown): asserts id is string {
  if (!isPersistedId(id)) {
    throw new Error("not_persisted");
  }
}

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge `patch` into `base`. Objects merge key by key; arrays and scalars
 * from `patch` replace those in `base`. `undefined`/`null` in patch are ignored
 * so missing DB keys fall back to defaults. Mirrors public.jsonb_deep_merge.
 */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined || patch === null ? base : patch) as T;
  }
  const out: PlainObject = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    const current = (base as PlainObject)[key];
    out[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
  }
  return out as T;
}

/**
 * Compute new sort_order values to move item `index` one step up/down.
 * Returns only the rows whose sort_order changes. If neighbouring values are
 * equal (or the list is unevenly numbered) the list is renumbered in steps of 10.
 */
export function computeReorder<T extends { id: string; sort_order: number }>(
  sortedItems: T[],
  index: number,
  direction: "up" | "down",
): Array<{ id: string; sort_order: number }> {
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || index >= sortedItems.length || target < 0 || target >= sortedItems.length) {
    return [];
  }
  const reordered = [...sortedItems];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  const a = sortedItems[index];
  const b = sortedItems[target];
  if (a.sort_order !== b.sort_order) {
    return [
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ];
  }
  // Ties: renumber everything so the order becomes explicit.
  return reordered
    .map((item, i) => ({ id: item.id, sort_order: (i + 1) * 10 }))
    .filter((u) => sortedItems.find((s) => s.id === u.id)?.sort_order !== u.sort_order);
}

export function nextSortOrder(items: Array<{ sort_order: number }>): number {
  return items.reduce((max, i) => Math.max(max, i.sort_order ?? 0), 0) + 10;
}

/** Replace "{year}" in footer text with the current year. */
export function withYear(text: string): string {
  return text.replace(/\{year\}/g, String(new Date().getFullYear()));
}

/** Split text on blank lines into paragraphs. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

/** Ensure an Instagram/handle-ish value has no leading "@". */
export function stripAt(handle: string): string {
  return handle.replace(/^@+/, "");
}

/** Only allow http(s) and mailto/tel links to be rendered from CMS data. */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return undefined;
}

/**
 * Turn Supabase / network / app errors into short, non-technical messages.
 * Raw details are only logged in development, never shown to users.
 */
interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  statusCode?: string | number;
  details?: string;
}

const MESSAGES: Record<string, string> = {
  supabase_not_configured:
    "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and rebuild the site.",
  not_persisted: "This item only exists as built-in default content and can't be changed here.",
  not_authorized: "Your account doesn't have permission to do that.",
  rate_limited: "Too many messages were sent recently. Please wait a little while and try again.",
  invalid_email: "Please enter a valid email address.",
  invalid_name: "Please enter your name.",
  message_too_long: "Your message is too long. Please shorten it and try again.",
  invalid_field: "One of the fields is too long. Please shorten it and try again.",
  invalid_details: "Some details couldn't be sent. Please try again.",
  invalid_type: "Something went wrong submitting the form. Please try again.",
  invalid_settings: "Those settings couldn't be saved. Please check the values and try again.",
  session_expired: "Your session has expired. Please sign in again.",
  network: "Can't reach the server. Check your internet connection and try again.",
};

export function errorCode(err: unknown): string | null {
  if (!err) return null;
  const e = err as ErrorLike;
  const msg = (e.message ?? String(err)).trim();
  if (MESSAGES[msg]) return msg;
  if (e.code === "PGRST301" || /jwt expired|invalid jwt|refresh token/i.test(msg)) return "session_expired";
  if (e.code === "42501" || /row-level security|permission denied/i.test(msg)) return "not_authorized";
  if (e.code === "23505") return "duplicate";
  if (e.code === "PGRST116") return "not_found";
  if (e.code === "23514" || e.code === "22023") return "invalid";
  if (e.code === "23503") return "in_use";
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) return "network";
  if (/payload too large|exceeded the maximum allowed size/i.test(msg) || e.statusCode === "413") return "too_large";
  if (/mime type|invalid_mime/i.test(msg)) return "bad_type";
  return null;
}

export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (import.meta.env.DEV && err) {
    console.warn("[cms]", err);
  }
  const code = errorCode(err);
  if (!code) return fallback;
  if (MESSAGES[code]) return MESSAGES[code];
  const e = err as ErrorLike;
  switch (code) {
    case "duplicate":
      if (/slug/i.test(e.message ?? "") || /slug/i.test(e.details ?? "")) {
        return "That URL slug is already used by another item. Choose a different one.";
      }
      if (/sku/i.test(e.message ?? "")) return "That SKU is already used by another product.";
      return "An item with the same unique value already exists.";
    case "invalid":
      return "Some values are invalid. Please check the form and try again.";
    case "not_found":
      return "That item no longer exists, or you don't have permission to change it.";
    case "in_use":
      return "This item is still referenced by other content.";
    case "too_large":
      return "That file is too large. Images must be 8 MB or smaller.";
    case "bad_type":
      return "That file type isn't allowed. Use JPG, PNG or WebP images.";
    default:
      return fallback;
  }
}

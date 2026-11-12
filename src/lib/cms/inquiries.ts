import { supabase } from "@/lib/supabase/client";
import { friendlyError, errorCode } from "./errors";
import type { InquiryType } from "./types";

/**
 * Existing Formspree endpoint. Kept as the email-notification channel so the
 * owner still gets an email for every inquiry; Supabase is the record of truth.
 */
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgdawap";

/** Hidden field name used as a honeypot. Formspree also treats `_gotcha` as spam. */
export const HONEYPOT_FIELD = "_gotcha";

export interface InquiryInput {
  type: InquiryType;
  name: string;
  email: string;
  message: string;
  phone?: string;
  subject?: string;
  details?: Record<string, string | number>;
}

export class InquiryError extends Error {}

/** Errors that mean "the input was rejected" — don't fall through to Formspree. */
const REJECTIONS = new Set([
  "rate_limited",
  "invalid_email",
  "invalid_name",
  "message_too_long",
  "invalid_field",
  "invalid_details",
]);

export interface SubmitResult {
  savedToCms: boolean;
  emailed: boolean;
}

/**
 * Submit a public form. Saves to Supabase (validated + rate-limited by
 * submit_inquiry) and forwards the original form fields to Formspree for an
 * email notification. Succeeds if at least one channel accepted it.
 */
export async function submitInquiry(input: InquiryInput, form: HTMLFormElement): Promise<SubmitResult> {
  const formData = new FormData(form);
  const honeypot = String(formData.get(HONEYPOT_FIELD) ?? "");

  let savedToCms = false;
  if (supabase) {
    const { error } = await supabase.rpc("submit_inquiry", {
      p_type: input.type,
      p_name: input.name,
      p_email: input.email,
      p_message: input.message,
      p_phone: input.phone ?? null,
      p_subject: input.subject ?? null,
      p_details: input.details ?? {},
      p_honeypot: honeypot || null,
    });
    if (error) {
      const code = errorCode(error);
      if (code && REJECTIONS.has(code)) throw new InquiryError(friendlyError(error));
      if (import.meta.env.DEV) console.warn("[cms] inquiry not saved to Supabase", error);
    } else {
      savedToCms = true;
    }
  }

  if (honeypot) return { savedToCms, emailed: false };

  let emailed = false;
  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
    emailed = res.ok;
  } catch {
    emailed = false;
  }

  if (!savedToCms && !emailed) {
    throw new InquiryError(
      "Sorry, your message couldn't be sent. Please try again, or email us directly.",
    );
  }
  return { savedToCms, emailed };
}

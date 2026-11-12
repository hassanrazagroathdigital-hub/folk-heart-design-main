import { useState } from "react";
import { HONEYPOT_FIELD, InquiryError, submitInquiry, type InquiryInput } from "@/lib/cms/inquiries";

/** Submit state shared by the public Contact / Custom Order forms. */
// eslint-disable-next-line react-refresh/only-export-components
export function useInquirySubmit() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (input: InquiryInput, form: HTMLFormElement) => {
    if (submitting) return false;
    setSubmitting(true);
    setError(null);
    try {
      await submitInquiry(input, form);
      setSubmitted(true);
      return true;
    } catch (err) {
      setError(
        err instanceof InquiryError ? err.message : "Sorry, your message couldn't be sent. Please try again.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitted, setSubmitted, submitting, error, submit };
}

/** Hidden spam trap: humans never see or fill it; bots usually do. */
export function HoneypotField() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Leave this field empty
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 font-body text-sm text-destructive">
      {message}
    </p>
  );
}

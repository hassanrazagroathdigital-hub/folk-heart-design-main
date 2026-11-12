import { useState } from "react";
import { FORMSPREE_ENDPOINT } from "@/lib/cms/inquiries";
import { useSiteSettings } from "@/lib/cms/hooks";
import { FormError, HoneypotField, useInquirySubmit } from "@/hooks/use-inquiry-submit";

const EMPTY = { fullName: "", email: "", instagram: "", productInterest: "", message: "" };

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

const CustomOrderForm = () => {
  const { home } = useSiteSettings();
  const [formData, setFormData] = useState(EMPTY);
  const { submitted, setSubmitted, submitting, error, submit } = useInquirySubmit();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await submit(
      {
        type: "general",
        name: formData.fullName,
        email: formData.email,
        subject: formData.productInterest,
        message: formData.message,
        details: { instagram: formData.instagram, productInterest: formData.productInterest },
      },
      e.currentTarget,
    );
    if (ok) setFormData(EMPTY);
  };

  return (
    <section id="custom-order" className="bg-warm-linen py-20 md:py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          {home.inquiry_eyebrow && <p className="eyebrow mb-3">{home.inquiry_eyebrow}</p>}
          <h2 className="section-title-italic mb-4">{home.inquiry_title}</h2>
          {home.inquiry_body && <p className="body-text">{home.inquiry_body}</p>}
        </div>

        {submitted ? (
          <div className="bg-card rounded-2xl p-10 shadow-[var(--shadow-card)] text-center space-y-4" role="status">
            <h3 className="font-display text-2xl text-foreground">Thank you! 💛</h3>
            <p className="body-text">
              Your inquiry has been sent. Emily will get back to you soon — keep an eye on your inbox!
            </p>
            <button onClick={() => setSubmitted(false)} className="btn-secondary-cta">
              send another inquiry
            </button>
          </div>
        ) : (
          <form
            action={FORMSPREE_ENDPOINT}
            method="POST"
            onSubmit={handleSubmit}
            className="relative bg-card rounded-2xl p-8 md:p-10 shadow-[var(--shadow-card)] space-y-5"
          >
            <input type="hidden" name="_subject" value="New Inquiry from Website" />
            <HoneypotField />
            <div>
              <label htmlFor="hq-name" className="font-body text-sm text-foreground block mb-1.5">Full Name *</label>
              <input id="hq-name" type="text" name="fullName" required maxLength={200} value={formData.fullName} onChange={handleChange} placeholder="Your full name" className={inputCls} />
            </div>
            <div>
              <label htmlFor="hq-email" className="font-body text-sm text-foreground block mb-1.5">Email *</label>
              <input id="hq-email" type="email" name="email" required maxLength={320} value={formData.email} onChange={handleChange} placeholder="your@email.com" className={inputCls} />
            </div>
            <div>
              <label htmlFor="hq-ig" className="font-body text-sm text-foreground block mb-1.5">Instagram Handle</label>
              <input id="hq-ig" type="text" name="instagram" maxLength={100} value={formData.instagram} onChange={handleChange} placeholder="@yourusername" className={inputCls} />
            </div>
            <div>
              <label htmlFor="hq-interest" className="font-body text-sm text-foreground block mb-1.5">Product Interest *</label>
              <select
                id="hq-interest"
                name="productInterest"
                required
                value={formData.productInterest}
                onChange={handleChange}
                className={`${inputCls} text-foreground`}
              >
                <option value="">Select a category...</option>
                <option value="Matching Mother & Child Set">Matching Mother & Child Set</option>
                <option value="Children's Clothing">Children's Clothing</option>
                <option value="Gift Set">Gift Set</option>
                <option value="Custom / Bulk Order">Custom / Bulk Order</option>
                <option value="Purchase a Listed Item">Purchase a Listed Item</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="hq-message" className="font-body text-sm text-foreground block mb-1.5">Message *</label>
              <textarea
                id="hq-message"
                name="message"
                required
                maxLength={5000}
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell Emily and Mary what you're looking for — sizes, colors, occasion, or any details about your order..."
                rows={5}
                className={`${inputCls} resize-none`}
              />
            </div>
            <FormError message={error} />
            <button type="submit" disabled={submitting} className="btn-primary-cta w-full text-center disabled:opacity-60">
              {submitting ? "sending…" : "send inquiry"}
            </button>
            {home.inquiry_note && <p className="font-body text-xs text-muted-foreground text-center">{home.inquiry_note}</p>}
          </form>
        )}
      </div>
    </section>
  );
};

export default CustomOrderForm;

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PatternStrip from "@/components/PatternStrip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FORMSPREE_ENDPOINT } from "@/lib/cms/inquiries";
import { usePublicFaqs, useSiteSettings } from "@/lib/cms/hooks";
import { FormError, HoneypotField, useInquirySubmit } from "@/hooks/use-inquiry-submit";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  itemType: "",
  sizing: "",
  fabric: "",
  occasion: "",
  quantity: 1,
  notes: "",
  contactMethod: "Email",
};

const CustomOrder = () => {
  const { custom_order } = useSiteSettings();
  const { data: faqs = [] } = usePublicFaqs();
  const [form, setForm] = useState(EMPTY_FORM);
  const { submitted, setSubmitted, submitting, error, submit } = useInquirySubmit();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await submit(
      {
        type: "custom_order",
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        subject: form.itemType ? `Custom order: ${form.itemType}` : "Custom order",
        message: form.notes,
        details: {
          itemType: form.itemType,
          sizing: form.sizing,
          fabric: form.fabric,
          occasion: form.occasion,
          quantity: Number(form.quantity) || 1,
          preferredContact: form.contactMethod,
        },
      },
      e.currentTarget,
    );
    if (ok) setForm(EMPTY_FORM);
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <PatternStrip pattern="pattern1" />
      </div>

      {/* Hero */}
      <section className="bg-background pt-12 pb-16 md:pt-16 md:pb-20 px-6 text-center">
        <h1 className="section-title text-destructive mb-4">{custom_order.title}</h1>
        {custom_order.intro && (
          <p className="body-text max-w-4xl mx-auto text-sm md:text-base md:whitespace-nowrap">{custom_order.intro}</p>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-warm-linen py-16 md:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Dotted connector line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[16.6%] right-[16.6%] border-t-2 border-dashed border-destructive/40 z-0" />

            {[
              {
                num: 1,
                title: "Share Your Vision",
                desc: "Fill out the form below with details about what you would like. Fabric preferences, sizes, colors, occasion — anything helps.",
              },
              {
                num: 2,
                title: "We'll Be In Touch",
                desc: "Emily will reach out within 2 to 3 business days to discuss details, timeline, and pricing.",
              },
              {
                num: 3,
                title: "Made Just For You",
                desc: "Once details are confirmed, your custom piece is handcrafted with care and shipped to your door.",
              },
            ].map((s) => (
              <div key={s.num} className="text-center relative z-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center font-display text-xl mx-auto">
                  {s.num}
                </div>
                <h3 className="font-display text-lg text-foreground">{s.title}</h3>
                <p className="body-text text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-background py-16 md:py-24 px-6">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <div className="bg-card rounded-[20px] p-10 shadow-[var(--shadow-card)] text-center space-y-4" role="status">
              <h3 className="font-display text-2xl text-foreground">Thank you! 💛</h3>
              <p className="body-text">
                Your custom order inquiry has been sent. Emily will get back to you soon!
              </p>
              <button onClick={() => setSubmitted(false)} className="btn-secondary-cta">
                send another request
              </button>
            </div>
          ) : (
            <form
              action={FORMSPREE_ENDPOINT}
              method="POST"
              onSubmit={handleSubmit}
              className="relative bg-card rounded-[20px] p-8 md:p-10 shadow-[var(--shadow-card)] space-y-5"
            >
              <input type="hidden" name="_subject" value="New Custom Order Inquiry from Website" />
              <HoneypotField />
              <div>
                <label htmlFor="co-name" className="font-body text-sm text-foreground block mb-1.5">Full Name *</label>
                <input id="co-name" type="text" name="fullName" required maxLength={200} value={form.fullName} onChange={handleChange} placeholder="Your full name" className={inputCls} />
              </div>
              <div>
                <label htmlFor="co-email" className="font-body text-sm text-foreground block mb-1.5">Email Address *</label>
                <input id="co-email" type="email" name="email" required maxLength={320} value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputCls} />
              </div>
              <div>
                <label htmlFor="co-phone" className="font-body text-sm text-foreground block mb-1.5">
                  Phone Number <span className="text-muted-foreground text-xs">(optional but helpful for quick questions)</span>
                </label>
                <input id="co-phone" type="tel" name="phone" maxLength={50} value={form.phone} onChange={handleChange} placeholder="(555) 123-4567" className={inputCls} />
              </div>
              <div>
                <label htmlFor="co-type" className="font-body text-sm text-foreground block mb-1.5">Item Type *</label>
                <select id="co-type" name="itemType" required value={form.itemType} onChange={handleChange} className={inputCls}>
                  <option value="">Select a type...</option>
                  {["Apron", "Quilt", "Baby Blanket", "Car Seat Cover", "Lovey", "Gift Set", "Other"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="co-sizing" className="font-body text-sm text-foreground block mb-1.5">Size or Sizing Details</label>
                <input id="co-sizing" type="text" name="sizing" maxLength={300} value={form.sizing} onChange={handleChange} placeholder="Adult L, Child size 4, Baby newborn, etc." className={inputCls} />
              </div>
              <div>
                <label htmlFor="co-fabric" className="font-body text-sm text-foreground block mb-1.5">Fabric or Color Preferences</label>
                <textarea id="co-fabric" name="fabric" maxLength={1000} value={form.fabric} onChange={handleChange} rows={3} placeholder="I love florals, I want something in blue and white, I want to match the nursery, etc." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label htmlFor="co-occasion" className="font-body text-sm text-foreground block mb-1.5">Occasion</label>
                <input id="co-occasion" type="text" name="occasion" maxLength={300} value={form.occasion} onChange={handleChange} placeholder="Baby shower, Birthday, Christmas gift, Just because" className={inputCls} />
              </div>
              <div>
                <label htmlFor="co-qty" className="font-body text-sm text-foreground block mb-1.5">Quantity</label>
                <input id="co-qty" type="number" name="quantity" min={1} max={999} value={form.quantity} onChange={handleChange} className={`${inputCls} w-24`} />
              </div>
              <div>
                <label htmlFor="co-notes" className="font-body text-sm text-foreground block mb-1.5">Additional Notes or Special Requests</label>
                <textarea id="co-notes" name="notes" maxLength={3000} value={form.notes} onChange={handleChange} rows={4} placeholder="Anything else you'd like us to know..." className={`${inputCls} resize-none`} />
              </div>
              <fieldset>
                <legend className="font-body text-sm text-foreground block mb-1.5">Preferred Contact Method *</legend>
                <div className="flex gap-6 font-body text-sm">
                  {["Email", "Phone", "Either"].map((m) => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contactMethod"
                        value={m}
                        checked={form.contactMethod === m}
                        onChange={handleChange}
                        className="accent-destructive"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </fieldset>
              <FormError message={error} />
              <button type="submit" disabled={submitting} className="btn-primary-cta w-full text-center disabled:opacity-60">
                {submitting ? "sending…" : "send my request"}
              </button>
              <p className="font-body text-xs text-muted-foreground text-center">
                We will never share your information. All custom orders are confirmed via email
                before any payment is collected.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="bg-warm-linen py-16 md:py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="section-title-italic text-2xl md:text-3xl text-center mb-10">
              {custom_order.faq_title}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="bg-card rounded-[20px] border border-border px-6">
                  <AccordionTrigger className="font-display text-base hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="body-text text-sm whitespace-pre-line">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      <PatternStrip pattern="pattern2" />
      <Footer />
    </div>
  );
};

export default CustomOrder;

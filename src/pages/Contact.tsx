import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BeholdInstagram from "@/components/BeholdInstagram";
import PatternStrip from "@/components/PatternStrip";
import { FORMSPREE_ENDPOINT } from "@/lib/cms/inquiries";
import { useSiteSettings } from "@/lib/cms/hooks";
import { safeHref, stripAt } from "@/lib/cms/utils";
import { FormError, HoneypotField, useInquirySubmit } from "@/hooks/use-inquiry-submit";

const Contact = () => {
  const { contact, contact_page } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const { submitted, setSubmitted, submitting, error, submit } = useInquirySubmit();
  const handle = stripAt(contact.instagram_handle);
  const instagram = safeHref(contact.instagram_url);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await submit(
      { type: "contact", name: form.name, email: form.email, subject: form.subject, message: form.message },
      e.currentTarget,
    );
    if (ok) setForm({ name: "", email: "", subject: "", message: "" });
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
        <h1 className="section-title text-destructive mb-4">{contact_page.title}</h1>
        {contact_page.intro && <p className="body-text max-w-xl mx-auto">{contact_page.intro}</p>}
      </section>

      {/* Two Column */}
      <section className="bg-warm-linen py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            {submitted ? (
              <div className="bg-card rounded-[20px] p-10 shadow-[var(--shadow-card)] text-center space-y-4" role="status">
                <h3 className="font-display text-2xl text-foreground">Message Sent! 💛</h3>
                <p className="body-text">We'll get back to you soon.</p>
                <button onClick={() => setSubmitted(false)} className="btn-secondary-cta">
                  send another message
                </button>
              </div>
            ) : (
              <form
                id="contact-form"
                action={FORMSPREE_ENDPOINT}
                method="POST"
                onSubmit={handleSubmit}
                className="relative bg-card rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-5"
              >
                <input type="hidden" name="_subject" value="New Contact Message from Website" />
                <HoneypotField />
                <div>
                  <label htmlFor="contact-name" className="font-body text-sm text-foreground block mb-1.5">Name *</label>
                  <input id="contact-name" type="text" name="name" required maxLength={200} value={form.name} onChange={handleChange} placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="contact-email" className="font-body text-sm text-foreground block mb-1.5">Email *</label>
                  <input id="contact-email" type="email" name="email" required maxLength={320} value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="font-body text-sm text-foreground block mb-1.5">Subject</label>
                  <input id="contact-subject" type="text" name="subject" maxLength={300} value={form.subject} onChange={handleChange} placeholder="What's this about?" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="contact-message" className="font-body text-sm text-foreground block mb-1.5">Message *</label>
                  <textarea id="contact-message" name="message" required maxLength={5000} value={form.message} onChange={handleChange} rows={5} placeholder="Your message..." className={`${inputCls} resize-none`} />
                </div>
                <FormError message={error} />
                <button type="submit" disabled={submitting} className="btn-primary-cta w-full text-center disabled:opacity-60">
                  {submitting ? "sending…" : "send message"}
                </button>
              </form>
            )}
          </div>

          {/* Contact Details */}
          <div className="bg-card rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-6 h-fit">
            {contact.email && (
              <div className="space-y-1">
                <p className="font-display text-sm text-foreground uppercase tracking-wide">Email</p>
                <a href={`mailto:${contact.email}`} className="body-text text-sm hover:text-primary transition-colors">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <>
                <div className="border-t border-dashed border-destructive/30" />
                <div className="space-y-1">
                  <p className="font-display text-sm text-foreground uppercase tracking-wide">Phone</p>
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="body-text text-sm hover:text-primary transition-colors">
                    {contact.phone}
                  </a>
                </div>
              </>
            )}
            {instagram && (
              <>
                <div className="border-t border-dashed border-destructive/30" />
                <div className="space-y-1">
                  <p className="font-display text-sm text-foreground uppercase tracking-wide">Instagram</p>
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="body-text text-sm hover:text-primary transition-colors">
                    @{handle}
                  </a>
                </div>
              </>
            )}
            {contact.location && (
              <>
                <div className="border-t border-dashed border-destructive/30" />
                <div className="space-y-1">
                  <p className="font-display text-sm text-foreground uppercase tracking-wide">Location</p>
                  <p className="body-text text-sm">{contact.location}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Instagram Strip */}
      {instagram && (
        <section className="bg-background py-16 md:py-20 px-6 text-center">
          <h2 className="font-display text-2xl text-foreground mb-2">Find Us On Instagram</h2>
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="body-text text-sm hover:text-primary transition-colors mb-8 inline-block"
          >
            @{handle}
          </a>
          <div className="max-w-5xl mx-auto mt-6">
            <BeholdInstagram />
          </div>
        </section>
      )}

      {/* Closing Note */}
      {contact_page.closing_note && (
        <section className="bg-warm-linen py-12 px-6 text-center">
          <p className="font-display italic text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {contact_page.closing_note}
          </p>
        </section>
      )}

      <PatternStrip pattern="pattern2" />
      <Footer />
    </div>
  );
};

export default Contact;

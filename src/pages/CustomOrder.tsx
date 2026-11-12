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

const CustomOrder = () => {
  const [form, setForm] = useState({
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
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await fetch("https://formspree.io/f/mjgdawap", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
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
        <h1 className="section-title text-destructive mb-4">Let's Create Something Special</h1>
        <p className="body-text max-w-4xl mx-auto text-sm md:text-base md:whitespace-nowrap">
          Every Matka and Me piece can be made just for you. Tell us your vision and we will bring it to life.
        </p>
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
            <div className="bg-card rounded-[20px] p-10 shadow-[var(--shadow-card)] text-center space-y-4">
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
              action="https://formspree.io/f/mjgdawap"
              method="POST"
              onSubmit={handleSubmit}
              className="bg-card rounded-[20px] p-8 md:p-10 shadow-[var(--shadow-card)] space-y-5"
            >
              <input type="hidden" name="_subject" value="New Custom Order Inquiry from Website" />
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Full Name *</label>
                <input type="text" name="fullName" required value={form.fullName} onChange={handleChange} placeholder="Your full name" className={inputCls} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Email Address *</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputCls} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">
                  Phone Number <span className="text-muted-foreground text-xs">(optional but helpful for quick questions)</span>
                </label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 123-4567" className={inputCls} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Item Type *</label>
                <select name="itemType" required value={form.itemType} onChange={handleChange} className={inputCls}>
                  <option value="">Select a type...</option>
                  {["Apron", "Quilt", "Baby Blanket", "Car Seat Cover", "Lovey", "Gift Set", "Other"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Size or Sizing Details</label>
                <input type="text" name="sizing" value={form.sizing} onChange={handleChange} placeholder="Adult L, Child size 4, Baby newborn, etc." className={inputCls} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Fabric or Color Preferences</label>
                <textarea name="fabric" value={form.fabric} onChange={handleChange} rows={3} placeholder="I love florals, I want something in blue and white, I want to match the nursery, etc." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Occasion</label>
                <input type="text" name="occasion" value={form.occasion} onChange={handleChange} placeholder="Baby shower, Birthday, Christmas gift, Just because" className={inputCls} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Quantity</label>
                <input type="number" name="quantity" min={1} value={form.quantity} onChange={handleChange} className={`${inputCls} w-24`} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Additional Notes or Special Requests</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Anything else you'd like us to know..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="font-body text-sm text-foreground block mb-1.5">Preferred Contact Method *</label>
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
              </div>
              <button type="submit" className="btn-primary-cta w-full text-center">
                send my request
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
      <section className="bg-warm-linen py-16 md:py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="section-title-italic text-2xl md:text-3xl text-center mb-10">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              {
                q: "How long does a custom order take?",
                a: "Most custom pieces are completed within 2 to 4 weeks depending on complexity and current order volume.",
              },
              {
                q: "Can I choose my own fabric?",
                a: "Absolutely. You can share a fabric you love, a color palette, or a theme and Emily will help you find the perfect match.",
              },
              {
                q: "Do you ship?",
                a: "Yes, we ship within the US.",
              },
              {
                q: "What is your return policy on custom items?",
                a: "Because each piece is custom made, we do not accept returns but we will always work with you to make it right.",
              },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-[20px] border border-border px-6">
                <AccordionTrigger className="font-display text-base hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="body-text text-sm">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <PatternStrip pattern="pattern2" />
      <Footer />
    </div>
  );
};

export default CustomOrder;

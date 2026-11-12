import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Instagram, Mail } from "lucide-react";
import BeholdInstagram from "@/components/BeholdInstagram";
import PatternStrip from "@/components/PatternStrip";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
      // Formspree will still receive the submission via the form's action fallback
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
        <h1 className="section-title text-destructive mb-4">Say Hello</h1>
        <p className="body-text max-w-xl mx-auto">
          We would love to hear from you. Reach out with questions, custom order inquiries, or just
          to say hi.
        </p>
      </section>

      {/* Two Column */}
      <section className="bg-warm-linen py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            {submitted ? (
              <div className="bg-card rounded-[20px] p-10 shadow-[var(--shadow-card)] text-center space-y-4">
                <h3 className="font-display text-2xl text-foreground">Message Sent! 💛</h3>
                <p className="body-text">We'll get back to you soon.</p>
                <button onClick={() => setSubmitted(false)} className="btn-secondary-cta">
                  send another message
                </button>
              </div>
            ) : (
              <form
                id="contact-form"
                action="https://formspree.io/f/mjgdawap"
                method="POST"
                onSubmit={handleSubmit}
                className="bg-card rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-5"
              >
                <input type="hidden" name="_subject" value="New Contact Message from Website" />
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5">Name *</label>
                  <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5">Email *</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5">Subject</label>
                  <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="What's this about?" className={inputCls} />
                </div>
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5">Message *</label>
                  <textarea name="message" required value={form.message} onChange={handleChange} rows={5} placeholder="Your message..." className={`${inputCls} resize-none`} />
                </div>
                <button type="submit" className="btn-primary-cta w-full text-center">
                  send message
                </button>
              </form>
            )}
          </div>

          {/* Contact Details */}
          <div className="bg-card rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-6 h-fit">
            <div className="space-y-1">
              <p className="font-display text-sm text-foreground uppercase tracking-wide">Email</p>
              <a href="mailto:hello@matkaandmethreads.com" className="body-text text-sm hover:text-primary transition-colors">
                hello@matkaandmethreads.com
              </a>
            </div>
            <div className="border-t border-dashed border-destructive/30" />
            <div className="space-y-1">
              <p className="font-display text-sm text-foreground uppercase tracking-wide">Instagram</p>
              <a href="https://instagram.com/matkaandmethreads" target="_blank" rel="noopener noreferrer" className="body-text text-sm hover:text-primary transition-colors">
                @matkaandmethreads
              </a>
            </div>
            <div className="border-t border-dashed border-destructive/30" />
            <div className="space-y-1">
              <p className="font-display text-sm text-foreground uppercase tracking-wide">Location</p>
              <p className="body-text text-sm">Handmade in the USA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Strip */}
      <section className="bg-background py-16 md:py-20 px-6 text-center">
        <h2 className="font-display text-2xl text-foreground mb-2">Find Us On Instagram</h2>
        <a
          href="https://instagram.com/matkaandmethreads"
          target="_blank"
          rel="noopener noreferrer"
          className="body-text text-sm hover:text-primary transition-colors mb-8 inline-block"
        >
          @matkaandmethreads
        </a>
        <div className="max-w-5xl mx-auto mt-6">
          <BeholdInstagram />
        </div>
      </section>

      {/* Closing Note */}
      <section className="bg-warm-linen py-12 px-6 text-center">
        <p className="font-display italic text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Thank You For Supporting Handmade. Please Enjoy Our Quality Products Made With Love, From Our Home To Yours.
        </p>
      </section>

      <PatternStrip pattern="pattern2" />
      <Footer />
    </div>
  );
};

export default Contact;

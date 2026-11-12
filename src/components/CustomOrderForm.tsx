import { useState } from "react";

const CustomOrderForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    instagram: "",
    productInterest: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  return (
    <section id="custom-order" className="bg-warm-linen py-20 md:py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">inquiries & custom orders</p>
          <h2 className="section-title-italic mb-4">Let's Create Something Special</h2>
          <p className="body-text">
            Want a custom piece/set or have questions about a product you see?
            Fill out the form below and Emily will get back to you personally.
          </p>
        </div>

        {submitted ? (
          <div className="bg-card rounded-2xl p-10 shadow-[var(--shadow-card)] text-center space-y-4">
            <h3 className="font-display text-2xl text-foreground">Thank you! 💛</h3>
            <p className="body-text">
              Your inquiry has been sent. Emily will get back to you soon — keep an eye on your inbox!
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-secondary-cta"
            >
              send another inquiry
            </button>
          </div>
        ) : (
          <form
            action="https://formspree.io/f/mjgdawap"
            method="POST"
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl p-8 md:p-10 shadow-[var(--shadow-card)] space-y-5"
          >
            <input type="hidden" name="_subject" value="New Inquiry from Website" />
            <div>
              <label className="font-body text-sm text-foreground block mb-1.5">Full Name *</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-body text-sm text-foreground block mb-1.5">Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-body text-sm text-foreground block mb-1.5">Instagram Handle</label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@yourusername"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-body text-sm text-foreground block mb-1.5">Product Interest *</label>
              <select
                name="productInterest"
                required
                value={formData.productInterest}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="font-body text-sm text-foreground block mb-1.5">Message *</label>
              <textarea
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell Emily and Mary what you're looking for — sizes, colors, occasion, or any details about your order..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <button type="submit" className="btn-primary-cta w-full text-center">
              send inquiry
            </button>
            <p className="font-body text-xs text-muted-foreground text-center">
              Payment is handled personally via PayPal after Emily confirms your order.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default CustomOrderForm;

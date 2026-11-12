import { useState } from "react";
import PatternStrip from "./PatternStrip";

const EmailCapture = () => {
  const [email, setEmail] = useState("");

  return (
    <section id="contact">
      <PatternStrip pattern="pattern1" />
      <div className="bg-primary py-20 md:py-24 px-6">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="font-display text-4xl md:text-6xl font-light text-primary-foreground leading-tight">
            Be first for every new drop.
          </h2>
          <p className="font-body font-light text-primary-foreground/80 text-base md:text-lg">
            Every piece is one-of-a-kind and sells fast. Join our list for early
            access and stories from Emily.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 mt-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-3.5 rounded-full bg-card text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-berry-red"
            />
            <button type="submit" className="btn-primary-cta whitespace-nowrap">
              join the matka circle
            </button>
          </form>
          <p className="font-body text-xs text-primary-foreground/60">
            Contact: hello@matkaandmethreads.com · @matkaandmethreads on Instagram
          </p>
        </div>
      </div>
      <PatternStrip pattern="pattern2" />
    </section>
  );
};

export default EmailCapture;

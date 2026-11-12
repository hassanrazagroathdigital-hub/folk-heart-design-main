import PatternStrip from "./PatternStrip";
import logo from "@/assets/matka-me-logo.png";
import { Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer>
    <PatternStrip pattern="pattern3" />
    <div className="bg-pattern-black py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <img src={logo} alt="Matka & Me Threads" className="h-10 brightness-0 invert" />
          <p className="font-body font-light text-primary-foreground/50 text-sm">
            Small-batch, big love. Handmade & one-of-a-kind.
          </p>
          <div className="flex gap-3">
            <a href="mailto:hello@matkaandmethreads.com" aria-label="Email Matka & Me Threads" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-block">
              <Mail size={20} />
            </a>
            <a href="https://instagram.com/matkaandmethreads" aria-label="Matka & Me Threads on Instagram" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-block" target="_blank" rel="noopener noreferrer">
              <Instagram size={20} />
            </a>
          </div>
        </div>
        <div className="space-y-3">
          <Link to="/shop" className="block font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Shop</Link>
          <Link to="/#story" className="block font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Our Story</Link>
          <Link to="/#custom-order" className="block font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Custom Orders</Link>
          <Link to="/#contact" className="block font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Contact</Link>
        </div>
        <div className="space-y-4">
          <p className="font-body font-light text-primary-foreground/60 text-sm leading-relaxed">
            Small-batch, big love. Made in the Pacific Northwest by Emily Mooney and Mary Syslo.
          </p>
          <p className="font-body text-xs text-primary-foreground/40">
            hello@matkaandmethreads.com
          </p>
          <p className="font-body text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} Matka & Me Threads. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

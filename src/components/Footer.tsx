import PatternStrip from "./PatternStrip";
import logo from "@/assets/matka-me-logo.png";
import { Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/lib/cms/hooks";
import { safeHref, withYear } from "@/lib/cms/utils";

const Footer = () => {
  const { brand, contact, footer } = useSiteSettings();
  const instagram = safeHref(contact.instagram_url);
  return (
  <footer>
    <PatternStrip pattern="pattern3" />
    <div className="bg-pattern-black py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <img src={brand.logo_url || logo} alt={brand.name} className="h-10 brightness-0 invert" />
          <p className="font-body font-light text-primary-foreground/50 text-sm">
            {footer.tagline}
          </p>
          <div className="flex gap-3">
            {contact.email && (
              <a href={`mailto:${contact.email}`} aria-label={`Email ${brand.name}`} className="text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-block">
                <Mail size={20} />
              </a>
            )}
            {instagram && (
              <a href={instagram} aria-label={`${brand.name} on Instagram`} className="text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-block" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
            )}
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
            {footer.about}
          </p>
          {contact.email && (
            <p className="font-body text-xs text-primary-foreground/40">
              {contact.email}
            </p>
          )}
          <p className="font-body text-xs text-primary-foreground/40">
            {withYear(footer.copyright)}
          </p>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;

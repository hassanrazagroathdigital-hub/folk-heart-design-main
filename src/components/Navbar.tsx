import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/matka-me-logo.png";
import { Instagram, Menu, X, Mail } from "lucide-react";
import LinktreeIcon from "@/components/LinktreeIcon";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "Our Story", to: "/our-story" },
    { label: "Custom Order", to: "/custom-order" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-primary/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 md:h-20">
        <Link to="/">
          <img src={logo} alt="Matka & Me Threads" className="h-10 md:h-12 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className="nav-link">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a href="mailto:hello@matkaandmethreads.com" aria-label="Email" className="text-foreground hover:text-primary transition-colors">
            <Mail size={20} />
          </a>
          <a href="https://instagram.com/matkaandmethreads" aria-label="Instagram" className="text-foreground hover:text-primary transition-colors hidden md:block" target="_blank" rel="noopener noreferrer">
            <Instagram size={20} />
          </a>
          <a href="https://linktr.ee/matkaandme" aria-label="Linktree" className="text-foreground hover:text-primary transition-colors hidden md:block" target="_blank" rel="noopener noreferrer">
            <LinktreeIcon size={18} />
          </a>
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className="nav-link text-lg" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

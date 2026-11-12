import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-mom-child.jpg";
import PatternStrip from "./PatternStrip";
import { useSiteSettings } from "@/lib/cms/hooks";

const HeroSection = () => {
  const { hero } = useSiteSettings();
  return (
  <section className="pt-16 md:pt-20">
    <PatternStrip pattern="pattern1" />
    <div className="bg-background min-h-[85vh] flex flex-col md:flex-row">
      <div className="w-full md:w-[55%] overflow-hidden">
        <img
          src={hero.image_url || heroImg}
          alt={hero.image_alt}
          className="w-full h-full object-cover animate-[softRise_0.8s_ease-out_forwards]"
          style={{ minHeight: "400px" }}
          width={768}
          height={1024}
        />
      </div>
      <div className="w-full md:w-[45%] flex items-center justify-center px-8 md:px-16 py-16 md:py-0">
        <div className="max-w-md space-y-6">
          <h1
            className="font-display text-5xl md:text-6xl lg:text-[68px] leading-[1.1] text-foreground"
            style={{ animationDelay: "0.2s" }}
          >
            {hero.headline}
          </h1>
          <p className="body-text" style={{ animationDelay: "0.3s" }}>
            {hero.body}
          </p>
          <div className="flex flex-col sm:flex-row gap-3" style={{ animationDelay: "0.4s" }}>
            <Link to="/shop" className="btn-primary-cta">
              {hero.primary_cta}
            </Link>
            <a href="#custom-order" className="btn-secondary-cta">
              {hero.secondary_cta}
            </a>
          </div>
          {hero.note && <p className="font-body text-xs text-muted-foreground">{hero.note}</p>}
        </div>
      </div>
    </div>
    <PatternStrip pattern="pattern2" />
  </section>
  );
};

export default HeroSection;

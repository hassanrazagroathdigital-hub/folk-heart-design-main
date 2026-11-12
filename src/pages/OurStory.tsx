import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PatternStrip from "@/components/PatternStrip";
import { Heart, Gift } from "lucide-react";
import { useSiteSettings } from "@/lib/cms/hooks";
import { BUILTIN_IMAGES } from "@/lib/cms/defaults";
import { toParagraphs } from "@/lib/cms/utils";

const OurStory = () => {
  const { story } = useSiteSettings();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <PatternStrip pattern="pattern1" />
      </div>

      {/* Hero Banner */}
      <section className="bg-background pt-12 pb-16 md:pt-16 md:pb-20 px-6 text-center">
        <h1 className="section-title text-destructive mb-4">{story.title}</h1>
        {story.subtitle && <p className="body-text max-w-xl mx-auto">{story.subtitle}</p>}
      </section>

      {/* The Name */}
      {story.intro && (
        <section className="bg-warm-linen py-16 md:py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="body-text text-lg md:text-xl">{story.intro}</p>
          </div>
          {/* Stitch divider */}
          <div className="max-w-xs mx-auto mt-12 border-t-2 border-dashed border-destructive/40" />
        </section>
      )}

      {/* People — alternating layout, as originally designed for Emily & Mary */}
      {story.members.map((m, i) => {
        const flipped = i % 2 === 1;
        const image = m.image_url || BUILTIN_IMAGES.storyMembers[i];
        return (
          <section key={i} className={`${flipped ? "bg-warm-linen" : "bg-background"} py-16 md:py-24 px-6`}>
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              {image && (
                <div className={`rounded-[20px] aspect-[4/5] overflow-hidden ${flipped ? "md:order-2 order-1" : ""}`}>
                  <img src={image} alt={m.image_alt} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className={`space-y-6 ${flipped ? "md:order-1 order-2" : ""}`}>
                <h2 className="section-title-italic text-3xl md:text-4xl">{m.heading}</h2>
                {toParagraphs(m.body).map((para, k) => (
                  <p key={k} className="body-text">
                    {para}
                  </p>
                ))}
                {i === 0 && (
                  <Link to="/shop" className="btn-primary-cta">
                    see our collection
                  </Link>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* Values Row */}
      <section className="bg-warm-linen py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                  <path d="M12 2v20M12 2c-2 4-6 6-6 10a6 6 0 0012 0c0-4-4-6-6-10z" />
                  <line x1="8" y1="18" x2="16" y2="18" />
                </svg>
              ),
              title: "Hand Stitched",
              desc: "Every item is sewn by hand, one piece at a time.",
            },
            {
              icon: <Heart className="text-destructive" size={36} strokeWidth={1.5} />,
              title: "Made With Love",
              desc: "From our family to yours, each piece carries warmth.",
            },
            {
              icon: <Gift className="text-destructive" size={36} strokeWidth={1.5} />,
              title: "One of a Kind",
              desc: "No two pieces are exactly alike. That is the point.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="bg-card rounded-[20px] border border-destructive/20 p-6 md:p-8 text-center space-y-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex justify-center">{v.icon}</div>
              <h3 className="font-display text-xl text-foreground">{v.title}</h3>
              <p className="body-text text-sm md:whitespace-nowrap">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-primary py-16 md:py-20 px-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-primary-foreground mb-6">{story.closing_title}</h2>
        <Link to="/shop" className="btn-primary-cta">
          shop now
        </Link>
      </section>

      <PatternStrip pattern="pattern2" />
      <Footer />
    </div>
  );
};

export default OurStory;

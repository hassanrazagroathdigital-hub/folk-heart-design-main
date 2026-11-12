import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PatternStrip from "@/components/PatternStrip";
import { Heart, Gift } from "lucide-react";
import emilyImg from "@/assets/emily.jpg";
import maryImg from "@/assets/mary.jpg";

const OurStory = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-16 md:pt-20">
      <PatternStrip pattern="pattern1" />
    </div>

    {/* Hero Banner */}
    <section className="bg-background pt-12 pb-16 md:pt-16 md:pb-20 px-6 text-center">
      <h1 className="section-title text-destructive mb-4">Our Story</h1>
      <p className="body-text max-w-xl mx-auto">Made with love, stitch by stitch.</p>
    </section>

    {/* The Name */}
    <section className="bg-warm-linen py-16 md:py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="body-text text-lg md:text-xl">
          We believe the best gifts are handmade. Each item is made with care and meant to be treasured.
        </p>
      </div>
      {/* Stitch divider */}
      <div className="max-w-xs mx-auto mt-12 border-t-2 border-dashed border-destructive/40" />
    </section>

    {/* About Emily */}
    <section className="bg-background py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="rounded-[20px] aspect-[4/5] overflow-hidden">
          <img
            src={emilyImg}
            alt="Emily, founder of Matka & Me Threads"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="space-y-6">
          <h2 className="section-title-italic text-3xl md:text-4xl">Hi, I'm Emily</h2>
          <p className="body-text">
            I started sewing as a way to express my creativity through fabric. Sewing together with my mom
            has become more than a hobby — it's our way of connecting, creating, and sharing something
            meaningful with others.
          </p>
          <p className="body-text">
            Creating together has strengthened our bond, and each handmade piece carries that care,
            connection, and warmth.
          </p>
          <Link to="/shop" className="btn-primary-cta">
            see our collection
          </Link>
        </div>
      </div>
    </section>

    {/* About Mary */}
    <section className="bg-warm-linen py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 md:order-1 order-2">
          <h2 className="section-title-italic text-3xl md:text-4xl">Hello, I'm Mary</h2>
          <p className="body-text">
            Over the years, my sewing has ranged from making my own clothes and clothes for my family
            to more artistically focused work. Working with my daughter Emily has been a joy as we create
            together pieces that are unique and crafted with love.
          </p>
          <p className="body-text">
            No two items are exactly the same and no item is perfect — just like us. But everything we make
            comes from our love for each other and our dedication to our craft and providing the highest
            quality product for you.
          </p>
        </div>
        <div className="rounded-[20px] aspect-[4/5] overflow-hidden md:order-2 order-1">
          <img
            src={maryImg}
            alt="Mary, co-creator at Matka & Me Threads"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>

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
      <h2 className="font-display text-3xl md:text-4xl text-primary-foreground mb-6">
        Ready to find your piece?
      </h2>
      <Link to="/shop" className="btn-primary-cta">
        shop now
      </Link>
    </section>

    <PatternStrip pattern="pattern2" />
    <Footer />
  </div>
);

export default OurStory;

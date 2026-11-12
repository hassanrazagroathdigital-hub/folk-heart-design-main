import storyImg from "@/assets/story-emily.jpg";

const StorySection = () => (
  <section id="story" className="bg-warm-linen py-20 md:py-28 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
      <div className="w-full md:w-1/2 space-y-6">
        <p className="eyebrow">the story behind the brand</p>
        <h2 className="section-title leading-tight">
          Matka means mother in Polish. This brand is for every one of us.
        </h2>
        <p className="body-text">
          I'm Emily Mooney, and I started Matka & Me Threads because I wanted
          something that felt like us — not off a shelf, not mass-produced. Every
          piece is handmade in small batches with big love. "Matka" means mother
          in Polish, and that's the heart of this brand — celebrating the bond
          between mothers and their children through clothing made with intention.
        </p>
        <p className="body-text">
          Each item is one-of-a-kind. When it's gone, it's gone. That's what
          makes every set special — it was made just for you.
        </p>
        <a href="#custom-order" className="link-draw text-primary font-body text-sm">
          Place a Custom Order →
        </a>
      </div>
      <div className="w-full md:w-1/2">
        <div className="border-[8px] border-primary/30 rounded-lg overflow-hidden">
          <img
            src={storyImg}
            alt="Emily Mooney creating handmade children's clothing"
            className="w-full h-auto object-cover"
            loading="lazy"
            width={720}
            height={896}
          />
        </div>
      </div>
    </div>
  </section>
);

export default StorySection;

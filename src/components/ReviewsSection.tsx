import { Star } from "lucide-react";

const reviews = [
  { quote: "The quality is unreal. My daughter and I get stopped everywhere we go.", name: "Sarah M." },
  { quote: "Finally matching outfits that don't look cheesy. These feel so intentional and special.", name: "Jessica K." },
  { quote: "I ordered the gift set for my best friend's baby shower. She cried. Enough said.", name: "Amanda R." },
  { quote: "Small-batch means you can feel the love in every stitch. We're obsessed.", name: "Priya T." },
];

const Stars = () => (
  <div className="flex gap-0.5 mb-3">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={14} className="fill-berry-red text-berry-red" />
    ))}
  </div>
);

const ReviewsSection = () => (
  <section className="bg-warm-linen py-20 md:py-28 px-6">
    <div className="max-w-7xl mx-auto">
      <h2 className="section-title-italic text-center mb-12">What the mamas are saying</h2>
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {reviews.map((r) => (
          <div
            key={r.name}
            className="min-w-[300px] md:min-w-[320px] bg-card rounded-2xl p-7 shadow-[var(--shadow-card)] snap-start shrink-0"
          >
            <Stars />
            <p className="font-display italic text-lg text-foreground leading-relaxed mb-4">
              "{r.quote}"
            </p>
            <p className="eyebrow text-[11px]">{r.name}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ReviewsSection;

const text = "✦ Matka & Me Threads ✦ One of a Kind · Handmade ✦ Pacific Northwest ✦ Mother & Child ✦ Made With Love ";

const MarqueeTicker = () => (
  <section className="bg-pattern-black py-4 overflow-hidden">
    <div className="flex whitespace-nowrap animate-marquee">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="font-display italic text-lg md:text-xl text-primary-foreground/90 mx-4 shrink-0">
          {text}
        </span>
      ))}
    </div>
  </section>
);

export default MarqueeTicker;

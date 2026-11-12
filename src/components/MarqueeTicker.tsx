import { useSiteSettings } from "@/lib/cms/hooks";

const MarqueeTicker = () => {
  const text = useSiteSettings().home.marquee;
  if (!text.trim()) return null;
  return (
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
};

export default MarqueeTicker;

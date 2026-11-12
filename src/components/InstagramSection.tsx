import instagramProfile from "@/assets/instagram-profile.png";
import eyeletBorder from "@/assets/eyelet-border.png";
import { useSiteSettings } from "@/lib/cms/hooks";
import { safeHref, stripAt } from "@/lib/cms/utils";


const BORDER = 28; // px

const horizontalStrip = {
  height: `${BORDER}px`,
  backgroundImage: `url(${eyeletBorder})`,
  backgroundRepeat: "repeat-x",
  backgroundSize: `auto ${BORDER}px`,
};

const verticalStrip = {
  width: `${BORDER}px`,
  backgroundImage: `url(${eyeletBorder})`,
  backgroundRepeat: "repeat-x",
  backgroundSize: `auto ${BORDER}px`,
  // rotate the horizontal strip to fill a vertical column
  transformOrigin: "top left",
};

const InstagramSection = () => {
  const { contact } = useSiteSettings();
  const handle = stripAt(contact.instagram_handle);
  const href = safeHref(contact.instagram_url) ?? `https://www.instagram.com/${handle}`;
  return (
  <section className="bg-pattern-black py-16 px-6">
    <div className="max-w-7xl mx-auto text-center mb-10">
      <p className="eyebrow text-berry-red mb-2">follow along</p>
      <h2 className="font-display text-4xl md:text-5xl font-light text-primary-foreground">
        @{handle}
      </h2>
    </div>
    <div className="max-w-3xl mx-auto">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block bg-white"
        style={{ padding: `${BORDER}px` }}
        aria-label={`Follow @${handle} on Instagram`}
      >
        {/* Top */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0"
          style={horizontalStrip}
        />
        {/* Bottom */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0"
          style={horizontalStrip}
        />
        {/* Left (rotated strip via transform) */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-0 overflow-hidden"
          style={{ width: `${BORDER}px` }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              ...horizontalStrip,
              width: "200vh",
              transform: `rotate(90deg) translateY(-${BORDER}px)`,
            }}
          />
        </div>
        {/* Right */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 right-0 overflow-hidden"
          style={{ width: `${BORDER}px` }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              ...horizontalStrip,
              width: "200vh",
              transform: `rotate(90deg) translateY(-${BORDER}px)`,
            }}
          />
        </div>
        <img
          src={instagramProfile}
          alt={`@${handle} Instagram profile`}
          className="w-full h-auto block relative"
          loading="lazy"
        />
      </a>
    </div>
  </section>
  );
};

export default InstagramSection;

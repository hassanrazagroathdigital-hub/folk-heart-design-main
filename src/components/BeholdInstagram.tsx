import { useEffect } from "react";

// Behold.so Instagram feed widget.
// To activate: sign up at https://behold.so, connect @matkaandmethreads,
// then replace BEHOLD_FEED_ID below with your widget's feed ID.
const BEHOLD_FEED_ID = "REPLACE_WITH_YOUR_BEHOLD_FEED_ID";

interface BeholdInstagramProps {
  className?: string;
}

const BeholdInstagram = ({ className }: BeholdInstagramProps) => {
  useEffect(() => {
    if (document.querySelector('script[src*="behold.so/widget.js"]')) return;
    const s = document.createElement("script");
    s.src = "https://w.behold.so/widget.js";
    s.type = "module";
    document.body.appendChild(s);
  }, []);

  return (
    <div className={className}>
      {/* @ts-expect-error custom element */}
      <behold-widget feed-id={BEHOLD_FEED_ID}></behold-widget>
    </div>
  );
};

export default BeholdInstagram;

import pattern1 from "@/assets/pattern1.png";
import pattern2 from "@/assets/pattern2.png";
import pattern3 from "@/assets/pattern3.png";

const patterns = { pattern1, pattern2, pattern3 };

interface PatternStripProps {
  pattern: "pattern1" | "pattern2" | "pattern3";
}

const STRIP_HEIGHT = "40px";

const PatternStrip = ({ pattern }: PatternStripProps) => (
  <div
    className="block w-full overflow-hidden m-0 p-0"
    style={{
      height: STRIP_HEIGHT,
      backgroundImage: `url(${patterns[pattern]})`,
      backgroundRepeat: "repeat-x",
      backgroundSize: `auto ${STRIP_HEIGHT}`,
      backgroundPosition: "top left",
      backgroundColor: "transparent",
    }}
    aria-hidden="true"
  />
);

export default PatternStrip;

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PatternStrip from "@/components/PatternStrip";

import aprons1 from "@/assets/aprons1.jpg";
import aprons2 from "@/assets/aprons2.jpg";
import aprons3 from "@/assets/aprons3.jpg";
import carseat from "@/assets/carseat.jpeg";
import entx from "@/assets/ENTX8511.jpg";
import img1480 from "@/assets/IMG_1480.jpg";
import imgE1544 from "@/assets/IMG_E1544.jpg";
import imgE1550 from "@/assets/IMG_E1550.jpg";
import img3363 from "@/assets/IMG_3363.jpg";
import img3365 from "@/assets/IMG_3365.jpg";
import christmasAprons from "@/assets/christmas-aprons.jpg";
import mensSageApron from "@/assets/mens-sage-apron.jpg";
import teacherAprons from "@/assets/teacher-aprons.jpg";
import brightBoldQuilt from "@/assets/bright-bold-quilt.jpg";
import bugsLifeQuilt from "@/assets/bugs-life-quilt.jpg";
import farmingFunQuilt from "@/assets/farming-fun-quilt.jpg";
import winterFriendsBlanket from "@/assets/winter-friends-blanket.jpg";
import boldFloralBlanket from "@/assets/bold-floral-blanket.jpg";
import woodlandAnimalsBlanket from "@/assets/woodland-animals-blanket.jpg";
import seashellQuilt from "@/assets/seashell-quilt.jpg";
import gardenFloralQuilt from "@/assets/garden-floral-quilt.jpg";
import woodlandAnimalsQuilt from "@/assets/woodland-animals-quilt.jpg";
import starIsBornBlanket from "@/assets/star-is-born-blanket.jpg";
import adventureKidsLovey from "@/assets/adventure-kids-lovey.jpg";
import unicornDreamsLovey from "@/assets/unicorn-dreams-lovey.jpg";
import forestFriendsLovey from "@/assets/forest-friends-lovey.jpg";
import puppyKittyLovey from "@/assets/puppy-kitty-lovey.jpg";
import monkeyLovey from "@/assets/monkey-lovey.jpg";
import abc1 from "@/assets/abc123-quilt-1.jpeg";
import abc2 from "@/assets/abc123-quilt-2.jpeg";
import abc3 from "@/assets/abc123-quilt-3.jpeg";

import sloth1 from "@/assets/sloth-quilt-1.jpeg";
import sloth2 from "@/assets/sloth-quilt-2.jpeg";
import sloth3 from "@/assets/sloth-quilt-3.jpeg";
import blackPolkaCarseat from "@/assets/black-polka-carseat.jpeg";
import heartsCarseat from "@/assets/hearts-carseat.jpeg";
import blueFloral1 from "@/assets/blue-floral-quilt-1.jpeg";
import blueFloral2 from "@/assets/blue-floral-quilt-2.jpeg";
import blueFloral3 from "@/assets/blue-floral-quilt-3.jpeg";
import rainbowClouds1 from "@/assets/rainbow-clouds-blanket-1.jpeg";
import rainbowClouds2 from "@/assets/rainbow-clouds-blanket-2.jpeg";
import rainbowClouds4 from "@/assets/rainbow-clouds-blanket-4.jpeg";
import navyFloralCarseat from "@/assets/navy-floral-carseat.jpeg";
import beeHappy1 from "@/assets/bee-happy-quilt-1.jpeg";
import beeHappy2 from "@/assets/bee-happy-quilt-2.jpeg";
import beeHappy3 from "@/assets/bee-happy-quilt-3.jpeg";

type Category = "All" | "Aprons" | "Quilts" | "Baby Blankets" | "Car Seat Covers" | "Loveys";

interface Product {
  name: string;
  image: string | null;
  images?: string[];
  description: string;
  category: Category;
  comingSoon?: boolean;
  hideStockBadge?: boolean;
  inStock?: boolean;
}

const categories: Category[] = ["All", "Aprons", "Quilts", "Baby Blankets", "Car Seat Covers", "Loveys"];

const products: Product[] = [
  // APRONS
  {
    name: "Mama & Mini Bird Apron Set",
    image: aprons1,
    description: "Handmade matching apron set in a gorgeous bird and floral print. Available in adult and child sizes, perfect for cooking together.",
    category: "Aprons",
  },
  {
    name: "Red Floral Full Apron",
    image: aprons2,
    description: "A vibrant red floral apron with a relaxed full coverage fit and generous pockets.",
    category: "Aprons",
  },
  {
    name: "Sunshine Floral Apron",
    image: aprons3,
    description: "Bright and cheerful yellow apron with floral accents and scalloped sleeves. A kitchen staple with personality.",
    category: "Aprons",
  },
  {
    name: "Christmas Village Apron Set",
    image: christmasAprons,
    description: "A festive matching apron set in a charming Christmas village print with green polka dot ties and bow. Available in adult and child sizes, perfect for holiday cooking together.",
    category: "Aprons",
  },
  {
    name: "Men's Sage Corduroy Apron",
    image: mensSageApron,
    description: "A sturdy full-coverage men's apron in sage green corduroy with a relaxed fit and deep front pocket. Great for grilling or cooking.",
    category: "Aprons",
  },
  {
    name: "Teacher Apron — Sesame Street",
    image: teacherAprons,
    description: "A cheerful full-length teacher apron in a Sesame Street print with bright yellow or blue accents and a fun button detail. Perfect for classrooms or craft time.",
    category: "Aprons",
  },
  // QUILTS
  {
    name: "ABC & 123 Learning Quilt",
    image: abc1,
    images: [abc1, abc2, abc3],
    description: "A cheerful handmade patchwork quilt featuring letters, numbers, and playful learning-themed fabrics in bright blue and orange. Backed with soft royal blue minky dot fabric. Made with cotton and poly binding. Size 42 x 54 inches.",
    category: "Quilts",
    inStock: true,
  },
  {
    name: "Yellow & Grey Sloth Patchwork Quilt",
    image: sloth1,
    images: [sloth1, sloth2, sloth3],
    description: "A sweet and modern patchwork quilt in soft yellow and grey tones, featuring sloth, gingham, and polka dot fabrics. Backed with plush grey minky and finished with a yellow satin border. Made with cotton flannel, plush, and satin binding. Size 56 x 45 inches.",
    category: "Quilts",
    inStock: true,
  },
  {
    name: "Blue Floral Patchwork Quilt",
    image: blueFloral1,
    images: [blueFloral1, blueFloral2, blueFloral3],
    description: "A bright and cheerful handmade patchwork quilt in blue, white, and teal with floral and geometric print fabrics. Backed with soft lime green minky and finished with a ruffled satin border. A beautiful handmade piece built to be treasured for generations.",
    category: "Quilts",
    inStock: true,
  },
  {
    name: "Bee Happy Patchwork Quilt",
    image: beeHappy1,
    images: [beeHappy1, beeHappy2, beeHappy3],
    description: "A sweet handmade patchwork quilt featuring bears, bees, beehives, and uplifting 'bee happy, bee kind, bee brave' prints in teal, cream, and yellow. Backed with plush brown minky and finished with a black satin border. Made with cotton and polyester binding. Size 40 x 52 inches.",
    category: "Quilts",
    inStock: true,
  },
  {
    name: "Rainbow & Clouds Patchwork Quilt",
    image: rainbowClouds1,
    images: [rainbowClouds1, rainbowClouds2, rainbowClouds4],
    description: "A soft and sweet patchwork quilt featuring a rainbow and clouds panel design in pastel tones. Finished with a bright green satin border and backed with soft minky fabric. Made with cotton and poly binding. Size 44 x 54 inches. Perfect for your littlest one.",
    category: "Quilts",
    inStock: true,
  },
  {
    name: "Pinwheel Patchwork Quilt",
    image: imgE1544,
    description: "A cheerful handmade pinwheel quilt in classic primary colors. Each one is unique and made with love.",
    category: "Quilts",
  },
  {
    name: "Woodland Friends Quilt",
    image: imgE1550,
    description: "A sweet woodland animal themed quilt with a satin border, perfect for a nursery or child's room.",
    category: "Quilts",
  },
  {
    name: "Bright Bold Star Quilt",
    image: brightBoldQuilt,
    description: "A striking patchwork quilt featuring vibrant multi-colored star blocks on a deep black background with a bold blue inner border. A true showstopper.",
    category: "Quilts",
  },
  {
    name: "Bug's Life Quilt",
    image: bugsLifeQuilt,
    description: "A fun and colorful patchwork quilt with bug print fabric squares in red, orange, green, and cream, set in a grey grid. Perfect for a child's room.",
    category: "Quilts",
  },
  {
    name: "Farming Fun Quilt",
    image: farmingFunQuilt,
    description: "A bright and playful farm-themed quilt featuring barnyard animal prints, red, green, yellow, and black gingham blocks, with a crisp white sashing.",
    category: "Quilts",
  },
  {
    name: "Seashell Patchwork Quilt",
    image: seashellQuilt,
    description: "A soft and elegant patchwork quilt featuring seashell print fabric in lavender, grey, and sandy gold tones, finished with a silver satin border. Perfect for a coastal-inspired nursery or bedroom.",
    category: "Quilts",
  },
  {
    name: "Garden Floral Patchwork Quilt",
    image: gardenFloralQuilt,
    description: "A lush and romantic patchwork quilt made from an array of floral fabrics in pink, blue, green, and gold, finished with a soft white satin border. A timeless garden-inspired piece.",
    category: "Quilts",
  },
  {
    name: "Woodland Animals Quilt",
    image: woodlandAnimalsQuilt,
    description: "A charming quilt featuring illustrated woodland animals including foxes, deer, owls, raccoons, and hedgehogs framed in individual blocks with earthy green and brown borders, finished with a warm gold satin edge.",
    category: "Quilts",
  },
  {
    name: "Panda Friends Panel Quilt",
    image: img3365,
    description: "A sweet panel quilt featuring an adorable panda and whale panel set against soft pink polka dot fabric. A cheerful piece for a nursery or child's room.",
    category: "Quilts",
  },
  {
    name: "Penguin Winter Panel Baby Blanket",
    image: winterFriendsBlanket,
    description: "A charming double-sided baby blanket featuring a penguin and seal print on one side and a navy snowflake pattern on the other. A cozy winter-inspired piece.",
    category: "Baby Blankets",
  },
  {
    name: "Animal Friends Panel Quilt",
    image: img3363,
    description: "A sweet panel quilt featuring elephants, pandas, and giraffes. Handmade with care and built to be treasured for generations.",
    category: "Quilts",
  },
  // CAR SEAT COVERS
  {
    name: "Safari Animals Car Seat Cover",
    image: carseat,
    description: "A fun and functional car seat canopy in a bright safari animal print. Keeps baby cozy and protected.",
    category: "Car Seat Covers",
  },
  {
    name: "Black Polka Dot Car Seat Cover",
    image: blackPolkaCarseat,
    description: "A bold and classic car seat cover in black with white polka dots and a bright red lining. Handmade to fit most infant car seats. Perfect for keeping your little one cozy and covered on the go.",
    category: "Car Seat Covers",
  },
  {
    name: "Colorful Hearts Car Seat Cover",
    image: heartsCarseat,
    description: "A sweet and playful car seat cover featuring multicolored hearts on a soft grey background with a blush pink lining. Handmade to fit most infant car seats. A perfect gift for any new baby.",
    category: "Car Seat Covers",
  },
  {
    name: "Navy Axolotl Car Seat Cover",
    image: navyFloralCarseat,
    description: "A playful car seat cover in a rich navy blue with a sweet pink axolotl print. Handmade to fit most infant car seats. Whimsical, functional, and made with care for your little one.",
    category: "Car Seat Covers",
  },
  // BABY BLANKETS
  {
    name: "Bold Floral Baby Blanket",
    image: boldFloralBlanket,
    description: "A vibrant baby blanket in a bold floral print with red, blue, and orange blooms on a dark background, finished with a bright red satin border.",
    category: "Baby Blankets",
  },
  {
    name: "Christmas Woodland Animals Blanket",
    image: woodlandAnimalsBlanket,
    description: "A cozy double-sided baby blanket with festive woodland animals — foxes, raccoons, and bears — in holiday hats, finished with a rich red satin border.",
    category: "Baby Blankets",
  },
  {
    name: "Star is Born Baby Blanket Collection",
    image: starIsBornBlanket,
    description: "A soft and cozy baby blanket in a mint and aqua star print with a warm taupe satin border. Shown stacked in a curated collection — a sweet and timeless gift for a new arrival.",
    category: "Baby Blankets",
  },
  {
    name: "Adventure Kids Baby Blanket",
    image: adventureKidsLovey,
    description: "A fun and colorful baby blanket featuring bold prints including rainbows, crystals, dinosaurs, and space numbers on a dark navy background, finished with a bright green satin border.",
    category: "Baby Blankets",
  },
  {
    name: "Unicorn Dreams Baby Blanket",
    image: unicornDreamsLovey,
    description: "A whimsical baby blanket in vibrant teal with a tie-dye sunset print and crystal galaxy fabric panels, finished with a soft blush satin border. Perfect for imaginative little ones.",
    category: "Baby Blankets",
  },
  // LOVEYS
  {
    name: "Animal Lovey Blankets",
    image: entx,
    description: "Soft lovey security blankets with a plush animal head. Available in multiple animal styles and fabric patterns.",
    category: "Loveys",
  },
  {
    name: "Lovey Display Collection",
    image: img1480,
    description: "Choose your favorite animal friend. Each lovey is handmade with soft fabric panels and a plush stuffed head.",
    category: "Loveys",
  },
  {
    name: "Forest Friends Lovey Set",
    image: forestFriendsLovey,
    description: "Soft security lovey blankets each featuring an adorable plush animal head — elephant, fox, and husky — attached to a cozy fabric blanket in blue stars, bright green, and teal plaid. Choose your favorite animal friend.",
    category: "Loveys",
  },
  {
    name: "Puppy & Kitty Lovey Set",
    image: puppyKittyLovey,
    description: "Sweet and snuggly lovey blankets with plush husky, bunny, and golden puppy heads attached to soft blankets in taupe, blush pink, and baby blue. A precious gift for any new baby.",
    category: "Loveys",
  },
  {
    name: "Monkey Lovey Blanket",
    image: monkeyLovey,
    description: "An adorable lovey blanket featuring a plush brown monkey head attached to a rich burgundy fabric with a matching satin border. A unique and cuddly companion for little ones.",
    category: "Loveys",
  },
];

const ProductImageSlider = ({ images, alt }: { images: string[]; alt: string }) => {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const go = (next: number) => setIdx((next + images.length) % images.length);

  return (
    <div
      className="w-full h-full relative"
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
        touchStartX.current = null;
      }}
    >
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} – ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover [image-orientation:from-image] transition-opacity duration-300 ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
        />
      ))}
      <button
        type="button"
        aria-label="Previous image"
        onClick={(e) => {
          e.preventDefault();
          go(idx - 1);
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={(e) => {
          e.preventDefault();
          go(idx + 1);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to image ${i + 1}`}
            onClick={(e) => {
              e.preventDefault();
              setIdx(i);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === idx ? "bg-foreground w-4" : "bg-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const Shop = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") as Category | null;
  const [active, setActive] = useState<Category>(categoryParam && categories.includes(categoryParam) ? categoryParam : "All");

  useEffect(() => {
    if (categoryParam && categories.includes(categoryParam)) {
      setActive(categoryParam);
    }
  }, [categoryParam]);

  const filtered = active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <PatternStrip pattern="pattern1" />

        {/* Header */}
        <div className="bg-warm-linen py-16 md:py-20 px-6 text-center">

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
            Shop Handmade Goods
          </h1>
          <p className="font-body font-light text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Every piece is made by hand with care, love, and the finest fabrics.
          </p>
        </div>

        {/* Category filter */}
        <div className="bg-background border-b border-border sticky top-16 md:top-20 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-body text-sm transition-colors ${
                  active === cat
                    ? "bg-berry-red text-white"
                    : "bg-warm-linen text-foreground hover:bg-berry-red/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map((p, i) => (
              <div key={`${p.name}-${i}`} className="card-product group">
                <div className="aspect-[3/4] overflow-hidden relative bg-muted">
                  {p.images && p.images.length > 1 ? (
                    <ProductImageSlider images={p.images} alt={p.name} />
                  ) : p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 [image-orientation:from-image]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="font-display text-xl text-muted-foreground">Coming Soon</span>
                    </div>
                  )}
                  {p.comingSoon && (
                    <span className="absolute top-3 left-3 bg-foreground/80 text-background font-body text-xs px-3 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                  {!p.comingSoon && p.inStock && (
                    <span className="absolute top-3 right-3 bg-green-600 text-white font-body text-xs px-3 py-1 rounded-full">
                      1 Available
                    </span>
                  )}
                  {!p.comingSoon && !p.inStock && !p.hideStockBadge && (
                    <span className="absolute top-3 right-3 bg-muted-foreground text-white font-body text-xs px-3 py-1 rounded-full">
                      Sample Pattern
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                  {!p.comingSoon ? (
                    <Link
                      to="/contact#contact-form"
                      className="inline-block mt-2 bg-berry-red text-white font-body text-sm px-6 py-2.5 rounded-full hover:bg-berry-red/90 transition-colors"
                    >
                      Inquire to Purchase
                    </Link>
                  ) : (
                    <span className="inline-block mt-2 font-body text-xs text-muted-foreground italic">
                      New styles dropping soon.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <PatternStrip pattern="pattern2" />
      </div>
      <Footer />
    </div>
  );
};

export default Shop;

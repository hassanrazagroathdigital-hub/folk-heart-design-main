/**
 * Built-in content: exactly what the site showed before the CMS existed.
 *
 * Used for:
 *  1. The public fallback when Supabase is not configured / unreachable, or
 *     when a collection has never had any records saved.
 *  2. The optional, non-destructive "Import starter content" action in admin.
 *
 * Default records use ids prefixed with "default:" and `_source: "default"`,
 * so they can never be confused with — or written as — database rows.
 */
import type {
  Category,
  Faq,
  Product,
  PublicCategory,
  PublicFaq,
  PublicProduct,
  SiteSettings,
  StockStatus,
} from "./types";
import { slugify } from "./utils";

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

import logo from "@/assets/matka-me-logo.png";
import heroImg from "@/assets/hero-mom-child.jpg";
import emilyImg from "@/assets/emily.jpg";
import maryImg from "@/assets/mary.jpg";

/** Images that ship with the site, used when a settings image field is empty. */
export const BUILTIN_IMAGES = {
  logo,
  hero: heroImg,
  storyMembers: [emilyImg, maryImg],
};

export const DEFAULT_ID_PREFIX = "default:";
const EPOCH = "1970-01-01T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categorySeed: Array<{ name: string; image: string; description: string }> = [
  { name: "Aprons", image: aprons1, description: "Matching sets for mama and mini, plus individual adult and child styles." },
  { name: "Quilts", image: imgE1544, description: "Handmade quilts made to be loved for generations." },
  { name: "Baby Blankets", image: woodlandAnimalsBlanket, description: "Soft, cuddly blankets perfect for your littlest ones." },
  { name: "Car Seat Covers", image: carseat, description: "Handmade canopies to keep baby dry and warm on every outing." },
  { name: "Loveys", image: entx, description: "Soft security blankets with plush animal heads that babies adore." },
];

export const DEFAULT_CATEGORIES: PublicCategory[] = categorySeed.map((c, i) => {
  const slug = slugify(c.name);
  return {
    id: `${DEFAULT_ID_PREFIX}category:${slug}`,
    name: c.name,
    slug,
    description: c.description,
    image_url: c.image,
    fallback_image: c.image,
    sort_order: (i + 1) * 10,
    published: true,
    created_at: EPOCH,
    updated_at: EPOCH,
    _source: "default",
  };
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

interface ProductSeed {
  name: string;
  images: string[];
  description: string;
  category: string;
  stock?: StockStatus;
}

const productSeed: ProductSeed[] = [
  // APRONS
  { name: "Mama & Mini Bird Apron Set", images: [aprons1], category: "Aprons", description: "Handmade matching apron set in a gorgeous bird and floral print. Available in adult and child sizes, perfect for cooking together." },
  { name: "Red Floral Full Apron", images: [aprons2], category: "Aprons", description: "A vibrant red floral apron with a relaxed full coverage fit and generous pockets." },
  { name: "Sunshine Floral Apron", images: [aprons3], category: "Aprons", description: "Bright and cheerful yellow apron with floral accents and scalloped sleeves. A kitchen staple with personality." },
  { name: "Christmas Village Apron Set", images: [christmasAprons], category: "Aprons", description: "A festive matching apron set in a charming Christmas village print with green polka dot ties and bow. Available in adult and child sizes, perfect for holiday cooking together." },
  { name: "Men's Sage Corduroy Apron", images: [mensSageApron], category: "Aprons", description: "A sturdy full-coverage men's apron in sage green corduroy with a relaxed fit and deep front pocket. Great for grilling or cooking." },
  { name: "Teacher Apron — Sesame Street", images: [teacherAprons], category: "Aprons", description: "A cheerful full-length teacher apron in a Sesame Street print with bright yellow or blue accents and a fun button detail. Perfect for classrooms or craft time." },
  // QUILTS
  { name: "ABC & 123 Learning Quilt", images: [abc1, abc2, abc3], category: "Quilts", stock: "available", description: "A cheerful handmade patchwork quilt featuring letters, numbers, and playful learning-themed fabrics in bright blue and orange. Backed with soft royal blue minky dot fabric. Made with cotton and poly binding. Size 42 x 54 inches." },
  { name: "Yellow & Grey Sloth Patchwork Quilt", images: [sloth1, sloth2, sloth3], category: "Quilts", stock: "available", description: "A sweet and modern patchwork quilt in soft yellow and grey tones, featuring sloth, gingham, and polka dot fabrics. Backed with plush grey minky and finished with a yellow satin border. Made with cotton flannel, plush, and satin binding. Size 56 x 45 inches." },
  { name: "Blue Floral Patchwork Quilt", images: [blueFloral1, blueFloral2, blueFloral3], category: "Quilts", stock: "available", description: "A bright and cheerful handmade patchwork quilt in blue, white, and teal with floral and geometric print fabrics. Backed with soft lime green minky and finished with a ruffled satin border. A beautiful handmade piece built to be treasured for generations." },
  { name: "Bee Happy Patchwork Quilt", images: [beeHappy1, beeHappy2, beeHappy3], category: "Quilts", stock: "available", description: "A sweet handmade patchwork quilt featuring bears, bees, beehives, and uplifting 'bee happy, bee kind, bee brave' prints in teal, cream, and yellow. Backed with plush brown minky and finished with a black satin border. Made with cotton and polyester binding. Size 40 x 52 inches." },
  { name: "Rainbow & Clouds Patchwork Quilt", images: [rainbowClouds1, rainbowClouds2, rainbowClouds4], category: "Quilts", stock: "available", description: "A soft and sweet patchwork quilt featuring a rainbow and clouds panel design in pastel tones. Finished with a bright green satin border and backed with soft minky fabric. Made with cotton and poly binding. Size 44 x 54 inches. Perfect for your littlest one." },
  { name: "Pinwheel Patchwork Quilt", images: [imgE1544], category: "Quilts", description: "A cheerful handmade pinwheel quilt in classic primary colors. Each one is unique and made with love." },
  { name: "Woodland Friends Quilt", images: [imgE1550], category: "Quilts", description: "A sweet woodland animal themed quilt with a satin border, perfect for a nursery or child's room." },
  { name: "Bright Bold Star Quilt", images: [brightBoldQuilt], category: "Quilts", description: "A striking patchwork quilt featuring vibrant multi-colored star blocks on a deep black background with a bold blue inner border. A true showstopper." },
  { name: "Bug's Life Quilt", images: [bugsLifeQuilt], category: "Quilts", description: "A fun and colorful patchwork quilt with bug print fabric squares in red, orange, green, and cream, set in a grey grid. Perfect for a child's room." },
  { name: "Farming Fun Quilt", images: [farmingFunQuilt], category: "Quilts", description: "A bright and playful farm-themed quilt featuring barnyard animal prints, red, green, yellow, and black gingham blocks, with a crisp white sashing." },
  { name: "Seashell Patchwork Quilt", images: [seashellQuilt], category: "Quilts", description: "A soft and elegant patchwork quilt featuring seashell print fabric in lavender, grey, and sandy gold tones, finished with a silver satin border. Perfect for a coastal-inspired nursery or bedroom." },
  { name: "Garden Floral Patchwork Quilt", images: [gardenFloralQuilt], category: "Quilts", description: "A lush and romantic patchwork quilt made from an array of floral fabrics in pink, blue, green, and gold, finished with a soft white satin border. A timeless garden-inspired piece." },
  { name: "Woodland Animals Quilt", images: [woodlandAnimalsQuilt], category: "Quilts", description: "A charming quilt featuring illustrated woodland animals including foxes, deer, owls, raccoons, and hedgehogs framed in individual blocks with earthy green and brown borders, finished with a warm gold satin edge." },
  { name: "Panda Friends Panel Quilt", images: [img3365], category: "Quilts", description: "A sweet panel quilt featuring an adorable panda and whale panel set against soft pink polka dot fabric. A cheerful piece for a nursery or child's room." },
  { name: "Penguin Winter Panel Baby Blanket", images: [winterFriendsBlanket], category: "Baby Blankets", description: "A charming double-sided baby blanket featuring a penguin and seal print on one side and a navy snowflake pattern on the other. A cozy winter-inspired piece." },
  { name: "Animal Friends Panel Quilt", images: [img3363], category: "Quilts", description: "A sweet panel quilt featuring elephants, pandas, and giraffes. Handmade with care and built to be treasured for generations." },
  // CAR SEAT COVERS
  { name: "Safari Animals Car Seat Cover", images: [carseat], category: "Car Seat Covers", description: "A fun and functional car seat canopy in a bright safari animal print. Keeps baby cozy and protected." },
  { name: "Black Polka Dot Car Seat Cover", images: [blackPolkaCarseat], category: "Car Seat Covers", description: "A bold and classic car seat cover in black with white polka dots and a bright red lining. Handmade to fit most infant car seats. Perfect for keeping your little one cozy and covered on the go." },
  { name: "Colorful Hearts Car Seat Cover", images: [heartsCarseat], category: "Car Seat Covers", description: "A sweet and playful car seat cover featuring multicolored hearts on a soft grey background with a blush pink lining. Handmade to fit most infant car seats. A perfect gift for any new baby." },
  { name: "Navy Axolotl Car Seat Cover", images: [navyFloralCarseat], category: "Car Seat Covers", description: "A playful car seat cover in a rich navy blue with a sweet pink axolotl print. Handmade to fit most infant car seats. Whimsical, functional, and made with care for your little one." },
  // BABY BLANKETS
  { name: "Bold Floral Baby Blanket", images: [boldFloralBlanket], category: "Baby Blankets", description: "A vibrant baby blanket in a bold floral print with red, blue, and orange blooms on a dark background, finished with a bright red satin border." },
  { name: "Christmas Woodland Animals Blanket", images: [woodlandAnimalsBlanket], category: "Baby Blankets", description: "A cozy double-sided baby blanket with festive woodland animals — foxes, raccoons, and bears — in holiday hats, finished with a rich red satin border." },
  { name: "Star is Born Baby Blanket Collection", images: [starIsBornBlanket], category: "Baby Blankets", description: "A soft and cozy baby blanket in a mint and aqua star print with a warm taupe satin border. Shown stacked in a curated collection — a sweet and timeless gift for a new arrival." },
  { name: "Adventure Kids Baby Blanket", images: [adventureKidsLovey], category: "Baby Blankets", description: "A fun and colorful baby blanket featuring bold prints including rainbows, crystals, dinosaurs, and space numbers on a dark navy background, finished with a bright green satin border." },
  { name: "Unicorn Dreams Baby Blanket", images: [unicornDreamsLovey], category: "Baby Blankets", description: "A whimsical baby blanket in vibrant teal with a tie-dye sunset print and crystal galaxy fabric panels, finished with a soft blush satin border. Perfect for imaginative little ones." },
  // LOVEYS
  { name: "Animal Lovey Blankets", images: [entx], category: "Loveys", description: "Soft lovey security blankets with a plush animal head. Available in multiple animal styles and fabric patterns." },
  { name: "Lovey Display Collection", images: [img1480], category: "Loveys", description: "Choose your favorite animal friend. Each lovey is handmade with soft fabric panels and a plush stuffed head." },
  { name: "Forest Friends Lovey Set", images: [forestFriendsLovey], category: "Loveys", description: "Soft security lovey blankets each featuring an adorable plush animal head — elephant, fox, and husky — attached to a cozy fabric blanket in blue stars, bright green, and teal plaid. Choose your favorite animal friend." },
  { name: "Puppy & Kitty Lovey Set", images: [puppyKittyLovey], category: "Loveys", description: "Sweet and snuggly lovey blankets with plush husky, bunny, and golden puppy heads attached to soft blankets in taupe, blush pink, and baby blue. A precious gift for any new baby." },
  { name: "Monkey Lovey Blanket", images: [monkeyLovey], category: "Loveys", description: "An adorable lovey blanket featuring a plush brown monkey head attached to a rich burgundy fabric with a matching satin border. A unique and cuddly companion for little ones." },
];

export const DEFAULT_PRODUCTS: PublicProduct[] = productSeed.map((p, i) => {
  const slug = slugify(p.name);
  const category = DEFAULT_CATEGORIES.find((c) => c.name === p.category) ?? null;
  return {
    id: `${DEFAULT_ID_PREFIX}product:${slug}`,
    name: p.name,
    slug,
    description: p.description,
    category_id: category?.id ?? null,
    category_name: category?.name ?? null,
    category_slug: category?.slug ?? null,
    featured_image: p.images[0] ?? null,
    gallery_images: p.images,
    price: null,
    sale_price: null,
    sku: null,
    quantity: p.stock === "available" ? 1 : null,
    stock_status: p.stock ?? "sample",
    featured: false,
    sort_order: (i + 1) * 10,
    published: true,
    created_at: EPOCH,
    updated_at: EPOCH,
    _source: "default",
  };
});

// ---------------------------------------------------------------------------
// FAQs (from /custom-order)
// ---------------------------------------------------------------------------

const faqSeed: Array<Pick<Faq, "question" | "answer">> = [
  { question: "How long does a custom order take?", answer: "Most custom pieces are completed within 2 to 4 weeks depending on complexity and current order volume." },
  { question: "Can I choose my own fabric?", answer: "Absolutely. You can share a fabric you love, a color palette, or a theme and Emily will help you find the perfect match." },
  { question: "Do you ship?", answer: "Yes, we ship within the US." },
  { question: "What is your return policy on custom items?", answer: "Because each piece is custom made, we do not accept returns but we will always work with you to make it right." },
];

export const DEFAULT_FAQS: PublicFaq[] = faqSeed.map((f, i) => ({
  id: `${DEFAULT_ID_PREFIX}faq:${i + 1}`,
  question: f.question,
  answer: f.answer,
  sort_order: (i + 1) * 10,
  published: true,
  created_at: EPOCH,
  updated_at: EPOCH,
  _source: "default",
}));

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    name: "Matka & Me Threads",
    tagline: "Small-batch, big love. Handmade & one-of-a-kind.",
    logo_url: "",
    favicon_url: "",
  },
  contact: {
    email: "hello@matkaandmethreads.com",
    phone: "",
    location: "Handmade in the USA",
    instagram_handle: "matkaandmethreads",
    instagram_url: "https://instagram.com/matkaandmethreads",
    linktree_url: "https://linktr.ee/matkaandme",
  },
  hero: {
    headline: "Where every stitch carries love.",
    body:
      "\"Matka\" meaning Mother in Polish, is a tribute to the bond that inspired our journey. We create cozy blankets, timeless quilts, aprons, and other children's items — each made with care, creativity, attention to detail, and love.",
    note: "Each piece is one-of-a-kind. Inquire to purchase — no online checkout.",
    image_url: "",
    image_alt: "Mother and child in matching Matka & Me Threads outfits",
    primary_cta: "Browse Pieces",
    secondary_cta: "custom order",
  },
  home: {
    marquee:
      "✦ Matka & Me Threads ✦ One of a Kind · Handmade ✦ Pacific Northwest ✦ Mother & Child ✦ Made With Love ",
    collections_title: "Product Offerings",
    inquiry_eyebrow: "inquiries & custom orders",
    inquiry_title: "Let's Create Something Special",
    inquiry_body:
      "Want a custom piece/set or have questions about a product you see? Fill out the form below and Emily will get back to you personally.",
    inquiry_note: "Payment is handled personally via PayPal after Emily confirms your order.",
  },
  shop: {
    title: "Shop Handmade Goods",
    subtitle: "Every piece is made by hand with care, love, and the finest fabrics.",
  },
  story: {
    title: "Our Story",
    subtitle: "Made with love, stitch by stitch.",
    intro: "We believe the best gifts are handmade. Each item is made with care and meant to be treasured.",
    members: [
      {
        heading: "Hi, I'm Emily",
        body:
          "I started sewing as a way to express my creativity through fabric. Sewing together with my mom has become more than a hobby — it's our way of connecting, creating, and sharing something meaningful with others.\n\nCreating together has strengthened our bond, and each handmade piece carries that care, connection, and warmth.",
        image_url: "",
        image_alt: "Emily, founder of Matka & Me Threads",
      },
      {
        heading: "Hello, I'm Mary",
        body:
          "Over the years, my sewing has ranged from making my own clothes and clothes for my family to more artistically focused work. Working with my daughter Emily has been a joy as we create together pieces that are unique and crafted with love.\n\nNo two items are exactly the same and no item is perfect — just like us. But everything we make comes from our love for each other and our dedication to our craft and providing the highest quality product for you.",
        image_url: "",
        image_alt: "Mary, co-creator at Matka & Me Threads",
      },
    ],
    closing_title: "Ready to find your piece?",
  },
  contact_page: {
    title: "Say Hello",
    intro: "We would love to hear from you. Reach out with questions, custom order inquiries, or just to say hi.",
    closing_note:
      "Thank You For Supporting Handmade. Please Enjoy Our Quality Products Made With Love, From Our Home To Yours.",
  },
  custom_order: {
    title: "Let's Create Something Special",
    intro: "Every Matka and Me piece can be made just for you. Tell us your vision and we will bring it to life.",
    faq_title: "Frequently Asked Questions",
  },
  footer: {
    tagline: "Small-batch, big love. Handmade & one-of-a-kind.",
    about: "Small-batch, big love. Made in the Pacific Northwest by Emily Mooney and Mary Syslo.",
    copyright: "© {year} Matka & Me Threads. All rights reserved.",
  },
  seo: {
    title: "Matka & Me Threads — Handmade Matching Sets for Mom & Child",
    description:
      "Small-batch handmade matching outfits for mothers and their littles. Made with love in the Pacific Northwest by Matka & Me Threads.",
  },
};

/** Types used by the seeder: default rows without the presentation-only fields. */
export type SeedCategory = Pick<Category, "name" | "slug" | "description" | "image_url" | "sort_order" | "published">;
export type SeedProduct = Omit<Product, "id" | "created_at" | "updated_at" | "category_id"> & {
  category_slug: string | null;
};

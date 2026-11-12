import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PatternStrip from "@/components/PatternStrip";

import { usePublicCategories, usePublicProducts, useSiteSettings } from "@/lib/cms/hooks";
import type { PublicProduct } from "@/lib/cms/types";
import { Skeleton } from "@/components/ui/skeleton";

const ALL = "All";

const formatPrice = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 ? 2 : 0 });

/** Badge shown on the product image (same styles as before the CMS). */
const StockBadge = ({ p }: { p: PublicProduct }) => {
  switch (p.stock_status) {
    case "coming_soon":
      return (
        <span className="absolute top-3 left-3 bg-foreground/80 text-background font-body text-xs px-3 py-1 rounded-full">
          Coming Soon
        </span>
      );
    case "available":
      return (
        <span className="absolute top-3 right-3 bg-green-600 text-white font-body text-xs px-3 py-1 rounded-full">
          {p.quantity ?? 1} Available
        </span>
      );
    case "sample":
      return (
        <span className="absolute top-3 right-3 bg-muted-foreground text-white font-body text-xs px-3 py-1 rounded-full">
          Sample Pattern
        </span>
      );
    case "sold_out":
      return (
        <span className="absolute top-3 right-3 bg-foreground/80 text-background font-body text-xs px-3 py-1 rounded-full">
          Sold
        </span>
      );
    default:
      return null;
  }
};

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
  const settings = useSiteSettings();
  const { data: products = [], isLoading: productsLoading } = usePublicProducts();
  const { data: categoryRows = [] } = usePublicCategories();
  const categories = [ALL, ...categoryRows.map((c) => c.name)];

  // ?category= accepts the collection name (existing links) or its slug.
  const categoryParam = searchParams.get("category");
  const matchParam = (param: string | null) => {
    if (!param) return null;
    const p = param.toLowerCase();
    return categoryRows.find((c) => c.name.toLowerCase() === p || c.slug === p)?.name ?? null;
  };
  const [active, setActive] = useState<string>(ALL);

  useEffect(() => {
    const match = matchParam(categoryParam);
    if (match) setActive(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, categoryRows]);

  const ordered = active === ALL ? [...products].sort((a, b) => Number(b.featured) - Number(a.featured)) : products;
  const filtered = active === ALL ? ordered : ordered.filter((p) => p.category_name === active);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <PatternStrip pattern="pattern1" />

        {/* Header */}
        <div className="bg-warm-linen py-16 md:py-20 px-6 text-center">

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
            {settings.shop.title}
          </h1>
          <p className="font-body font-light text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            {settings.shop.subtitle}
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
          {productsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-product">
                  <Skeleton className="aspect-[3/4] rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="body-text text-center py-16">New pieces are on the way — check back soon.</p>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map((p) => {
              const images = p.gallery_images.length ? p.gallery_images : p.featured_image ? [p.featured_image] : [];
              const comingSoon = p.stock_status === "coming_soon";
              return (
              <div key={p.id} className="card-product group">
                <div className="aspect-[3/4] overflow-hidden relative bg-muted">
                  {images.length > 1 ? (
                    <ProductImageSlider images={images} alt={p.name} />
                  ) : images[0] ? (
                    <img
                      src={images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 [image-orientation:from-image]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="font-display text-xl text-muted-foreground">Coming Soon</span>
                    </div>
                  )}
                  <StockBadge p={p} />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                  {p.price !== null && (
                    <p className="font-body text-sm text-foreground">
                      {p.sale_price !== null ? (
                        <>
                          <span className="text-berry-red">{formatPrice(p.sale_price)}</span>{" "}
                          <span className="text-muted-foreground line-through">{formatPrice(p.price)}</span>
                        </>
                      ) : (
                        formatPrice(p.price)
                      )}
                    </p>
                  )}
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                  {!comingSoon ? (
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
              );
            })}
          </div>
          )}
        </div>

        <PatternStrip pattern="pattern2" />
      </div>
      <Footer />
    </div>
  );
};

export default Shop;

import { Link } from "react-router-dom";
import { usePublicCategories, useSiteSettings } from "@/lib/cms/hooks";
import { Skeleton } from "@/components/ui/skeleton";

const CollectionsSection = () => {
  const settings = useSiteSettings();
  const { data: collections = [], isLoading } = usePublicCategories();

  return (
    <section id="collections" className="bg-background py-20 md:py-28 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="section-title-italic mb-12">{settings.home.collections_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-product" aria-hidden="true">
                  <Skeleton className="aspect-[3/4] rounded-none" />
                  <div className="p-6 space-y-2">
                    <Skeleton className="h-6 w-1/2 mx-auto" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                </div>
              ))
            : collections.map((c) => {
                const image = c.image_url || c.fallback_image;
                return (
                  <Link key={c.id} to={`/shop?category=${encodeURIComponent(c.name)}`} className="card-product group block">
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      {image && (
                        <img
                          src={image}
                          alt={c.name}
                          className="w-full h-full object-cover transition-transform duration-500 [image-orientation:from-image]"
                          loading="lazy"
                          width={640}
                          height={860}
                        />
                      )}
                    </div>
                    <div className="p-6 space-y-2">
                      <span className="font-display text-xl text-foreground block">{c.name}</span>
                      <p className="font-body text-sm text-muted-foreground">{c.description}</p>
                      <span className="font-body text-sm text-primary group-hover:underline">Shop Collection →</span>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
};

export default CollectionsSection;

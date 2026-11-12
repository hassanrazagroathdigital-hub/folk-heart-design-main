import { Link } from "react-router-dom";
import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";
const products = [
  { name: "The Meadow Matching Set", price: "$68", image: product1, status: "available" },
  { name: "The Berry Dress — Mother & Child", price: "$54", image: product2, status: "available" },
  { name: "The Garden Romper", price: "$62", image: product3, status: "available" },
  { name: "The Linen Duo Set", price: "$72", image: product4, status: "available" },
];

const BestSellers = () => (
  <section id="best-sellers" className="bg-background py-20 md:py-28 px-6">
    <div className="max-w-7xl mx-auto">
      <h2 className="section-title text-center mb-4">One-of-a-Kind Pieces</h2>
      <p className="body-text text-center mb-12 max-w-xl mx-auto">
        Each piece is handmade and truly one-of-a-kind — once it's gone, it's gone.
        To purchase, reach out via email or Instagram DM.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.filter(p => p.status === "available").map((p) => (
          <Link key={p.name} to="/contact#contact-form" className="card-product group block">
            <div className="aspect-[3/4] overflow-hidden relative">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-500"
                loading="lazy"
                width={640}
                height={860}
              />
              <span className="absolute top-3 right-3 bg-leaf-green text-primary-foreground font-body text-xs px-3 py-1 rounded-full">
                1 Available
              </span>
            </div>
            <div className="p-4 space-y-1">
              <span className="font-display text-lg text-foreground block">{p.name}</span>
              <span className="font-body text-sm text-muted-foreground">{p.price}</span>
              <span className="font-body text-xs text-primary block group-hover:underline">Inquire to Purchase →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default BestSellers;

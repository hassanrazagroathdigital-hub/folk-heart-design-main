import { Link } from "react-router-dom";
import aprons1 from "@/assets/aprons1.jpg";
import imgE1544 from "@/assets/IMG_E1544.jpg";
import carseat from "@/assets/carseat.jpeg";
import entx from "@/assets/ENTX8511.jpg";
import babyBlanket from "@/assets/woodland-animals-blanket.jpg";


const collections = [
  { name: "Aprons", image: aprons1, desc: "Matching sets for mama and mini, plus individual adult and child styles.", filter: "Aprons" },
  { name: "Quilts", image: imgE1544, desc: "Handmade quilts made to be loved for generations.", filter: "Quilts" },
  { name: "Baby Blankets", image: babyBlanket, desc: "Soft, cuddly blankets perfect for your littlest ones.", filter: "Baby Blankets" },
  { name: "Car Seat Covers", image: carseat, desc: "Handmade canopies to keep baby dry and warm on every outing.", filter: "Car Seat Covers" },
  { name: "Loveys", image: entx, desc: "Soft security blankets with plush animal heads that babies adore.", filter: "Loveys" },
];

const CollectionsSection = () => (
  <section id="collections" className="bg-background py-20 md:py-28 px-6">
    <div className="max-w-7xl mx-auto text-center">
      <h2 className="section-title-italic mb-12">Product Offerings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {collections.map((c) => (
          <Link key={c.name} to={`/shop?category=${c.filter}`} className="card-product group block">
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={c.image}
                alt={c.name}
                className="w-full h-full object-cover transition-transform duration-500 [image-orientation:from-image]"
                loading="lazy"
                width={640}
                height={860}
              />
            </div>
            <div className="p-6 space-y-2">
              <span className="font-display text-xl text-foreground block">{c.name}</span>
              <p className="font-body text-sm text-muted-foreground">{c.desc}</p>
              <span className="font-body text-sm text-primary group-hover:underline">Shop Collection →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default CollectionsSection;

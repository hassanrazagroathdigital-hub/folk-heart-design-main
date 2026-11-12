import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeTicker from "@/components/MarqueeTicker";
import CollectionsSection from "@/components/CollectionsSection";
import PatternBanner from "@/components/PatternBanner";
import CustomOrderForm from "@/components/CustomOrderForm";
import InstagramSection from "@/components/InstagramSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <MarqueeTicker />
    <CollectionsSection />
    <PatternBanner />
    <CustomOrderForm />
    <InstagramSection />
    <Footer />
  </div>
);

export default Index;

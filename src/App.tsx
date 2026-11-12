import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import SiteHead from "./components/SiteHead.tsx";
import Shop from "./pages/Shop.tsx";
import OurStory from "./pages/OurStory.tsx";

import CustomOrder from "./pages/CustomOrder.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";

// The admin dashboard is code-split: public visitors never download it.
const AdminApp = lazy(() => import("./pages/admin/AdminApp.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <SiteHead />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/our-story" element={<OurStory />} />

          <Route path="/custom-order" element={<CustomOrder />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
                <AdminApp />
              </Suspense>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

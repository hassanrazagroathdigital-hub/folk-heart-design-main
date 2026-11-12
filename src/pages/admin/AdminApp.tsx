import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Database } from "lucide-react";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { Spinner } from "@/components/admin/ui";
import Login from "./Login";

const Dashboard = lazy(() => import("./Dashboard"));
const Products = lazy(() => import("./Products"));
const Collections = lazy(() => import("./Collections"));
const Faqs = lazy(() => import("./Faqs"));
const Inquiries = lazy(() => import("./Inquiries"));
const Media = lazy(() => import("./Media"));
const SettingsPage = lazy(() => import("./Settings"));

function PageFallback() {
  return (
    <div className="flex items-center gap-2 py-16 justify-center text-sm text-muted-foreground" role="status">
      <Spinner /> Loading…
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-body">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm">
        <Database className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold">Supabase isn't connected yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The dashboard needs a Supabase project. Add these to a <code>.env</code> file (or your hosting provider's
          environment settings), then rebuild and redeploy:
        </p>
        <pre className="mt-4 rounded-lg bg-muted p-3 text-xs overflow-x-auto">
          VITE_SUPABASE_URL=https://your-project.supabase.co{"\n"}VITE_SUPABASE_ANON_KEY=your-anon-key
        </pre>
        <p className="mt-4 text-sm text-muted-foreground">See README.md → "CMS setup" for step-by-step instructions.</p>
      </div>
    </div>
  );
}

export default function AdminApp() {
  // Scope the admin theme to <html> while mounted so portalled dialogs get it too.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("admin-theme");
    const prevTitle = document.title;
    document.title = "Admin · Matka & Me Threads";
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !robots;
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    const prevRobots = robots.content;
    robots.content = "noindex, nofollow";
    return () => {
      root.classList.remove("admin-theme");
      document.title = prevTitle;
      if (created) robots?.remove();
      else if (robots) robots.content = prevRobots;
    };
  }, []);

  if (!isSupabaseConfigured) return <NotConfigured />;

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageFallback />}><Products /></Suspense>} />
          <Route path="collections" element={<Suspense fallback={<PageFallback />}><Collections /></Suspense>} />
          <Route path="faqs" element={<Suspense fallback={<PageFallback />}><Faqs /></Suspense>} />
          <Route path="inquiries" element={<Suspense fallback={<PageFallback />}><Inquiries /></Suspense>} />
          <Route path="media" element={<Suspense fallback={<PageFallback />}><Media /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}


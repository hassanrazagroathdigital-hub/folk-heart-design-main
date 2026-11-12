import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { FullPageSpinner } from "./ui";

/**
 * UI-level guard for admin pages. This only controls what is *shown*; the
 * real protection is Row Level Security in the database, which rejects
 * every write (and private read) from non-admins regardless of the UI.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading, adminStatus, sessionExpired, signOut, recheckAdmin, user } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Checking your session…" />;

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}${sessionExpired ? "&expired=1" : ""}`} replace />;
  }

  if (adminStatus === "unknown" || adminStatus === "checking") {
    return <FullPageSpinner label="Checking permissions…" />;
  }

  if (adminStatus === "error") {
    return (
      <Centered
        title="Couldn't verify your permissions"
        body="We couldn't reach the server to confirm your admin access. Check your connection and try again."
        actions={
          <>
            <Button onClick={recheckAdmin}>Try again</Button>
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          </>
        }
      />
    );
  }

  if (adminStatus === "not_admin") {
    return (
      <Centered
        title="You don't have admin access"
        body={
          <>
            You're signed in as <strong>{user?.email}</strong>, but this account isn't an administrator for this
            website. Ask the site owner to add you, then sign in again.
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
            <Button variant="ghost" asChild>
              <a href="/">Back to website</a>
            </Button>
          </>
        }
      />
    );
  }

  return <>{children}</>;
}

function Centered({ title, body, actions }: { title: string; body: ReactNode; actions: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-body">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <ShieldAlert className="h-6 w-6 text-amber-600" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { friendlyError } from "@/lib/cms/errors";
import logo from "@/assets/matka-me-logo.png";

/** Only allow redirecting back to admin pages (prevents open redirects). */
function safeNext(value: string | null): string {
  if (value && value.startsWith("/admin") && !value.startsWith("//")) return value;
  return "/admin";
}

export default function Login() {
  const { session, loading, signIn } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const expired = params.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to={next} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "";
      if (/invalid login credentials/i.test(msg)) setError("Incorrect email or password.");
      else if (/email not confirmed/i.test(msg)) setError("This email address hasn't been confirmed yet.");
      else if (/rate limit|too many/i.test(msg)) setError("Too many sign-in attempts. Please wait a few minutes.");
      else setError(friendlyError(err, "Couldn't sign in. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 font-body">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logo} alt="Matka & Me Threads" className="h-12 w-auto" />
          <h1 className="mt-6 text-xl font-semibold">Sign in to the dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage products, inquiries and website content.</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          {expired && !error && (
            <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800" role="status">
              <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              Your session ended. Please sign in again.
            </div>
          )}
          {error && (
            <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Spinner className="mr-2" />}
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground hover:underline">
            ← Back to website
          </a>
        </p>
      </div>
    </div>
  );
}

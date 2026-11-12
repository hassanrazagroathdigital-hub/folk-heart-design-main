import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

type AdminStatus = "unknown" | "checking" | "admin" | "not_admin" | "error";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been restored. */
  loading: boolean;
  adminStatus: AdminStatus;
  /** Set when a previously signed-in session ends without the user signing out. */
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  recheckAdmin: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>("unknown");
  const [sessionExpired, setSessionExpired] = useState(false);
  const signingOut = useRef(false);
  const checkSeq = useRef(0);

  const checkAdmin = useCallback(async (s: Session | null) => {
    const seq = ++checkSeq.current;
    if (!supabase || !s) {
      setAdminStatus("unknown");
      return;
    }
    setAdminStatus("checking");
    // The server decides: is_admin() reads admin_users using the verified JWT.
    const { data, error } = await supabase.rpc("is_admin");
    if (seq !== checkSeq.current) return;
    if (error) setAdminStatus("error");
    else setAdminStatus(data === true ? "admin" : "not_admin");
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      void checkAdmin(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession((prev) => {
        if (event === "SIGNED_OUT" && prev && !signingOut.current) setSessionExpired(true);
        return next;
      });
      if (event === "SIGNED_IN") setSessionExpired(false);
      if (event === "SIGNED_OUT") {
        // Drop any cached private data (inquiries etc.) from memory.
        qc.removeQueries({ queryKey: ["admin"] });
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void checkAdmin(next);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin, qc]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("supabase_not_configured");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    signingOut.current = true;
    try {
      await supabase.auth.signOut();
    } finally {
      signingOut.current = false;
      setSessionExpired(false);
      qc.removeQueries({ queryKey: ["admin"] });
    }
  }, [qc]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      adminStatus,
      sessionExpired,
      signIn,
      signOut,
      recheckAdmin: () => void checkAdmin(session),
    }),
    [session, loading, adminStatus, sessionExpired, signIn, signOut, checkAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { loadAccount, type AccountRecord } from "./account.functions";
import type { UserRole } from "@/types";

interface AuthState {
  session: Session | null;
  /** True until the initial session lookup has settled. */
  sessionLoading: boolean;
  isAuthenticated: boolean;
  account: AccountRecord | null;
  accountLoading: boolean;
  role: UserRole | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setSessionLoading(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [queryClient, router]);

  const userId = session?.user.id ?? null;

  const accountQuery = useQuery({
    queryKey: ["account", userId],
    queryFn: () => loadAccount(),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo<AuthState>(
    () => ({
      session,
      sessionLoading,
      isAuthenticated: Boolean(session),
      account: accountQuery.data ?? null,
      accountLoading: Boolean(userId) && accountQuery.isPending,
      role: accountQuery.data?.role ?? null,
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    }),
    [session, sessionLoading, accountQuery.data, accountQuery.isPending, userId, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export const roleHome: Record<UserRole, string> = {
  donor: "/donor",
  ngo: "/ngo",
  volunteer: "/volunteer",
  admin: "/admin",
};

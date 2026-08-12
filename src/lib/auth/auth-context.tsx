import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserProfile, UserRole } from "@/types";

/**
 * Authentication boundary.
 *
 * No real authentication is wired yet. This context exists so that role-aware
 * UI has a single source of truth to read from; once a backend is connected,
 * only this provider needs to change.
 */
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** Lets the UI preview a role-specific area while auth is not implemented. */
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  const value = useMemo<AuthState>(
    () => ({ user: null, isAuthenticated: false, previewRole, setPreviewRole }),
    [previewRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

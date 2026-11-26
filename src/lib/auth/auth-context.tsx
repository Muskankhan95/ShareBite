"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, UserRole } from "@/types/user";
import { AuthContextType, RegisterData } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount, check active session from server via HTTP-only cookie
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed. Please check your credentials." };
      }

      setUser(data.user);
      return { success: true, destination: data.destination };
    } catch (err) {
      return { success: false, error: "Network error occurred. Please try again." };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed." };
      }

      setUser(data.user);
      return { success: true, destination: data.destination };
    } catch (err) {
      return { success: false, error: "Network error occurred. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  const quickLoginAs = async (role: UserRole) => {
    const demoCredentials: Record<UserRole, { email: string; pass: string }> = {
      donor: { email: "donor@sharebite.org", pass: "password123" },
      ngo: { email: "ngo@sharebite.org", pass: "password123" },
      volunteer: { email: "volunteer@sharebite.org", pass: "password123" },
      admin: { email: "admin@sharebite.org", pass: "password123" },
    };

    const target = demoCredentials[role];
    if (target) {
      const res = await login(target.email, target.pass);
      if (res.success && res.destination) {
        router.push(res.destination);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

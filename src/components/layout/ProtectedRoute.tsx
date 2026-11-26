"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/types/user";
import { ShieldAlert, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  requiredRole: UserRole;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (role !== requiredRole) {
        router.push(`/${role}/dashboard`);
      }
    }
  }, [isLoading, isAuthenticated, user, role, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-800">Verifying session...</p>
          <p className="text-xs text-slate-500">Checking authorization credentials</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || role !== requiredRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border border-rose-200 shadow-sm max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-600">
            This workspace requires <strong>{requiredRole.toUpperCase()}</strong> permissions. Redirecting you to your designated dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/types/user";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RoleSwitcherBanner } from "@/components/shared/RoleSwitcherBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  HeartHandshake,
  Utensils,
  Building2,
  Bike,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lock,
  Mail,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get("redirect");
  const { login, quickLoginAs, isAuthenticated, user, role } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState<UserRole | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && role) {
      router.push(redirectPath || `/${role}/dashboard`);
    }
  }, [isAuthenticated, role, router, redirectPath]);

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setServerError("");

    const emailTrim = email.trim();
    if (!emailTrim) {
      setEmailError("Email address is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setEmailError("Please enter a valid email address (e.g. name@domain.com).");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError("");

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setServerError(result.error || "Invalid email or password.");
      } else {
        router.push(redirectPath || result.destination || "/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: UserRole, demoEmail: string) => {
    setQuickLoadingRole(demoRole);
    setServerError("");
    setEmail(demoEmail);
    setPassword("password123");
    try {
      const result = await login(demoEmail, "password123");
      if (result.success) {
        router.push(redirectPath || result.destination || `/${demoRole}/dashboard`);
      } else {
        setServerError(result.error || "Demo login failed.");
      }
    } finally {
      setQuickLoadingRole(null);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign In to ShareBite
        </h1>
        <p className="text-xs text-slate-500">
          Access your role-specific dashboard with secure authentication
        </p>
      </div>

      <Card className="shadow-lg border-slate-200">
        <CardContent className="p-6 sm:p-8 space-y-5">
          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@organization.org"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
                if (serverError) setServerError("");
              }}
              error={emailError}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
                if (serverError) setServerError("");
              }}
              error={passwordError}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-emerald-600" defaultChecked />
                <span>Keep me signed in</span>
              </label>
              <span className="text-emerald-700 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              size="md"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Pre-filled Logins */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Instant Demo Access
              </p>
              <span className="text-[10px] text-slate-400">Pre-hashed credentials</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading || !!quickLoadingRole}
                onClick={() => handleQuickDemo("donor", "donor@sharebite.org")}
                className="p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Donor</span>
                </div>
                {quickLoadingRole === "donor" && <span className="text-[10px]">...</span>}
              </button>

              <button
                type="button"
                disabled={isLoading || !!quickLoadingRole}
                onClick={() => handleQuickDemo("ngo", "ngo@sharebite.org")}
                className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-800 border border-blue-200 text-xs font-semibold flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">NGO</span>
                </div>
                {quickLoadingRole === "ngo" && <span className="text-[10px]">...</span>}
              </button>

              <button
                type="button"
                disabled={isLoading || !!quickLoadingRole}
                onClick={() => handleQuickDemo("volunteer", "volunteer@sharebite.org")}
                className="p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Bike className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Volunteer</span>
                </div>
                {quickLoadingRole === "volunteer" && <span className="text-[10px]">...</span>}
              </button>

              <button
                type="button"
                disabled={isLoading || !!quickLoadingRole}
                onClick={() => handleQuickDemo("admin", "admin@sharebite.org")}
                className="p-2.5 rounded-lg bg-purple-50 hover:bg-purple-100/80 text-purple-800 border border-purple-200 text-xs font-semibold flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Admin</span>
                </div>
                {quickLoadingRole === "admin" && <span className="text-[10px]">...</span>}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500">
        Don't have an account yet?{" "}
        <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <RoleSwitcherBanner />
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

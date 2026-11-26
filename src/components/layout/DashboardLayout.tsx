"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserRole } from "@/types/user";
import { Sidebar } from "./Sidebar";
import { RoleSwitcherBanner } from "../shared/RoleSwitcherBanner";
import { ProtectedRoute } from "./ProtectedRoute";
import { NotificationDropdown } from "../shared/NotificationDropdown";
import { Menu, X, Bell, Globe, Sparkles, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface DashboardLayoutProps {
  role: UserRole;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  title,
  description,
  action,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole={role}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top Interactive Demo Persona Switcher */}
        <RoleSwitcherBanner />

        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block shrink-0">
            <Sidebar role={role} />
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-xl">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Sidebar role={role} onItemClick={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Dashboard Header Bar */}
            <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
                    {description && (
                      <p className="text-xs text-slate-500 hidden sm:block">{description}</p>
                    )}
                  </div>
                </div>

                {/* Header Right Actions */}
                <div className="flex items-center gap-3">
                  {action && <div className="hidden sm:block">{action}</div>}

                  <Link
                    href="/"
                    className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-100/80 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public Site</span>
                  </Link>

                  <NotificationDropdown />
                </div>
              </div>

              {/* Mobile action bar */}
              {action && <div className="sm:hidden mt-3 pt-3 border-t border-slate-100">{action}</div>}
            </header>

            {/* Page Body */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

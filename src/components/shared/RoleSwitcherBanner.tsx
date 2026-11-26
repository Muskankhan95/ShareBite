"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/types/user";
import { Sparkles, Utensils, Building2, Bike, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export const RoleSwitcherBanner: React.FC = () => {
  const { role, quickLoginAs, user } = useAuth();
  const [switching, setSwitching] = useState<UserRole | null>(null);

  const rolesConfig: { id: UserRole; label: string; icon: React.ReactNode; dashboardHref: string }[] = [
    {
      id: "donor",
      label: "Donor",
      icon: <Utensils className="w-3.5 h-3.5" />,
      dashboardHref: "/donor/dashboard",
    },
    {
      id: "ngo",
      label: "NGO",
      icon: <Building2 className="w-3.5 h-3.5" />,
      dashboardHref: "/ngo/dashboard",
    },
    {
      id: "volunteer",
      label: "Volunteer",
      icon: <Bike className="w-3.5 h-3.5" />,
      dashboardHref: "/volunteer/dashboard",
    },
    {
      id: "admin",
      label: "Admin",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      dashboardHref: "/admin/dashboard",
    },
  ];

  const handleRoleSelect = async (targetRole: UserRole) => {
    if (role === targetRole) return;
    setSwitching(targetRole);
    try {
      await quickLoginAs(targetRole);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-medium text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Active Role
          </span>
          <span className="text-slate-300 font-semibold uppercase">
            {role ? `${role} (${user?.name || user?.email})` : "Guest / Not Logged In"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="hidden md:inline text-slate-400 mr-1 text-[11px]">
            Switch Account:
          </span>
          {rolesConfig.map((r) => {
            const isActive = role === r.id;
            const isTargetSwitching = switching === r.id;
            return (
              <button
                key={r.id}
                disabled={isTargetSwitching}
                onClick={() => handleRoleSelect(r.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs cursor-default"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {isTargetSwitching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  r.icon
                )}
                <span>{r.label}</span>
              </button>
            );
          })}

          <Link
            href="/"
            className="text-slate-400 hover:text-white px-2 py-1 rounded transition-colors text-xs inline-flex items-center gap-1 ml-1"
          >
            Public Site <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

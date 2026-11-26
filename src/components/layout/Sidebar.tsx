"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/types/user";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Clock,
  User,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Archive,
  Building2,
  Bike,
  Navigation,
  CheckSquare,
  UserCheck,
  ShieldAlert,
  Users,
  Building,
  PackageCheck,
  HeartHandshake,
  AlertTriangle,
  BarChart3,
  LogOut,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  donorNavItems,
  ngoNavItems,
  volunteerNavItems,
  adminNavItems,
  NavItem,
} from "@/config/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  PlusCircle: <PlusCircle className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  User: <User className="w-4 h-4" />,
  MapPin: <MapPin className="w-4 h-4" />,
  ClipboardList: <ClipboardList className="w-4 h-4" />,
  CheckCircle2: <CheckCircle2 className="w-4 h-4" />,
  Archive: <Archive className="w-4 h-4" />,
  Building2: <Building2 className="w-4 h-4" />,
  Bike: <Bike className="w-4 h-4" />,
  Navigation: <Navigation className="w-4 h-4" />,
  CheckSquare: <CheckSquare className="w-4 h-4" />,
  UserCheck: <UserCheck className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Building: <Building className="w-4 h-4" />,
  PackageCheck: <PackageCheck className="w-4 h-4" />,
  HeartHandshake: <HeartHandshake className="w-4 h-4" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
};

interface SidebarProps {
  role: UserRole;
  onItemClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, onItemClick }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  let navItems: NavItem[] = [];
  let roleTitle = "";
  let roleBadgeColor = "";

  switch (role) {
    case "donor":
      navItems = donorNavItems;
      roleTitle = "Donor Portal";
      roleBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
      break;
    case "ngo":
      navItems = ngoNavItems;
      roleTitle = "NGO Network";
      roleBadgeColor = "bg-blue-100 text-blue-800 border-blue-300";
      break;
    case "volunteer":
      navItems = volunteerNavItems;
      roleTitle = "Volunteer Hub";
      roleBadgeColor = "bg-amber-100 text-amber-800 border-amber-300";
      break;
    case "admin":
      navItems = adminNavItems;
      roleTitle = "Admin Console";
      roleBadgeColor = "bg-purple-100 text-purple-800 border-purple-300";
      break;
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col justify-between select-none">
      <div>
        {/* Portal Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${roleBadgeColor}`}
            >
              {role.toUpperCase()}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{roleTitle}</h2>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {user?.organizationName || user?.name || "Active Session"}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                    }
                  >
                    {ICON_MAP[item.iconName] || <ChevronRight className="w-4 h-4" />}
                  </span>
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-emerald-200 text-emerald-900"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name[0] : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || "Authenticated"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
        title="Confirm Sign Out"
        description="Are you sure you want to end your current session?"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
              {user?.name ? user.name[0] : "U"}
            </div>
            <div className="overflow-hidden text-xs">
              <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-slate-500 truncate">{user?.email}</p>
              <p className="text-emerald-700 font-bold uppercase mt-0.5">Role: {role}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            You will need to enter your credentials or select an authenticated account to access this dashboard again.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutConfirm(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmLogout}
              isLoading={isLoggingOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </aside>
  );
};
